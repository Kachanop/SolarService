import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, CalendarDays, Check, ShieldCheck, ShoppingBag, Wrench, X } from 'lucide-react';
import { Money, PageIntro } from '../components/Shared.jsx';
import { supabase } from '../lib/supabase.js';
import { createPromptPayQr, getPromptPayPaymentStatus } from '../services/paymentService.js';
// ใช้แบบ namespace เพื่อไม่ให้แอปพังถ้าชื่อฟังก์ชันใน bookingService ไม่ตรง (ดูหมายเหตุใน createInstallBooking)
import * as bookingService from '../services/bookingService.js';

const CSS = `
.sx-install { display: grid; gap: 12px; }
.sx-install > legend, .sx-install-title { font-weight: 700; color: #27392c; margin-bottom: 4px; padding: 0; }
.sx-choice-group { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.sx-choice { display: flex; gap: 12px; align-items: flex-start; padding: 14px 16px; border: 1px solid #e0e6db; border-radius: 14px; background: #fff; cursor: pointer; }
.sx-choice input { margin-top: 4px; accent-color: #526e48; }
.sx-choice.on { border-color: #526e48; background: #eef3ea; }
.sx-choice strong { display: flex; align-items: center; gap: 6px; color: #27392c; }
.sx-choice small { display: block; margin-top: 2px; color: #6f7a6e; line-height: 1.5; }
.sx-choice:focus-within { outline: 3px solid #e6edba; box-shadow: 0 0 0 5px #526e48; }
.sx-tech-panel { display: grid; gap: 14px; padding: 16px; border: 1px solid #e0e6db; border-radius: 14px; background: #fff; }
.sx-tech-panel label { display: grid; gap: 6px; }
.sx-tech-panel select { width: 100%; padding: 12px 14px; border: 1px solid #e0e6db; border-radius: 10px; background: #faf9f5; color: #29382c; font: inherit; }
.sx-tech-panel select:invalid { color: #8b948a; }
.sx-note { margin: 0; padding: 10px 12px; border-radius: 10px; background: #e6edba; color: #27392c; font-size: 14px; }
.sx-note-warn { background: #fdeaea; color: #8a2a2a; }
@media (max-width: 640px) { .sx-choice-group { grid-template-columns: 1fr; } }
`;

// จังหวัดทั้งหมด 77 จังหวัด (กรุงเทพมหานครอยู่บนสุด ที่เหลือเรียงตามตัวอักษร)
const THAI_PROVINCES = [
  'กรุงเทพมหานคร',
  'กระบี่',
  'กาญจนบุรี',
  'กาฬสินธุ์',
  'กำแพงเพชร',
  'ขอนแก่น',
  'จันทบุรี',
  'ฉะเชิงเทรา',
  'ชลบุรี',
  'ชัยนาท',
  'ชัยภูมิ',
  'ชุมพร',
  'เชียงราย',
  'เชียงใหม่',
  'ตรัง',
  'ตราด',
  'ตาก',
  'นครนายก',
  'นครปฐม',
  'นครพนม',
  'นครราชสีมา',
  'นครศรีธรรมราช',
  'นครสวรรค์',
  'นนทบุรี',
  'นราธิวาส',
  'น่าน',
  'บึงกาฬ',
  'บุรีรัมย์',
  'ปทุมธานี',
  'ประจวบคีรีขันธ์',
  'ปราจีนบุรี',
  'ปัตตานี',
  'พระนครศรีอยุธยา',
  'พะเยา',
  'พังงา',
  'พัทลุง',
  'พิจิตร',
  'พิษณุโลก',
  'เพชรบุรี',
  'เพชรบูรณ์',
  'แพร่',
  'ภูเก็ต',
  'มหาสารคาม',
  'มุกดาหาร',
  'แม่ฮ่องสอน',
  'ยโสธร',
  'ยะลา',
  'ร้อยเอ็ด',
  'ระนอง',
  'ระยอง',
  'ราชบุรี',
  'ลพบุรี',
  'ลำปาง',
  'ลำพูน',
  'เลย',
  'ศรีสะเกษ',
  'สกลนคร',
  'สงขลา',
  'สตูล',
  'สมุทรปราการ',
  'สมุทรสงคราม',
  'สมุทรสาคร',
  'สระแก้ว',
  'สระบุรี',
  'สิงห์บุรี',
  'สุโขทัย',
  'สุพรรณบุรี',
  'สุราษฎร์ธานี',
  'สุรินทร์',
  'หนองคาย',
  'หนองบัวลำภู',
  'อ่างทอง',
  'อำนาจเจริญ',
  'อุดรธานี',
  'อุตรดิตถ์',
  'อุทัยธานี',
  'อุบลราชธานี',
];

