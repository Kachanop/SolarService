import cors from 'cors';
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const PROMPTPAY_QR_TTL_MS = 5 * 60 * 1000;
const MIN_PROMPTPAY_AMOUNT_SATANG = 1000;
const orderIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getPromptPayErrorResponse(error) {
  const message = typeof error?.message === 'string' ? error.message : '';
  if (/(does not exist|not found|could not find|schema cache)/i.test(message)
    && /\b(payment_plan|installment_id|order_installments|set_order_payment_plan)\b/i.test(message)) {
    return {
      status: 503,
      message: 'ฐานข้อมูลยังไม่รองรับการชำระเงิน กรุณารัน migration 20261128000000_customer_sales_workflows.sql ใน Supabase',
    };
  }
  if (typeof error?.type === 'string' && error.type.startsWith('Stripe')) {
    return {
      status: 502,
      message: `Stripe ปฏิเสธการสร้าง PromptPay: ${message || 'กรุณาตรวจสอบการตั้งค่าบัญชี Stripe'}`,
    };
  }
  if (message) {
    return {
      status: 500,
      message: `สร้างรายการชำระเงินไม่สำเร็จ: ${message.slice(0, 240)}`,
    };
  }
  return {
    status: 500,
    message: 'สร้างรายการชำระเงินไม่สำเร็จ กรุณาตรวจสอบบันทึกของเซิร์ฟเวอร์',
  };
}

/**
 * Build Express app with injected env.
 * Accepts either a plain object (Cloudflare Workers env) or falls back to process.env.
 */
