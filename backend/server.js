import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const requiredEnvironment = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
];
const missingEnvironment = requiredEnvironment.filter((name) => !process.env[name]);

if (missingEnvironment.length) {
  throw new Error(`Missing required environment variables: ${missingEnvironment.join(', ')}`);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);
const app = express();
const PROMPTPAY_QR_TTL_MS = 5 * 60 * 1000;
const MIN_PROMPTPAY_AMOUNT_SATANG = 1000;
const orderIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function getAuthorizedOrder(req, res, orderId) {
  const authorization = req.headers.authorization || '';
  const accessToken = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : '';
  if (!accessToken) {
    res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อนชำระเงิน' });
    return null;
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
  if (authError || !user) {
    res.status(401).json({ error: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่' });
    return null;
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id,customer_id,total,status,shipping_name')
    .eq('id', orderId)
    .maybeSingle();
  if (orderError) throw orderError;
  if (!order) {
    res.status(404).json({ error: 'ไม่พบคำสั่งซื้อ' });
    return null;
  }

  let customerEmail = user.email;
  if (order.customer_id !== user.id) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    if (profileError) throw profileError;
    if (profile?.role !== 'admin') {
      res.status(403).json({ error: 'ไม่มีสิทธิ์สร้าง QR สำหรับคำสั่งซื้อนี้' });
      return null;
    }

    const { data: customerData, error: customerError } = await supabase.auth.admin.getUserById(order.customer_id);
    if (customerError) throw customerError;
    customerEmail = customerData.user?.email;
  }

  if (!customerEmail) {
    res.status(400).json({ error: 'ไม่พบอีเมลของลูกค้าสำหรับสร้างรายการ PromptPay' });
    return null;
  }

  const { data: orderItems, error: itemsError } = await supabase
    .from('order_items')
    .select('product_name,quantity,unit_price,line_total')
    .eq('order_id', order.id)
    .order('created_at', { ascending: true });
  if (itemsError) throw itemsError;
  if (!orderItems?.length) {
    res.status(400).json({ error: 'คำสั่งซื้อนี้ไม่มีรายการสินค้า' });
    return null;
  }

  const itemsTotal = orderItems.reduce((total, item) => total + Math.round(Number(item.line_total) * 100), 0);
  if (itemsTotal !== Math.round(Number(order.total) * 100)) {
    res.status(409).json({ error: 'ยอดรวมรายการสินค้าไม่ตรงกับยอดคำสั่งซื้อ' });
    return null;
  }

  return {
    order,
    customerEmail,
    orderItems: orderItems.map((item) => ({
      name: item.product_name,
      quantity: item.quantity,
      unitPrice: Number(item.unit_price),
      lineTotal: Number(item.line_total),
    })),
  };
}

function promptPayResponse(paymentIntent, orderItems, expiresAt) {
  const qrCode = paymentIntent.next_action?.promptpay_display_qr_code;
  return {
    success: true,
    paymentIntentId: paymentIntent.id,
    status: paymentIntent.status,
    expiresAt,
    amountInBaht: paymentIntent.amount / 100,
    orderItems,
    qrCodeUrl: qrCode?.image_url_png || null,
    hostedInstructionsUrl: qrCode?.hosted_instructions_url || null,
  };
}

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST'],
}));

app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured');
    return res.status(503).json({ error: 'Webhook is not configured' });
  }

  let event;
  try {
    const signature = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (error) {
    console.error('Invalid Stripe webhook signature:', error.message);
    return res.status(400).send('Invalid webhook signature');
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata?.order_id;
      const customerId = paymentIntent.metadata?.customer_id;

      if (!orderId || !customerId || paymentIntent.currency !== 'thb') {
        console.error('Stripe payment intent is missing valid order metadata');
        return res.status(400).send('Invalid payment metadata');
      }

      const { data: payment, error: paymentLookupError } = await supabase
        .from('payments')
        .select('id,order_id,customer_id,amount,status')
        .eq('reference', paymentIntent.id)
        .eq('method', 'gateway')
        .maybeSingle();

      if (paymentLookupError) {
        console.error('Could not find payment for Stripe event:', paymentLookupError.message);
        return res.status(500).send('Could not find payment');
      }
      if (!payment || payment.order_id !== orderId || payment.customer_id !== customerId
        || Math.round(Number(payment.amount) * 100) !== paymentIntent.amount
        || Math.round(Number(payment.amount) * 100) !== paymentIntent.amount_received) {
        console.error('Stripe payment amount or order does not match the stored payment');
        return res.status(400).send('Payment does not match');
      }

      if (payment.status !== 'verified') {
        const { error: orderError } = await supabase
          .from('orders')
          .update({ status: 'confirmed' })
          .eq('id', orderId)
          .eq('status', 'pending');
        if (orderError) {
          console.error('Could not confirm paid order:', orderError.message);
          return res.status(500).send('Could not confirm order');
        }

        const { error: paymentError } = await supabase
          .from('payments')
          .update({ status: 'verified', paid_at: new Date().toISOString() })
          .eq('id', payment.id);
        if (paymentError) {
          console.error('Could not mark payment as verified:', paymentError.message);
          return res.status(500).send('Could not update payment');
        }
      }
    }

    return res.json({ received: true });
  } catch (error) {
    console.error('Error processing Stripe webhook:', error);
    return res.status(500).send('Webhook processing failed');
  }
});