// Supabase/Stripe ส่ง error มาเป็น object ธรรมดา ไม่ใช่ Error จึงต้องดึง message ออกมาเอง
function getErrorMessage(error, fallback = 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ') {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  return error.message || error.details || error.hint || error.error_description || fallback;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isOrderableItem = (item) => UUID_RE.test(String(item.id));

function getTodayDateValue() {
  const today = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
}

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
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  // ---- ตัวเลือกช่างติดตั้ง ----
  const [installMode, setInstallMode] = useState('none'); // 'none' = ไม่เอาช่าง | 'technician' = เอาช่าง
  const [installDate, setInstallDate] = useState('');
  const [installProvince, setInstallProvince] = useState('');
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null); // { start, label }
  const [bookingInfo, setBookingInfo] = useState(null); // { status: 'created' | 'failed', number?, message? }
  const paidHandledRef = useRef(false);
  const markPaidRef = useRef(null);

  const wantsTechnician = installMode === 'technician';
  const unorderableItems = cart.filter((item) => !isOrderableItem(item));
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  // โหลดเวลาว่างของช่างเมื่อเลือกวัน
  useEffect(() => {
    if (!wantsTechnician || !installDate) {
      setSlots([]);
      setSelectedSlot(null);
      return undefined;
    }
    let active = true;
    (async () => {
      setSlotsLoading(true);
      setSlotsError('');
      try {
        if (typeof bookingService.getSlotAvailability !== 'function') throw new Error('ไม่พบฟังก์ชันตรวจสอบเวลาว่าง');
        const result = await bookingService.getSlotAvailability(installDate);
        if (active) {
          setSlots(result || []);
          setSelectedSlot(null);
        }
      } catch (error) {
        if (active) setSlotsError(getErrorMessage(error, 'โหลดเวลาว่างไม่สำเร็จ'));
      } finally {
        if (active) setSlotsLoading(false);
      }
    })();
    return () => { active = false; };
  }, [wantsTechnician, installDate]);

  // สร้างการจองช่างหลังชำระเงินสำเร็จ และผูกกับคำสั่งซื้อ
  async function createInstallBooking(id) {
    /* หมายเหตุ: ชื่อฟิลด์ด้านล่างเป็นการคาดเดา ให้ปรับให้ตรงกับ createBooking ใน services/bookingService.js
       และถ้าตาราง bookings มีคอลัมน์ order_id จะผูกกับคำสั่งซื้อได้ทันที */
    if (typeof bookingService.createBooking !== 'function') throw new Error('ไม่พบฟังก์ชันสร้างการจอง (createBooking)');
    return bookingService.createBooking({
      order_id: id,
      slot_start: selectedSlot.start,
      preferred_at: selectedSlot.start,
      name: shipping.name,
      phone: shipping.phone,
      address: shipping.address,
      province: installProvince,
      service_type: 'installation',
      notes: `ติดตั้งอุปกรณ์จากคำสั่งซื้อ ${id}`,
    });
  }

  async function markPaid(id) {
    if (paidHandledRef.current) return;
    paidHandledRef.current = true;
    setPaid(true);
    setCart([]);
    setToast('ชำระเงินเรียบร้อยแล้ว');

    if (wantsTechnician && selectedSlot) {
      try {
        const booking = await createInstallBooking(id);
        setBookingInfo({ status: 'created', number: booking?.booking_number });
      } catch (error) {
        setBookingInfo({ status: 'failed', message: getErrorMessage(error, 'เกิดข้อผิดพลาด') });
      }
    }
  }
  markPaidRef.current = markPaid;

  useEffect(() => {
    if (!qrPayment || paid) return undefined;
    let active = true;

    function updateCountdown() {
      const remaining = Math.max(0, Math.ceil((new Date(qrPayment.expiresAt).getTime() - Date.now()) / 1000));
      setSecondsRemaining(remaining);
      if (remaining === 0) setPaymentMessage('QR หมดอายุแล้ว กรุณาสร้าง QR ใหม่เพื่อชำระเงิน');
    }
    updateCountdown();
    const countdown = window.setInterval(updateCountdown, 1000);

    async function checkStatus() {
      try {
        const result = await getPromptPayPaymentStatus(qrPayment.orderId);
        if (active && result.paid) markPaidRef.current(qrPayment.orderId);
        else if (active && result.expired) {
          setSecondsRemaining(0);
          setPaymentMessage('QR หมดอายุแล้ว กรุณาสร้าง QR ใหม่เพื่อชำระเงิน');
        }
      } catch (error) {
        if (active) {
          setPaymentMessage(`ตรวจสอบสถานะไม่สำเร็จ: ${getErrorMessage(error, 'เกิดข้อผิดพลาด')}`);
        }
      }
    }

    const interval = window.setInterval(checkStatus, 5000);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.clearInterval(countdown);
    };
  }, [qrPayment, paid]);

  async function checkPaymentStatus() {
    if (!qrPayment || checkingPayment) return;
    setCheckingPayment(true);
    setPaymentMessage('');
    try {
      const result = await getPromptPayPaymentStatus(qrPayment.orderId);
      if (result.paid) {
        await markPaid(qrPayment.orderId);
      } else if (result.expired) {
        setSecondsRemaining(0);
        setPaymentMessage('QR หมดอายุแล้ว กรุณาสร้าง QR ใหม่เพื่อชำระเงิน');
      } else {
        setPaymentMessage('ยังไม่พบการยืนยันจาก Stripe กรุณาสแกน QR แล้วลองตรวจสอบอีกครั้ง');
      }
    } catch (error) {
      setPaymentMessage(`ตรวจสอบสถานะไม่สำเร็จ: ${getErrorMessage(error, 'เกิดข้อผิดพลาด')}`);
    } finally {
      setCheckingPayment(false);
    }
  }

  async function submitCheckout(event) {
    event?.preventDefault();
    if (submitting || paid) return;

    if (!cart.length && !orderId) {
      setToast('ตะกร้าสินค้าว่าง กรุณาเลือกสินค้าก่อนชำระเงิน');
      return;
    }
    if (!supabase) {
      setToast('กรุณาตั้งค่า Supabase ก่อนทำรายการสั่งซื้อ');
      return;
    }
    if (unorderableItems.length) {
      setToast('ในตะกร้ามีสินค้าตัวอย่างที่ยังสั่งซื้อไม่ได้ กรุณาลบออกก่อน');
      return;
    }
    if (wantsTechnician && (!installDate || !selectedSlot || !installProvince.trim())) {
      setToast('กรุณาเลือกวัน เวลา และระบุจังหวัดสำหรับนัดช่างติดตั้ง');
      return;
    }

    setSubmitting(true);
    try {
      let activeOrderId = orderId;
      if (!activeOrderId) {
        const installNote = wantsTechnician
          ? `\n[ต้องการช่างติดตั้ง] นัด: ${selectedSlot.label} วันที่ ${installDate} จังหวัด ${installProvince.trim()}`
          : '\n[ไม่ต้องการช่างติดตั้ง]';
        const { data, error } = await supabase.rpc('create_order', {
          p_shipping_name: shipping.name,
          p_shipping_phone: shipping.phone,
          p_shipping_address: shipping.address,
          p_items: cart.map((item) => ({ product_id: item.id, quantity: item.quantity })),
          p_notes: `${shipping.notes || ''}${installNote}`.trim(),
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
      console.error('checkout error:', error);
      setToast(`ชำระเงินไม่สำเร็จ: ${getErrorMessage(error, 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ')}`);
    } finally {
      setSubmitting(false);
    }
  }

  if (paid) {
    return <div className="page-wrap">
      <style>{CSS}</style>
      <PageIntro eyebrow="PAYMENT COMPLETE" title="ชำระเงินเรียบร้อย" description="ระบบได้รับการยืนยันการชำระเงินผ่าน PromptPay แล้ว" />
      <div className="success-panel">
        <span><Check size={28} /></span>
        <h2>ขอบคุณสำหรับคำสั่งซื้อ</h2>
        <p>หมายเลขคำสั่งซื้อ {orderId}</p>
        {wantsTechnician && !bookingInfo && <p className="sx-note">กำลังนัดหมายช่างติดตั้ง…</p>}
        {bookingInfo?.status === 'created' && (
          <p className="sx-note">นัดช่างติดตั้งแล้ว: {selectedSlot?.label} วันที่ {installDate}{bookingInfo.number ? ` (เลขที่จอง ${bookingInfo.number})` : ''}</p>
        )}
        {bookingInfo?.status === 'failed' && (
          <p className="sx-note sx-note-warn">ชำระเงินสำเร็จ แต่นัดช่างยังไม่สำเร็จ ({bookingInfo.message}) กรุณาติดต่อเจ้าหน้าที่หรือจองช่างใหม่ที่หน้า “การจองของฉัน”</p>
        )}
        <button className="button button-green" onClick={() => navigate('/tracking')}>ติดตามคำสั่งซื้อ <ArrowRight size={16} /></button>
      </div>
    </div>;
  }

  const locked = Boolean(orderId);

  return <div className="page-wrap">
    <style>{CSS}</style>
    <PageIntro eyebrow="CHECKOUT" title="ยืนยันคำสั่งซื้อ" description="กรอกข้อมูลจัดส่ง เลือกว่าต้องการช่างติดตั้งหรือไม่ แล้วชำระเงินด้วย QR PromptPay" />
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
        {wantsTechnician && selectedSlot && (
          <p className="sx-note"><Wrench size={14} /> นัดช่างติดตั้ง: {selectedSlot.label} วันที่ {installDate} (ระบบจะยืนยันนัดหลังชำระเงิน)</p>
        )}
        {secondsRemaining > 0 && qrPayment.qrCodeUrl && <img className="promptpay-qr-image" src={qrPayment.qrCodeUrl} alt="QR Code สำหรับชำระเงินผ่าน PromptPay" />}
        {secondsRemaining > 0 && qrPayment.hostedInstructionsUrl && <a className="button button-outline" href={qrPayment.hostedInstructionsUrl} target="_blank" rel="noreferrer">เปิดหน้าแสดง QR จาก Stripe</a>}
        <strong className={secondsRemaining ? 'promptpay-countdown' : 'promptpay-countdown expired'}>
          {secondsRemaining ? `QR ใช้ได้อีก ${Math.floor(secondsRemaining / 60)}:${String(secondsRemaining % 60).padStart(2, '0')} นาที` : 'QR หมดอายุแล้ว'}
        </strong>
        <p>เลขที่คำสั่งซื้อ: {orderId}</p>
        <p>{paymentMessage}</p>
        <button className="button button-green" type="button" onClick={checkPaymentStatus} disabled={checkingPayment}>
          {checkingPayment ? 'กำลังตรวจสอบ…' : 'ตรวจสอบการชำระเงิน'}
        </button>
        {secondsRemaining === 0 && <button className="button button-outline" type="button" onClick={submitCheckout} disabled={submitting}>
          {submitting ? 'กำลังสร้าง QR…' : 'สร้าง QR ใหม่'} <ArrowRight size={16} />
        </button>}
      </section>
    ) : (
      <form className="checkout-form" onSubmit={submitCheckout}>
        {unorderableItems.length > 0 && (
          <div className="sx-note sx-note-warn full-width" role="alert">
            <p style={{ margin: '0 0 8px' }}>ในตะกร้ามีสินค้าตัวอย่างที่ยังไม่มีในฐานข้อมูล จึงสั่งซื้อไม่ได้: {unorderableItems.map((item) => item.name).join(', ')}</p>
            <button type="button" className="button button-outline small-button" onClick={() => setCart((items) => items.filter(isOrderableItem))}>
              ลบสินค้าตัวอย่างออกจากตะกร้า
            </button>
          </div>
        )}
        <label>ชื่อ-นามสกุล
          <input required disabled={locked} value={shipping.name} placeholder="ชื่อผู้รับสินค้า" onChange={(event) => setShipping({ ...shipping, name: event.target.value })} />
        </label>
        <label>เบอร์โทรศัพท์
          <input type="tel" required disabled={locked} value={shipping.phone} placeholder="08X-XXX-XXXX" onChange={(event) => setShipping({ ...shipping, phone: event.target.value })} />
        </label>
        <label className="full-width">ที่อยู่จัดส่ง
          <textarea rows="3" required disabled={locked} value={shipping.address} placeholder="บ้านเลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์" onChange={(event) => setShipping({ ...shipping, address: event.target.value })} />
        </label>
        <label className="full-width">หมายเหตุเพิ่มเติม
          <textarea rows="2" disabled={locked} value={shipping.notes} placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)" onChange={(event) => setShipping({ ...shipping, notes: event.target.value })} />
        </label>

        <fieldset className="sx-install full-width" style={{ border: 0, padding: 0, margin: 0 }} disabled={locked}>
          <legend className="sx-install-title">บริการติดตั้ง</legend>
          <div className="sx-choice-group" role="radiogroup" aria-label="เลือกบริการติดตั้ง">
            <label className={`sx-choice ${!wantsTechnician ? 'on' : ''}`}>
              <input type="radio" name="install-mode" checked={!wantsTechnician} onChange={() => setInstallMode('none')} />
              <span><strong>ไม่ต้องการช่าง</strong><small>รับเฉพาะสินค้า ติดตั้งเอง หรือใช้ช่างของคุณเอง</small></span>
            </label>
            <label className={`sx-choice ${wantsTechnician ? 'on' : ''}`}>
              <input type="radio" name="install-mode" checked={wantsTechnician} onChange={() => setInstallMode('technician')} />
              <span><strong><Wrench size={16} /> ต้องการช่างติดตั้ง</strong><small>เลือกวันและเวลาให้ช่างเข้าติดตั้งที่ที่อยู่ด้านบน</small></span>
            </label>
          </div>

          {wantsTechnician && (
            <div className="sx-tech-panel">
              <label>
                จังหวัดที่ติดตั้ง
                <select required value={installProvince} onChange={(event) => setInstallProvince(event.target.value)}>
                  <option value="" disabled>เลือกจังหวัด</option>
                  {THAI_PROVINCES.map((province) => <option key={province} value={province}>{province}</option>)}
                </select>
              </label>
              <label>
                <span><CalendarDays size={14} /> เลือกวันนัดช่าง</span>
                <input type="date" required min={getTodayDateValue()} value={installDate} onChange={(event) => setInstallDate(event.target.value)} />
              </label>
              {slotsLoading && <p className="bk-hint" role="status">กำลังตรวจสอบเวลาว่าง…</p>}
              {slotsError && <p className="bk-error" role="alert">{slotsError}</p>}
              {!slotsLoading && installDate && !slotsError && slots.length === 0 && <p className="bk-hint">ไม่พบเวลาว่างในวันที่เลือก ลองเลือกวันอื่น</p>}
              {!slotsLoading && slots.length > 0 && (
                <div className="bk-slot-grid" role="radiogroup" aria-label="เลือกเวลานัดช่าง">
                  {slots.map((slot) => (
                    <label key={slot.slot_start} className={`bk-slot ${selectedSlot?.start === slot.slot_start ? 'selected' : ''} ${slot.is_available ? '' : 'disabled'}`}>
                      <input
                        type="radio"
                        name="install-slot"
                        value={slot.slot_start}
                        checked={selectedSlot?.start === slot.slot_start}
                        disabled={!slot.is_available}
                        onChange={() => setSelectedSlot({ start: slot.slot_start, label: slot.slot_label })}
                      />
                      <strong>{slot.slot_label}</strong>
                      <small>{slot.is_available ? 'ว่าง' : slot.unavailable_reason === 'past' ? 'เวลาผ่านไปแล้ว' : 'มีรายการจองแล้ว'}</small>
                    </label>
                  ))}
                </div>
              )}
              <p className="sx-note">ระบบจะนัดช่างให้อัตโนมัติหลังชำระเงินสำเร็จ และดูสถานะได้ที่หน้า “การจองของฉัน”</p>
            </div>
          )}
        </fieldset>

        {cart.length > 0 && <div className="checkout-total full-width">
          <span>ยอดชำระทั้งหมด</span>
          <strong><Money value={subtotal} /></strong>
        </div>}
        <button className="button button-green full-width" type="submit" disabled={submitting || unorderableItems.length > 0}>
          {submitting ? 'กำลังสร้าง QR…' : orderId ? 'สร้าง QR ชำระเงินอีกครั้ง' : 'สร้าง QR ชำระเงิน'}
          {!submitting && <ArrowRight size={16} />}
        </button>
        <p className="full-width"><ShieldCheck size={14} /> ชำระเงินอย่างปลอดภัยผ่าน Stripe</p>
      </form>
    )}
  </div>;
}
