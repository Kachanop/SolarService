import React, { useEffect, useState } from 'react';
import { ArrowRight, Check, ShieldCheck, ShoppingBag, X } from 'lucide-react';
import { Money, PageIntro } from '../components/Shared.jsx';
import { supabase } from '../lib/supabase.js';
import { createPromptPayQr, getPromptPayPaymentStatus } from '../services/paymentService.js';

export function Cart({ cart, setCart, navigate }) {
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  return <div className="page-wrap"><PageIntro eyebrow="YOUR CART" title="ตะกร้าสินค้า" description="ตรวจสอบรายการสินค้าก่อนดำเนินการสั่งซื้อ" /><div className="cart-layout"><div className="cart-items">{cart.length ? cart.map((item) => <article className="cart-item" key={item.id}><span className={`cart-product-icon ${item.tone}`}>{item.icon}</span><div className="cart-item-info"><small>{item.category}</small><h3>{item.name}</h3><strong><Money value={item.price} /></strong></div><div className="quantity-control"><button aria-label="ลดจำนวน" onClick={() => setCart((items) => items.map((current) => current.id === item.id ? { ...current, quantity: Math.max(1, current.quantity - 1) } : current))}>−</button><span>{item.quantity}</span><button aria-label="เพิ่มจำนวน" onClick={() => setCart((items) => items.map((current) => current.id === item.id ? { ...current, quantity: current.quantity + 1 } : current))}>+</button></div><button className="remove-item" aria-label="ลบสินค้า" onClick={() => setCart((items) => items.filter((current) => current.id !== item.id))}><X size={17} /></button></article>) : <div className="empty-state"><ShoppingBag size={30} /><h3>ยังไม่มีสินค้าในตะกร้า</h3><p>เลือกชมอุปกรณ์โซลาร์เซลล์ที่เหมาะกับบ้านคุณ</p><a className="button button-green" href="#/products">เลือกซื้อสินค้า <ArrowRight size={16} /></a></div>}</div>{cart.length > 0 && <aside className="summary-card"><h3>สรุปคำสั่งซื้อ</h3><div><span>ยอดรวมสินค้า</span><strong><Money value={subtotal} /></strong></div><div><span>ค่าจัดส่ง</span><strong>คำนวณภายหลัง</strong></div><hr /><div className="summary-total"><span>ยอดรวม</span><strong><Money value={subtotal} /></strong></div><button className="button button-green" onClick={() => navigate('/checkout')}>ดำเนินการสั่งซื้อ <ArrowRight size={16} /></button><p><ShieldCheck size={14} /> ชำระเงินอย่างปลอดภัย</p></aside>}</div></div>;
}
export function Checkout({ cart, setCart, authUser, setToast, navigate }) {
  const [shipping, setShipping] = useState({
    name: authUser?.user_metadata?.full_name || '',
    phone: '',
    address: '',
    notes: '',
  });
  const [orderId, setOrderId] = useState('');
  const [qrPayment, setQrPayment] = useState(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [paid, setPaid] = useState(false);
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  useEffect(() => {
    if (!qrPayment || paid) return undefined;
    let active = true;

    async function checkStatus() {
      try {
        const result = await getPromptPayPaymentStatus(qrPayment.orderId);
        if (active && result.paid) {
          setPaid(true);
          setCart([]);
          setToast('ชำระเงินเรียบร้อยแล้ว');
        }
      } catch (error) {
        if (active) {
          setPaymentMessage(`ตรวจสอบสถานะไม่สำเร็จ: ${error instanceof Error ? error.message : 'เกิดข้อผิดพลาด'}`);
        }
      }
    }

    const interval = window.setInterval(checkStatus, 5000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [qrPayment, paid, setCart, setToast]);

  async function checkPaymentStatus() {
    if (!qrPayment || checkingPayment) return;
    setCheckingPayment(true);
    setPaymentMessage('');
    try {
      const result = await getPromptPayPaymentStatus(qrPayment.orderId);
      if (result.paid) {
        setPaid(true);
        setCart([]);
        setToast('ชำระเงินเรียบร้อยแล้ว');
      } else {
        setPaymentMessage('ยังไม่พบการยืนยันจาก Stripe กรุณาสแกน QR แล้วลองตรวจสอบอีกครั้ง');
      }
    } catch (error) {
      setPaymentMessage(`ตรวจสอบสถานะไม่สำเร็จ: ${error instanceof Error ? error.message : 'เกิดข้อผิดพลาด'}`);
    } finally {
      setCheckingPayment(false);
    }
  }

  async function submitCheckout(event) {
    event.preventDefault();
    if (submitting || paid) return;

    if (!cart.length) {
      setToast('ตะกร้าสินค้าว่าง กรุณาเลือกสินค้าก่อนชำระเงิน');
      return;
    }
    if (!supabase) {
      setToast('กรุณาตั้งค่า Supabase ก่อนทำรายการสั่งซื้อ');
      return;
    }

    setSubmitting(true);
    try {
      let activeOrderId = orderId;
      if (!activeOrderId) {
        const { data, error } = await supabase.rpc('create_order', {
          p_shipping_name: shipping.name,
          p_shipping_phone: shipping.phone,
          p_shipping_address: shipping.address,
          p_items: cart.map((item) => ({ product_id: item.id, quantity: item.quantity })),
          p_notes: shipping.notes,
        });
        if (error) throw error;
        if (typeof data !== 'string') throw new Error('ไม่สามารถสร้างคำสั่งซื้อได้');
        activeOrderId = data;
        setOrderId(activeOrderId);
      }

      const result = await createPromptPayQr(activeOrderId);
      if (result.status !== 'succeeded' && !result.qrCodeUrl) {
        throw new Error('Stripe ไม่ได้ส่งลิงก์ QR PromptPay กลับมา');
      }
      setQrPayment({ ...result, orderId: activeOrderId });
      setPaymentMessage('รอการชำระเงินผ่าน PromptPay ระบบจะตรวจสอบสถานะให้อัตโนมัติ');
    } catch (error) {
      setToast(`ชำระเงินไม่สำเร็จ: ${error instanceof Error ? error.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'}`);
    } finally {
      setSubmitting(false);
    }
  }

  if (paid) {
    return <div className="page-wrap">
      <PageIntro eyebrow="PAYMENT COMPLETE" title="ชำระเงินเรียบร้อย" description="ระบบได้รับการยืนยันการชำระเงินผ่าน PromptPay แล้ว" />
      <div className="success-panel">
        <span><Check size={28} /></span>
        <h2>ขอบคุณสำหรับคำสั่งซื้อ</h2>
        <p>หมายเลขคำสั่งซื้อ {orderId}</p>
        <button className="button button-green" onClick={() => navigate('/tracking')}>ติดตามคำสั่งซื้อ <ArrowRight size={16} /></button>
      </div>
    </div>;
  }

  return <div className="page-wrap">
    <PageIntro eyebrow="CHECKOUT" title="ยืนยันคำสั่งซื้อ" description="กรอกข้อมูลจัดส่ง แล้วชำระเงินด้วย QR PromptPay" />
    {!cart.length && !orderId ? (
      <div className="empty-state">
        <ShoppingBag size={30} />
        <h3>ยังไม่มีสินค้าในตะกร้า</h3>
        <button className="button button-green" onClick={() => navigate('/products')}>เลือกซื้อสินค้า <ArrowRight size={16} /></button>
      </div>
    ) : qrPayment ? (
      <section className="promptpay-qr-panel" aria-live="polite">
        <h2>สแกน QR เพื่อชำระเงิน</h2>
        <p>เปิดแอปธนาคารแล้วสแกน QR Code เพื่อชำระผ่าน PromptPay</p>
        <strong className="promptpay-amount"><Money value={qrPayment.amountInBaht ?? subtotal} /></strong>
        <div className="promptpay-order-items">
          {(qrPayment.orderItems || []).map((item, index) => (
            <div className="promptpay-order-item" key={`${item.name}-${index}`}>
              <span>{item.name} × {item.quantity}</span>
              <strong><Money value={item.lineTotal} /></strong>
            </div>
          ))}
        </div>
        {qrPayment.qrCodeUrl && <img className="promptpay-qr-image" src={qrPayment.qrCodeUrl} alt="QR Code สำหรับชำระเงินผ่าน PromptPay" />}
        {qrPayment.hostedInstructionsUrl && <a className="button button-outline" href={qrPayment.hostedInstructionsUrl} target="_blank" rel="noreferrer">เปิดหน้าแสดง QR จาก Stripe</a>}
        <p>เลขที่คำสั่งซื้อ: {orderId}</p>
        <p>{paymentMessage}</p>
        <button className="button button-green" type="button" onClick={checkPaymentStatus} disabled={checkingPayment}>
          {checkingPayment ? 'กำลังตรวจสอบ…' : 'ตรวจสอบการชำระเงิน'}
        </button>
      </section>
    ) : (
      <form className="checkout-form" onSubmit={submitCheckout}>
        <label>ชื่อ-นามสกุล
          <input required disabled={Boolean(orderId)} value={shipping.name} placeholder="ชื่อผู้รับสินค้า" onChange={(event) => setShipping({ ...shipping, name: event.target.value })} />
        </label>
        <label>เบอร์โทรศัพท์
          <input type="tel" required disabled={Boolean(orderId)} value={shipping.phone} placeholder="08X-XXX-XXXX" onChange={(event) => setShipping({ ...shipping, phone: event.target.value })} />
        </label>
        <label className="full-width">ที่อยู่จัดส่ง
          <textarea rows="3" required disabled={Boolean(orderId)} value={shipping.address} placeholder="บ้านเลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์" onChange={(event) => setShipping({ ...shipping, address: event.target.value })} />
        </label>
        <label className="full-width">หมายเหตุเพิ่มเติม
          <textarea rows="2" disabled={Boolean(orderId)} value={shipping.notes} placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)" onChange={(event) => setShipping({ ...shipping, notes: event.target.value })} />
        </label>
        {cart.length > 0 && <div className="checkout-total full-width">
          <span>ยอดชำระทั้งหมด</span>
          <strong><Money value={subtotal} /></strong>
        </div>}
        <button className="button button-green full-width" type="submit" disabled={submitting}>
          {submitting ? 'กำลังสร้าง QR…' : orderId ? 'สร้าง QR ชำระเงินอีกครั้ง' : 'สร้าง QR ชำระเงิน'}
          {!submitting && <ArrowRight size={16} />}
        </button>
        <p className="full-width"><ShieldCheck size={14} /> ชำระเงินอย่างปลอดภัยผ่าน Stripe</p>
      </form>
    )}
  </div>;
}