export function createApp(env = process.env) {
  const requiredEnvironment = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY',
  ];
  const missingEnvironment = requiredEnvironment.filter((name) => !env[name]);

  if (missingEnvironment.length) {
    throw new Error(`Missing required environment variables: ${missingEnvironment.join(', ')}`);
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

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
      .select('id,customer_id,total,status,shipping_name,payment_plan')
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

  const app = express();

  app.use(cors({
    origin: env.FRONTEND_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  }));

  app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const webhookSecret = env.STRIPE_WEBHOOK_SECRET;
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
          .select('id,order_id,customer_id,amount,status,installment_id')
          .eq('reference', paymentIntent.id)
          .eq('method', 'gateway')
          .maybeSingle();

        if (paymentLookupError) {
          console.error('Could not find payment for Stripe event:', paymentLookupError.message);
          return res.status(500).send('Could not find payment');
        }
        if (!payment || payment.order_id !== orderId || payment.customer_id !== customerId
          || (payment.installment_id || null) !== (paymentIntent.metadata?.installment_id || null)
          || Math.round(Number(payment.amount) * 100) !== paymentIntent.amount
          || Math.round(Number(payment.amount) * 100) !== paymentIntent.amount_received) {
          console.error('Stripe payment amount or order does not match the stored payment');
          return res.status(400).send('Payment does not match');
        }

        if (payment.status !== 'verified') {
          const { error: paymentError } = await supabase
            .from('payments')
            .update({ status: 'verified', paid_at: new Date().toISOString() })
            .eq('id', payment.id);
          if (paymentError) {
            console.error('Could not mark payment as verified:', paymentError.message);
            return res.status(500).send('Could not update payment');
          }
        }

        if (payment.installment_id) {
          const { error: installmentError } = await supabase
            .from('order_installments')
            .update({ status: 'paid', paid_at: new Date().toISOString() })
            .eq('id', payment.installment_id)
            .eq('order_id', orderId);
          if (installmentError) {
            console.error('Could not mark installment as paid:', installmentError.message);
            return res.status(500).send('Could not update installment');
          }
        }

        const { count, error: installmentsError } = await supabase
          .from('order_installments')
          .select('id', { count: 'exact', head: true })
          .eq('order_id', orderId)
          .eq('status', 'pending');
        if (installmentsError) {
          console.error('Could not check remaining installments:', installmentsError.message);
          return res.status(500).send('Could not check installments');
        }
        if (!payment.installment_id || count === 0) {
          const { error: orderError } = await supabase
            .from('orders')
            .update({ status: 'confirmed' })
            .eq('id', orderId)
            .eq('status', 'pending');
          if (orderError) {
            console.error('Could not confirm paid order:', orderError.message);
            return res.status(500).send('Could not confirm order');
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
    const { orderId, installmentId = null } = req.body || {};

    if (typeof orderId !== 'string' || !orderIdPattern.test(orderId)) {
      return res.status(400).json({ error: 'ไม่พบหมายเลขคำสั่งซื้อที่ถูกต้อง' });
    }
    if (installmentId !== null && (typeof installmentId !== 'string' || !orderIdPattern.test(installmentId))) {
      return res.status(400).json({ error: 'ไม่พบข้อมูลงวดชำระที่ถูกต้อง' });
    }

    try {
      const authorized = await getAuthorizedOrder(req, res, orderId);
      if (!authorized) return undefined;
      const { order, customerEmail, orderItems } = authorized;
      if (order.status !== 'pending') {
        return res.status(409).json({ error: 'คำสั่งซื้อนี้ไม่อยู่ในสถานะที่ชำระเงินได้' });
      }

      let installment = null;
      if (order.payment_plan === 'three_installments') {
        if (!installmentId) return res.status(400).json({ error: 'กรุณาเลือกงวดที่ต้องการชำระ' });
        const { data, error } = await supabase.from('order_installments')
          .select('id,installment_number,amount,status')
          .eq('id', installmentId)
          .eq('order_id', order.id)
          .maybeSingle();
        if (error) throw error;
        if (!data || data.status !== 'pending') {
          return res.status(409).json({ error: 'งวดนี้ไม่อยู่ในสถานะที่ชำระเงินได้' });
        }
        const { data: earlierPending, error: earlierError } = await supabase.from('order_installments')
          .select('id')
          .eq('order_id', order.id)
          .lt('installment_number', data.installment_number)
          .eq('status', 'pending')
          .limit(1)
          .maybeSingle();
        if (earlierError) throw earlierError;
        if (earlierPending) return res.status(409).json({ error: 'กรุณาชำระงวดก่อนหน้าก่อน' });
        installment = data;
      } else if (installmentId) {
        return res.status(400).json({ error: 'คำสั่งซื้อนี้ไม่ได้เลือกผ่อนชำระ' });
      }

      const amountInSatang = Math.round(Number(installment?.amount ?? order.total) * 100);
      if (!Number.isSafeInteger(amountInSatang) || amountInSatang < 1) {
        return res.status(400).json({ error: 'ยอดคำสั่งซื้อไม่ถูกต้อง' });
      }
      if (amountInSatang < MIN_PROMPTPAY_AMOUNT_SATANG) {
        return res.status(400).json({ error: 'ยอดชำระ PromptPay ขั้นต่ำ 10 บาท กรุณาเพิ่มสินค้าในคำสั่งซื้อ' });
      }

      let priorPaymentsQuery = supabase
        .from('payments')
        .select('id,reference,created_at')
        .eq('order_id', order.id)
        .eq('method', 'gateway')
        .eq('status', 'submitted');
      priorPaymentsQuery = installment
        ? priorPaymentsQuery.eq('installment_id', installment.id)
        : priorPaymentsQuery.is('installment_id', null);
      const { data: priorPayments, error: priorPaymentError } = await priorPaymentsQuery
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
        metadata: {
          order_id: order.id,
          customer_id: order.customer_id,
          ...(installment ? { installment_id: installment.id } : {}),
        },
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
        installment_id: installment?.id || null,
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
      const response = getPromptPayErrorResponse(error);
      return res.status(response.status).json({ error: response.message });
    }
  });

  app.get('/api/orders/:orderId/payment-status', async (req, res) => {
    const { orderId } = req.params;
    const installmentId = req.query.installmentId || null;
    if (!orderIdPattern.test(orderId)) {
      return res.status(400).json({ error: 'ไม่พบหมายเลขคำสั่งซื้อที่ถูกต้อง' });
    }
    if (installmentId !== null && (typeof installmentId !== 'string' || !orderIdPattern.test(installmentId))) {
      return res.status(400).json({ error: 'ไม่พบข้อมูลงวดชำระที่ถูกต้อง' });
    }

    try {
      const authorized = await getAuthorizedOrder(req, res, orderId);
      if (!authorized) return undefined;

      let paymentsQuery = supabase
        .from('payments')
        .select('id,status,reference,created_at')
        .eq('order_id', orderId)
        .eq('method', 'gateway');
      paymentsQuery = installmentId
        ? paymentsQuery.eq('installment_id', installmentId)
        : paymentsQuery.is('installment_id', null);
      const { data: payments, error } = await paymentsQuery.order('created_at', { ascending: false }).limit(1);
      if (error) throw error;

      const payment = payments?.[0];
      const expiresAt = payment?.created_at
        ? new Date(new Date(payment.created_at).getTime() + PROMPTPAY_QR_TTL_MS).toISOString()
        : null;
      let paymentStatus = payment?.status || 'not_found';
      let expired = Boolean(payment && paymentStatus === 'submitted' && new Date(expiresAt).getTime() <= Date.now());
      if (payment && paymentStatus === 'submitted') {
        const intent = await stripe.paymentIntents.retrieve(payment.reference);
        let expectedAmount = Math.round(Number(authorized.order.total) * 100);
        if (installmentId) {
          const { data: installment, error: installmentError } = await supabase.from('order_installments')
            .select('id,amount')
            .eq('id', installmentId)
            .eq('order_id', authorized.order.id)
            .maybeSingle();
          if (installmentError) throw installmentError;
          if (!installment) return res.status(404).json({ error: 'ไม่พบงวดชำระ' });
          expectedAmount = Math.round(Number(installment.amount) * 100);
        }
        const validIntent = intent.metadata?.order_id === authorized.order.id
          && intent.metadata?.customer_id === authorized.order.customer_id
          && (installmentId ? intent.metadata?.installment_id === installmentId : !intent.metadata?.installment_id)
          && intent.currency === 'thb'
          && intent.amount === expectedAmount;

        if (intent.status === 'succeeded' && validIntent && intent.amount_received === intent.amount) {
          if (installmentId) {
            const { error: installmentError } = await supabase.from('order_installments')
              .update({ status: 'paid', paid_at: new Date().toISOString() })
              .eq('id', installmentId).eq('order_id', orderId);
            if (installmentError) throw installmentError;
          }
          const { count, error: remainingError } = await supabase.from('order_installments')
            .select('id', { count: 'exact', head: true })
            .eq('order_id', orderId)
            .eq('status', 'pending');
          if (remainingError) throw remainingError;
          if (!installmentId || count === 0) {
            const { error: orderError } = await supabase.from('orders')
              .update({ status: 'confirmed' }).eq('id', orderId).eq('status', 'pending');
            if (orderError) throw orderError;
          }
          const { error: paymentError } = await supabase.from('payments')
            .update({ status: 'verified', paid_at: new Date().toISOString() }).eq('id', payment.id);
          if (paymentError) throw paymentError;
          paymentStatus = 'verified';
          expired = false;
        } else if (expired) {
          if (intent.status !== 'canceled' && intent.status !== 'succeeded') {
            await stripe.paymentIntents.cancel(intent.id);
          }
          const { error: expireError } = await supabase.from('payments')
            .update({ status: 'rejected' }).eq('id', payment.id).eq('status', 'submitted');
          if (expireError) throw expireError;
          paymentStatus = intent.status === 'succeeded' ? 'submitted' : 'rejected';
        }
      }
      return res.json({
        success: true,
        paid: paymentStatus === 'verified',
        expired,
        expiresAt,
        status: expired ? 'expired' : paymentStatus,
      });
    } catch (error) {
      console.error('Error checking PromptPay payment status:', error);
      return res.status(500).json({ error: 'ตรวจสอบสถานะการชำระเงินไม่สำเร็จ' });
    }
  });

  return app;
}