app.use(express.json({ limit: '16kb' }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.post('/api/create-promptpay-qr', async (req, res) => {
  const { orderId } = req.body || {};

  if (typeof orderId !== 'string' || !orderIdPattern.test(orderId)) {
    return res.status(400).json({ error: 'ไม่พบหมายเลขคำสั่งซื้อที่ถูกต้อง' });
  }

  try {
    const authorized = await getAuthorizedOrder(req, res, orderId);
    if (!authorized) return undefined;
    const { order, customerEmail, orderItems } = authorized;
    if (order.status !== 'pending') {
      return res.status(409).json({ error: 'คำสั่งซื้อนี้ไม่อยู่ในสถานะที่ชำระเงินได้' });
    }

    const amountInSatang = Math.round(Number(order.total) * 100);
    if (!Number.isSafeInteger(amountInSatang) || amountInSatang < 1) {
      return res.status(400).json({ error: 'ยอดคำสั่งซื้อไม่ถูกต้อง' });
    }
    if (amountInSatang < MIN_PROMPTPAY_AMOUNT_SATANG) {
      return res.status(400).json({ error: 'ยอดชำระ PromptPay ขั้นต่ำ 10 บาท กรุณาเพิ่มสินค้าในคำสั่งซื้อ' });
    }

    const { data: priorPayments, error: priorPaymentError } = await supabase
      .from('payments')
      .select('id,reference,created_at')
      .eq('order_id', order.id)
      .eq('method', 'gateway')
      .eq('status', 'submitted')
      .order('created_at', { ascending: false })
      .limit(1);

    if (priorPaymentError) throw priorPaymentError;
    const priorPayment = priorPayments?.[0];
    if (priorPayment?.reference) {
      const priorExpiry = new Date(new Date(priorPayment.created_at).getTime() + PROMPTPAY_QR_TTL_MS);
      const priorIsExpired = priorExpiry.getTime() <= Date.now();
      const existingIntent = await stripe.paymentIntents.retrieve(priorPayment.reference);
      if (existingIntent.status === 'succeeded') {
        return res.json(promptPayResponse(existingIntent, orderItems, priorExpiry.toISOString()));
      }
      if (!priorIsExpired && existingIntent.status !== 'canceled'
        && existingIntent.amount === amountInSatang
        && existingIntent.currency === 'thb') {
        const existingQr = existingIntent.next_action?.promptpay_display_qr_code;
        if (existingIntent.status === 'succeeded' || existingQr) {
          return res.json(promptPayResponse(existingIntent, orderItems, priorExpiry.toISOString()));
        }
        if (existingIntent.status === 'requires_payment_method') {
          const confirmedIntent = await stripe.paymentIntents.confirm(existingIntent.id, {
            payment_method_data: {
              type: 'promptpay',
              billing_details: { email: customerEmail, name: order.shipping_name },
            },
          });
          if (confirmedIntent.status === 'succeeded'
            || confirmedIntent.next_action?.promptpay_display_qr_code) {
            return res.json(promptPayResponse(confirmedIntent, orderItems, priorExpiry.toISOString()));
          }
        }
      }

      if (existingIntent.status !== 'canceled' && existingIntent.status !== 'succeeded') {
        await stripe.paymentIntents.cancel(existingIntent.id);
      }
      const { error: rejectError } = await supabase
        .from('payments')
        .update({ status: 'rejected' })
        .eq('id', priorPayment.id);
      if (rejectError) throw rejectError;
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInSatang,
      currency: 'thb',
      payment_method_types: ['promptpay'],
      payment_method_data: {
        type: 'promptpay',
        billing_details: { email: customerEmail, name: order.shipping_name },
      },
      confirm: true,
      metadata: { order_id: order.id, customer_id: order.customer_id },
    });
    if (paymentIntent.status !== 'succeeded'
      && !paymentIntent.next_action?.promptpay_display_qr_code?.image_url_png) {
      if (paymentIntent.status !== 'canceled') {
        await stripe.paymentIntents.cancel(paymentIntent.id);
      }
      return res.status(502).json({ error: 'Stripe ไม่ได้ส่งลิงก์ QR PromptPay กลับมา' });
    }

    const createdAt = new Date().toISOString();
    const expiresAt = new Date(new Date(createdAt).getTime() + PROMPTPAY_QR_TTL_MS).toISOString();
    const { error: insertPaymentError } = await supabase.from('payments').insert({
      order_id: order.id,
      customer_id: order.customer_id,
      amount: amountInSatang / 100,
      method: 'gateway',
      status: 'submitted',
      reference: paymentIntent.id,
      created_at: createdAt,
    });

    if (insertPaymentError) {
      await stripe.paymentIntents.cancel(paymentIntent.id);
      throw insertPaymentError;
    }

    return res.json(promptPayResponse(paymentIntent, orderItems, expiresAt));
  } catch (error) {
    console.error('Error creating PromptPay payment:', error);
    return res.status(500).json({ error: 'สร้างรายการชำระเงินไม่สำเร็จ กรุณาลองอีกครั้ง' });
  }
});

app.get('/api/orders/:orderId/payment-status', async (req, res) => {
  const { orderId } = req.params;
  if (!orderIdPattern.test(orderId)) {
    return res.status(400).json({ error: 'ไม่พบหมายเลขคำสั่งซื้อที่ถูกต้อง' });
  }

  try {
    const authorized = await getAuthorizedOrder(req, res, orderId);
    if (!authorized) return undefined;

    const { data: payments, error } = await supabase
      .from('payments')
      .select('id,status,reference,created_at')
      .eq('order_id', orderId)
      .eq('method', 'gateway')
      .order('created_at', { ascending: false })
      .limit(1);
    if (error) throw error;

    const payment = payments?.[0];
    const expiresAt = payment?.created_at
      ? new Date(new Date(payment.created_at).getTime() + PROMPTPAY_QR_TTL_MS).toISOString()
      : null;
    const expired = Boolean(payment && payment.status === 'submitted' && new Date(expiresAt).getTime() <= Date.now());
    if (expired) {
      const intent = await stripe.paymentIntents.retrieve(payment.reference);
      if (intent.status !== 'canceled' && intent.status !== 'succeeded') await stripe.paymentIntents.cancel(intent.id);
      const { error: expireError } = await supabase.from('payments').update({ status: 'rejected' }).eq('id', payment.id).eq('status', 'submitted');
      if (expireError) throw expireError;
    }
    return res.json({
      success: true,
      paid: payment?.status === 'verified',
      expired,
      expiresAt,
      status: expired ? 'expired' : (payment?.status || 'not_found'),
    });
  } catch (error) {
    console.error('Error checking PromptPay payment status:', error);
    return res.status(500).json({ error: 'ตรวจสอบสถานะการชำระเงินไม่สำเร็จ' });
  }
});

// Recover expirations after an API restart; the persisted deadline remains authoritative.
setInterval(async () => {
  try {
    const cutoff = new Date(Date.now() - PROMPTPAY_QR_TTL_MS).toISOString();
    const { data: pending, error } = await supabase.from('payments')
      .select('id,reference,created_at')
      .eq('method', 'gateway').eq('status', 'submitted').lt('created_at', cutoff).limit(100);
    if (error) throw error;
    for (const payment of pending || []) {
      const expiresAt = new Date(new Date(payment.created_at).getTime() + PROMPTPAY_QR_TTL_MS).toISOString();
      if (new Date(expiresAt).getTime() > Date.now()) continue;
      const intent = await stripe.paymentIntents.retrieve(payment.reference);
      if (intent.status !== 'canceled' && intent.status !== 'succeeded') await stripe.paymentIntents.cancel(intent.id);
      await supabase.from('payments').update({ status: 'rejected' }).eq('id', payment.id).eq('status', 'submitted');
    }
  } catch (error) {
    console.error('Error expiring PromptPay QR codes:', error);
  }
}, 15000).unref();

const port = Number(process.env.PORT) || 3001;
app.listen(port, () => console.log(`SolarService payment API listening on port ${port}`));