// Named export for the scheduled job (needs env injected at call time via worker.js)
export async function expirePendingPayments(env = process.env) {
  const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const cutoff = new Date(Date.now() - PROMPTPAY_QR_TTL_MS).toISOString();
  const { data: pending, error } = await supabase.from('payments')
    .select('id,reference,created_at')
    .eq('method', 'gateway')
    .eq('status', 'submitted')
    .lt('created_at', cutoff)
    .limit(100);
  if (error) throw error;

  for (const payment of pending || []) {
    const intent = await stripe.paymentIntents.retrieve(payment.reference);
    if (intent.status !== 'canceled' && intent.status !== 'succeeded') {
      await stripe.paymentIntents.cancel(intent.id);
    }
    if (intent.status !== 'succeeded') {
      const { error: expireError } = await supabase.from('payments')
        .update({ status: 'rejected' })
        .eq('id', payment.id)
        .eq('status', 'submitted');
      if (expireError) throw expireError;
    }
  }
}

function dateOffset(dateString, days) {
  const date = new Date(`${dateString}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export async function sendInstallmentReminders(env = process.env) {
  const missingEnvironment = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'RESEND_API_KEY', 'EMAIL_FROM']
    .filter((name) => !env[name]);
  if (missingEnvironment.length) {
    throw new Error(`Missing installment reminder environment variables: ${missingEnvironment.join(', ')}`);
  }

  const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const today = new Date().toISOString().slice(0, 10);
  const reminderDates = [today, dateOffset(today, 3)];
  const dateFormatter = new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'long',
    timeZone: 'Asia/Bangkok',
  });
  const sentForUsers = new Map();
  let sentCount = 0;
  const pageSize = 500;

  for (let offset = 0; ; offset += pageSize) {
    const { data: installments, error: installmentsError } = await supabase
      .from('order_installments')
      .select('id,order_id,installment_number,amount,due_date,orders!inner(order_number,customer_id,payment_plan,status)')
      .eq('status', 'pending')
      .in('due_date', reminderDates)
      .eq('orders.payment_plan', 'three_installments')
      .neq('orders.status', 'cancelled')
      .order('due_date', { ascending: true })
      .order('id', { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (installmentsError) throw installmentsError;
    if (!installments?.length) break;

    for (const installment of installments) {
      const order = Array.isArray(installment.orders) ? installment.orders[0] : installment.orders;
      if (!order?.customer_id) continue;

      const reminderType = installment.due_date === today ? 'due_date' : 'three_days_before';
      const { data: claim, error: claimError } = await supabase.rpc('claim_installment_reminder', {
        p_installment_id: installment.id,
        p_reminder_type: reminderType,
      });
      if (claimError) throw claimError;
      const delivery = claim?.[0];
      if (!delivery) continue;

      try {
        let recipientEmail = sentForUsers.get(order.customer_id);
        if (!recipientEmail) {
          const { data, error } = await supabase.auth.admin.getUserById(order.customer_id);
          if (error) throw error;
          recipientEmail = data.user?.email;
          if (!recipientEmail) throw new Error(`No email address for order ${order.order_number}`);
          sentForUsers.set(order.customer_id, recipientEmail);
        }

        const dueDate = dateFormatter.format(new Date(`${installment.due_date}T00:00:00+07:00`));
        const isDueToday = reminderType === 'due_date';
        const subject = isDueToday
          ? `แจ้งเตือนชำระเงินงวดที่ ${installment.installment_number} วันนี้`
          : `แจ้งเตือน: งวดที่ ${installment.installment_number} ครบกำหนดในอีก 3 วัน`;
        const orderUrl = env.FRONTEND_ORIGIN
          ? `${env.FRONTEND_ORIGIN.replace(/\/$/, '')}/#/orders`
          : '';
        const text = [
          `เรียนคุณ${order.shipping_name || 'ลูกค้า'}`,
          '',
          isDueToday
            ? `งวดที่ ${installment.installment_number} จาก 3 ของคำสั่งซื้อ ${order.order_number} ครบกำหนดวันนี้ (${dueDate})`
            : `งวดที่ ${installment.installment_number} จาก 3 ของคำสั่งซื้อ ${order.order_number} จะครบกำหนดวันที่ ${dueDate}`,
          `ยอดชำระ ${Number(installment.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท`,
          'กรุณาเข้าสู่ระบบและชำระงวดนี้ผ่าน QR ที่หน้าคำสั่งซื้อของฉัน',
          orderUrl,
          '',
          'อีเมลฉบับนี้เป็นการแจ้งเตือนอัตโนมัติจาก SolarService',
        ].filter((line) => line !== undefined).join('\n');

        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
            'Idempotency-Key': delivery.delivery_id,
          },
          body: JSON.stringify({
            from: env.EMAIL_FROM,
            to: [recipientEmail],
            subject,
            text,
          }),
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || `Resend request failed with status ${response.status}`);
        }

        const { error: updateError } = await supabase
          .from('installment_reminder_deliveries')
          .update({ status: 'sent', sent_at: new Date().toISOString(), provider_id: result.id || null })
          .eq('id', delivery.delivery_id)
          .eq('status', 'processing');
        if (updateError) throw updateError;
        sentCount += 1;
      } catch (error) {
        const retryDelaySeconds = Math.min(3600, 60 * (2 ** (delivery.attempt_count - 1)));
        const { error: updateError } = await supabase
          .from('installment_reminder_deliveries')
          .update({
            status: 'failed',
            last_error: error instanceof Error ? error.message.slice(0, 1000) : 'Unknown email delivery error',
            next_attempt_at: new Date(Date.now() + retryDelaySeconds * 1000).toISOString(),
          })
          .eq('id', delivery.delivery_id)
          .eq('status', 'processing');
        if (updateError) throw updateError;
        console.error(`Installment reminder failed for order ${order.order_number}:`, error);
      }
    }

    if (installments.length < pageSize) break;
  }

  return sentCount;
}

// สำหรับรันบน Render
if (process.env.NODE_ENV !== 'production' || process.env.RENDER || process.env.PORT) {
  const port = process.env.PORT || 3000;
  const app = createApp(process.env);
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}
