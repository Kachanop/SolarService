import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, CalendarDays, Check, Printer, ShieldCheck, ShoppingBag, Wrench, X } from 'lucide-react';
import { Money, PageIntro } from '../components/Shared.jsx';
import { supabase } from '../lib/supabase.js';
import { products as legacyCatalogProducts } from '../data/catalog.js';
import { createPromptPayQr, getPromptPayPaymentStatus } from '../services/paymentService.js';
import { getQuotationByOrderId } from '../services/customerService.js';
import { searchAddressByProvince } from 'thai-address-database';
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
.sx-address-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.sx-address-grid label { display: grid; gap: 6px; color: #586656; font-size: 12px; }
.sx-address-grid input, .sx-address-grid select, .sx-address-grid textarea { width: 100%; min-width: 0; padding: 12px 14px; border: 1px solid #e0e6db; border-radius: 10px; background: #faf9f5; color: #29382c; font: inherit; }
.sx-address-hint { grid-column: 1 / -1; margin: 0; color: #788274; font-size: 11px; }
@media (max-width: 640px) { .sx-choice-group { grid-template-columns: 1fr; } }
@media (max-width: 520px) { .sx-address-grid { grid-template-columns: 1fr; } }
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
const ADDRESS_ROWS = searchAddressByProvince('.', 10000);

function getAmphoes(province) {
  return [...new Set(ADDRESS_ROWS.filter((row) => row.province === province).map((row) => row.amphoe))]
    .sort((a, b) => a.localeCompare(b, 'th'));
}

function getDistricts(province, amphoe) {
  return [...new Set(ADDRESS_ROWS
    .filter((row) => row.province === province && row.amphoe === amphoe)
    .map((row) => row.district))]
    .sort((a, b) => a.localeCompare(b, 'th'));
}

function getZipcode(province, amphoe, district) {
  return ADDRESS_ROWS.find((row) => row.province === province && row.amphoe === amphoe && row.district === district)?.zipcode || '';
}

// Supabase/Stripe ส่ง error มาเป็น object ธรรมดา ไม่ใช่ Error จึงต้องดึง message ออกมาเอง
function getErrorMessage(error, fallback = 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ') {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  return error.message || error.details || error.hint || error.error_description || fallback;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isOrderableItem = (item) => UUID_RE.test(String(item.id));
const ADDRESS_FIELDS = ['name', 'phone', 'addressLine', 'province', 'amphoe', 'district', 'zipcode'];

function getSavedShipping(userId) {
  if (!userId) return null;
  try {
    const saved = localStorage.getItem(`solarservice_checkout_address_${userId}`);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('Could not read saved checkout address:', error);
    return null;
  }
}

function getTodayDateValue() {
  const today = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
}

export function Cart({ cart, setCart, navigate }) {
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  return <div className="page-wrap"><PageIntro eyebrow="YOUR CART" title="ตะกร้าสินค้า" description="ตรวจสอบรายการสินค้าอุปกรณ์ก่อนชำระเงิน" /><div className="cart-layout"><div className="cart-items">{cart.length ? cart.map((item) => <article className="cart-item" key={`${item.itemType || 'product'}-${item.id}`}><span className={`cart-product-icon ${item.tone || 'green'}`}>{item.icon || '⚡'}</span><div className="cart-item-info"><small>{item.category || (item.itemType === 'package' ? 'แพ็กเกจติดตั้ง' : 'สินค้า')}</small><h3>{item.name}</h3><strong><Money value={item.price} /></strong></div><div className="quantity-control"><button aria-label="ลดจำนวน" onClick={() => setCart((items) => items.map((current) => current.id === item.id && (current.itemType || 'product') === (item.itemType || 'product') ? { ...current, quantity: Math.max(1, current.quantity - 1) } : current))}>−</button><span>{item.quantity}</span><button aria-label="เพิ่มจำนวน" onClick={() => setCart((items) => items.map((current) => current.id === item.id && (current.itemType || 'product') === (item.itemType || 'product') ? { ...current, quantity: current.quantity + 1 } : current))}>+</button></div><button className="remove-item" aria-label="ลบสินค้า" onClick={() => setCart((items) => items.filter((current) => !(current.id === item.id && (current.itemType || 'product') === (item.itemType || 'product'))))}><X size={17} /></button></article>) : <div className="empty-state"><ShoppingBag size={30} /><h3>ยังไม่มีสินค้าในตะกร้า</h3><p>เลือกชมอุปกรณ์โซลาร์เซลล์ที่ต้องการ</p><a className="button button-green" href="#/products">เลือกซื้อสินค้า <ArrowRight size={16} /></a></div>}</div>{cart.length > 0 && <aside className="summary-card"><h3>สรุปคำสั่งซื้อ</h3><div><span>ยอดรวมสินค้า</span><strong><Money value={subtotal} /></strong></div><div><span>ค่าจัดส่ง</span><strong>คำนวณภายหลัง</strong></div><hr /><div className="summary-total"><span>ยอดรวม</span><strong><Money value={subtotal} /></strong></div><button className="button button-green" onClick={() => navigate('/checkout')}>ดำเนินการสั่งซื้อ <ArrowRight size={16} /></button><p><ShieldCheck size={14} /> ชำระเงินอย่างปลอดภัย</p></aside>}</div></div>;
}

export function Checkout({ cart, setCart, authUser, setToast, navigate }) {
  const [shipping, setShipping] = useState(() => ({
    name: authUser?.user_metadata?.full_name || '',
    phone: '',
    addressLine: '',
    province: '',
    amphoe: '',
    district: '',
    zipcode: '',
    notes: '',
    ...getSavedShipping(authUser?.id),
  }));
  const loadedAddressUserId = useRef(authUser?.id);
  const [orderId, setOrderId] = useState('');
  const [paymentPlan, setPaymentPlan] = useState('full');
  const [installmentRows, setInstallmentRows] = useState([]);
  const [nextInstallment, setNextInstallment] = useState(null);
  const [paymentStarted, setPaymentStarted] = useState(false);
  const [linkedQuote, setLinkedQuote] = useState(null);
  const [paidSummary, setPaidSummary] = useState(null);
  const [qrPayment, setQrPayment] = useState(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [paid, setPaid] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [resolvingLegacyItems, setResolvingLegacyItems] = useState(false);
  const [legacyResolutionError, setLegacyResolutionError] = useState('');

  // ---- ตัวเลือกช่างติดตั้ง ----
  const [installMode, setInstallMode] = useState('none'); // 'none' = ไม่เอาช่าง | 'technician' = เอาช่าง
  const [installDate, setInstallDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null); // { start, label }
  const [bookingInfo, setBookingInfo] = useState(null); // { status: 'created' | 'failed', number?, message? }
  const paidHandledRef = useRef(false);
  const markPaidRef = useRef(null);

  const wantsTechnician = installMode === 'technician';
  const packageItems = cart.filter((item) => item.itemType === 'package');
  const unorderableItems = cart.filter((item) => !isOrderableItem(item));
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const shippingAddress = [
    shipping.addressLine.trim(),
    `${shipping.province === 'กรุงเทพมหานคร' ? 'แขวง' : 'ตำบล'}${shipping.district}`,
    `${shipping.province === 'กรุงเทพมหานคร' ? 'เขต' : 'อำเภอ'}${shipping.amphoe}`,
    `จังหวัด${shipping.province}`,
    shipping.zipcode,
  ].filter((part) => part.trim()).join(', ');

  useEffect(() => {
    const userId = authUser?.id;
    if (!userId || loadedAddressUserId.current === userId) return;

    const savedShipping = getSavedShipping(userId);
    if (savedShipping) {
      setShipping((current) => ({
        ...current,
        ...Object.fromEntries(ADDRESS_FIELDS
          .filter((field) => typeof savedShipping[field] === 'string')
          .map((field) => [field, savedShipping[field]])),
      }));
    }
    loadedAddressUserId.current = userId;
  }, [authUser?.id]);

  useEffect(() => {
    const userId = authUser?.id;
    if (!userId || loadedAddressUserId.current !== userId) return;

    try {
      const savedShipping = Object.fromEntries(ADDRESS_FIELDS.map((field) => [field, shipping[field]]));
      localStorage.setItem(`solarservice_checkout_address_${userId}`, JSON.stringify(savedShipping));
    } catch (error) {
      console.error('Could not save checkout address:', error);
      setToast('บันทึกที่อยู่ในอุปกรณ์นี้ไม่สำเร็จ');
    }
  }, [authUser?.id, shipping, setToast]);

  useEffect(() => {
    const legacyItems = cart.filter((item) => item.itemType !== 'package' && !isOrderableItem(item));
    if (!legacyItems.length || !supabase) {
      setResolvingLegacyItems(false);
      setLegacyResolutionError('');
      return undefined;
    }

    let active = true;
    setResolvingLegacyItems(true);
    setLegacyResolutionError('');
    (async () => {
      try {
        const resolvedItems = await Promise.all(legacyItems.map(async (item) => {
          const legacyProduct = legacyCatalogProducts.find((product) => String(product.id) === String(item.id));
          const slug = item.slug || legacyProduct?.slug;
          if (!slug) return { id: String(item.id), product: null };
          const { data, error } = await supabase.from('products')
            .select('id,name,slug,category,description,price,compare_at_price,image_url,stock_quantity,warranty_months,is_active')
            .eq('slug', slug)
            .eq('is_active', true)
            .maybeSingle();
          if (error) throw error;
          return { id: String(item.id), product: data };
        }));
        if (!active) return;

        const productsByLegacyId = new Map(resolvedItems
          .filter((entry) => entry.product)
          .map((entry) => [entry.id, entry.product]));
        const missingProducts = legacyItems.filter((item) => !productsByLegacyId.has(String(item.id)));
        if (missingProducts.length) {
          setLegacyResolutionError(`ไม่พบสินค้าเดิมในแค็ตตาล็อกปัจจุบัน: ${missingProducts.map((item) => item.name).join(', ')} กรุณาเลือกสินค้าจากหน้าแค็ตตาล็อกอีกครั้ง`);
        }
        if (productsByLegacyId.size) {
          setCart((items) => items.map((item) => {
            const product = productsByLegacyId.get(String(item.id));
            return product
              ? { ...item, ...product, itemType: 'product', quantity: item.quantity }
              : item;
          }));
        }
      } catch (error) {
        if (active) {
          setLegacyResolutionError(`ตรวจสอบสินค้าเดิมไม่สำเร็จ: ${getErrorMessage(error)}`);
        }
      } finally {
        if (active) setResolvingLegacyItems(false);
      }
    })();

    return () => { active = false; };
  }, [cart, setCart]);

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
    if (typeof bookingService.createBooking !== 'function') throw new Error('ไม่พบฟังก์ชันสร้างการจอง (createBooking)');
    return bookingService.createBooking({
      serviceType: 'installation',
      preferredAt: selectedSlot.start,
      phone: shipping.phone.replace(/\D/g, '').slice(0, 10),
      address: shippingAddress,
      province: shipping.province,
      notes: `ติดตั้งอุปกรณ์จากคำสั่งซื้อ ${id}`,
    });
  }

  async function markPaid(id) {
    if (paidHandledRef.current) return;
    paidHandledRef.current = true;
    if (qrPayment?.installmentId) {
      const updatedInstallments = installmentRows.map((item) => (
        item.id === qrPayment.installmentId ? { ...item, status: 'paid' } : item
      ));
      setInstallmentRows(updatedInstallments);
      const next = updatedInstallments.find((item) => item.status === 'pending');
      if (next) {
        setNextInstallment(next);
        setQrPayment(null);
        setPaymentMessage(`ชำระงวด ${qrPayment.installmentNumber} แล้ว เลือกชำระงวดถัดไปเมื่อพร้อม`);
        setToast(`ชำระงวด ${qrPayment.installmentNumber} เรียบร้อยแล้ว`);
        return;
      }
    }

    const summaryItems = (qrPayment?.orderItems || []).length
      ? qrPayment.orderItems
      : cart.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        lineTotal: item.price * item.quantity,
      }));
    setPaidSummary({
      orderId: id,
      createdAt: new Date().toISOString(),
      items: summaryItems,
      amountInBaht: installmentRows.length
        ? installmentRows.reduce((total, item) => total + Number(item.amount), 0)
        : qrPayment?.amountInBaht ?? subtotal,
    });
    setPaid(true);
    setCart([]);
    setToast('ชำระเงินเรียบร้อยแล้ว');

    try {
      const quote = await getQuotationByOrderId(id);
      if (quote) setLinkedQuote(quote);
    } catch {
      // ignore if quotation query fails
    }

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
        const result = await getPromptPayPaymentStatus(qrPayment.orderId, qrPayment.installmentId);
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
      const result = await getPromptPayPaymentStatus(qrPayment.orderId, qrPayment.installmentId);
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
    if (packageItems.length) {
      setToast('แพ็กเกจต้องติดต่อเพื่อนัดประเมินหน้างานก่อนสั่งซื้อ');
      navigate(`/contact?package=${encodeURIComponent(packageItems[0].name)}`);
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
    if (
      !shipping.addressLine.trim()
      || !shipping.province
      || !shipping.amphoe
      || !shipping.district
      || !/^\d{5}$/.test(shipping.zipcode)
    ) {
      setToast('กรุณากรอกที่อยู่และเลือกจังหวัด อำเภอ/เขต ตำบล/แขวง พร้อมรหัสไปรษณีย์ให้ครบ');
      return;
    }
    if (wantsTechnician && (!installDate || !selectedSlot)) {
      setToast('กรุณาเลือกวันและเวลาสำหรับนัดช่างติดตั้ง');
      return;
    }

    setSubmitting(true);
    try {
      let activeOrderId = orderId;
      let installmentToPay = nextInstallment;
      if (!activeOrderId) {
        const installNote = wantsTechnician
          ? `\n[ต้องการช่างติดตั้ง] นัด: ${selectedSlot.label} วันที่ ${installDate} จังหวัด ${shipping.province}`
          : '\n[ไม่ต้องการช่างติดตั้ง]';
        const { data, error } = await supabase.rpc('create_order', {
          p_shipping_name: shipping.name,
          p_shipping_phone: shipping.phone,
          p_shipping_address: shippingAddress,
          p_items: cart.map((item) => (
            item.itemType === 'package'
              ? { package_id: item.id, quantity: item.quantity }
              : { product_id: item.id, quantity: item.quantity }
          )),
          p_notes: `${shipping.notes || ''}${installNote}`.trim(),
        });
        if (error) {
          if (/product_id/i.test(error.message || '') && cart.some((item) => item.itemType === 'package')) {
            throw new Error('กรุณารัน migration 20261127060000_package_checkout_and_10_baht_test.sql ใน Supabase SQL Editor ก่อนสั่งซื้อแพ็กเกจ');
          }
          throw error;
        }
        if (typeof data !== 'string') throw new Error('ไม่สามารถสร้างคำสั่งซื้อได้');
        activeOrderId = data;
        setOrderId(activeOrderId);
      }

      if (paymentPlan === 'three_installments' && !installmentRows.length) {
        const { data: schedule, error: scheduleError } = await supabase.rpc('set_order_payment_plan', {
          p_order_id: activeOrderId,
          p_plan: paymentPlan,
        });
        if (scheduleError) {
          if (/PGRST202|set_order_payment_plan|schema cache/i.test(scheduleError.message || '')) {
            throw new Error(`${scheduleError.message} — กรุณารัน migration 20261128000000_customer_sales_workflows.sql ใน Supabase ก่อนเปิดใช้ระบบผ่อนชำระ`);
          }
          throw scheduleError;
        }
        if (!schedule?.length) throw new Error('ระบบไม่สามารถสร้างตารางผ่อนชำระได้');
        setInstallmentRows(schedule);
        installmentToPay = schedule.find((item) => item.status === 'pending') || schedule[0];
        setNextInstallment(installmentToPay);
      } else if (paymentPlan === 'three_installments' && !installmentToPay) {
        installmentToPay = installmentRows.find((item) => item.status === 'pending') || null;
        setNextInstallment(installmentToPay);
      }

      if (paymentPlan === 'full' && activeOrderId && installmentRows.length && !paymentStarted) {
        const { error: planError } = await supabase.rpc('set_order_payment_plan', {
          p_order_id: activeOrderId,
          p_plan: 'full',
        });
        if (planError) throw planError;
        setInstallmentRows([]);
        setNextInstallment(null);
      }

      setPaymentStarted(true);
      const result = await createPromptPayQr(activeOrderId, installmentToPay?.id || null);
      if (result.status !== 'succeeded' && !result.qrCodeUrl) {
        throw new Error('Stripe ไม่ได้ส่งลิงก์ QR PromptPay กลับมา');
      }
      setQrPayment({
        ...result,
        orderId: activeOrderId,
        installmentId: installmentToPay?.id || null,
        installmentNumber: installmentToPay?.installment_number || null,
        createdAt: new Date().toISOString(),
      });
      paidHandledRef.current = false;
      setPaymentMessage(installmentToPay
        ? `รอชำระเงินงวดที่ ${installmentToPay.installment_number} ผ่าน PromptPay`
        : 'รอการชำระเงินผ่าน PromptPay ระบบจะตรวจสอบสถานะให้อัตโนมัติ');
    } catch (error) {
      console.error('checkout error:', error);
      setToast(`ชำระเงินไม่สำเร็จ: ${getErrorMessage(error, 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ')}`);
    } finally {
      setSubmitting(false);
    }
  }

  function printPaymentQuotation() {
    document.body.classList.add('print-payment-quotation');
    window.addEventListener('afterprint', () => document.body.classList.remove('print-payment-quotation'), { once: true });
    window.print();
    window.setTimeout(() => document.body.classList.remove('print-payment-quotation'), 1000);
  }

  if (paid) {
    const summary = paidSummary || {
      orderId,
      createdAt: new Date().toISOString(),
      items: qrPayment?.orderItems || [],
      amountInBaht: qrPayment?.amountInBaht ?? subtotal,
    };
    return <div className="page-wrap">
      <style>{CSS}</style>
      <PageIntro eyebrow="PAYMENT COMPLETE" title="ชำระเงินเรียบร้อย" description="ระบบได้รับการยืนยันการชำระเงินผ่าน PromptPay และออกใบเสนอราคาเรียบร้อยแล้ว" />
      <div className="success-panel no-print">
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
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button className="button button-green" type="button" onClick={() => navigate('/tracking')}>ติดตามคำสั่งซื้อ <ArrowRight size={16} /></button>
          {linkedQuote && (
            <button className="button button-outline" type="button" onClick={() => navigate('/quotes')}>ดูใบเสนอราคาของฉัน</button>
          )}
        </div>
      </div>

      <section className="promptpay-qr-panel payment-quotation" style={{ marginTop: '24px' }}>
        <div className="payment-quotation-document">
          <header className="payment-quotation-header">
            <div>
              <span className="payment-quotation-brand">SOLARSERVICE</span>
              <h2>ใบเสนอราคา (QUOTATION)</h2>
              <p>เอกสารยืนยันรายการหลังชำระเงินสำเร็จ</p>
            </div>
            <button className="button button-outline no-print" type="button" onClick={printPaymentQuotation}>
              <Printer size={15} /> พิมพ์ / บันทึก PDF
            </button>
          </header>

          <div className="payment-quotation-meta">
            <div><small>เลขที่ใบเสนอราคา</small><strong>{linkedQuote?.quote_number || `QT-${String(orderId).slice(0, 8).toUpperCase()}`}</strong></div>
            <div><small>เลขที่คำสั่งซื้อ</small><strong>{orderId}</strong></div>
            <div><small>วันที่ออกเอกสาร</small><strong>{new Date(summary.createdAt).toLocaleDateString('th-TH', { dateStyle: 'long' })}</strong></div>
          </div>

          <div className="payment-quotation-customer">
            <strong>ข้อมูลผู้สั่งซื้อ</strong>
            <span>{shipping.name}</span>
            <span>{shipping.phone}</span>
            <span>{shippingAddress}</span>
          </div>

          <div className="payment-quotation-table-wrap">
            <table className="payment-quotation-table">
              <thead><tr><th>รายการ</th><th>จำนวน</th><th>รวม</th></tr></thead>
              <tbody>
                {(summary.items || []).map((item, index) => (
                  <tr key={`${item.name}-${index}`}>
                    <td>{item.name}</td><td>{item.quantity}</td><td><Money value={item.lineTotal} /></td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr><th colSpan="2">ยอดสุทธิที่ชำระแล้ว</th><th><Money value={summary.amountInBaht} /></th></tr></tfoot>
            </table>
          </div>
        </div>
      </section>
    </div>;
  }

  const locked = Boolean(orderId);

  return <div className="page-wrap">
    <style>{CSS}</style>
    <PageIntro eyebrow="CHECKOUT" title="ยืนยันคำสั่งซื้อ" description="ซื้อสินค้าออนไลน์ได้โดยไม่ต้องเลือกติดตั้ง พร้อมเลือกชำระเต็มจำนวนหรือผ่อน 3 งวดไม่มีดอกเบี้ย" />
    {!cart.length && !orderId ? (
      <div className="empty-state">
        <ShoppingBag size={30} />
        <h3>ยังไม่มีสินค้าในตะกร้า</h3>
        <button className="button button-green" onClick={() => navigate('/products')}>เลือกซื้อสินค้า <ArrowRight size={16} /></button>
      </div>
    ) : qrPayment ? (
      <section className="promptpay-qr-panel payment-quotation" aria-live="polite">
        <div className="payment-quotation-document">
          <header className="payment-quotation-header">
            <div>
              <span className="payment-quotation-brand">SOLARSERVICE</span>
              <h2>ชำระเงินผ่าน PromptPay</h2>
              <p>สรุปรายการคำสั่งซื้อ (ใบเสนอราคาจะออกให้หลังชำระเงินสำเร็จ)</p>
            </div>
          </header>

          <div className="payment-quotation-meta">
            <div><small>เลขที่อ้างอิงคำสั่งซื้อ</small><strong>{orderId}</strong></div>
            <div><small>วันที่ทำรายการ</small><strong>{new Date(qrPayment.createdAt || Date.now()).toLocaleDateString('th-TH', { dateStyle: 'long' })}</strong></div>
          </div>

          <div className="payment-quotation-customer">
            <strong>ข้อมูลผู้สั่งซื้อ</strong>
            <span>{shipping.name}</span>
            <span>{shipping.phone}</span>
            <span>{shippingAddress}</span>
          </div>

          <div className="payment-quotation-table-wrap">
            <table className="payment-quotation-table">
              <thead><tr><th>รายการ</th><th>จำนวน</th><th>รวม</th></tr></thead>
              <tbody>
                {(qrPayment.orderItems || []).map((item, index) => (
                  <tr key={`${item.name}-${index}`}>
                    <td>{item.name}</td><td>{item.quantity}</td><td><Money value={item.lineTotal} /></td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr><th colSpan="2">ยอดสุทธิที่ต้องชำระ</th><th><Money value={qrPayment.amountInBaht ?? subtotal} /></th></tr></tfoot>
            </table>
          </div>

          {wantsTechnician && selectedSlot && (
            <p className="payment-quotation-service"><Wrench size={14} /> นัดช่างติดตั้ง: {selectedSlot.label} วันที่ {installDate} · {shipping.province}</p>
          )}

          <div className="payment-quotation-qr">
            <h3>QR สำหรับชำระเงินผ่าน PromptPay</h3>
            <p>เปิดแอปธนาคารแล้วสแกน QR Code เพื่อชำระเงินตามยอดที่ระบุ</p>
            {secondsRemaining > 0 && qrPayment.qrCodeUrl
              ? <img className="promptpay-qr-image" src={qrPayment.qrCodeUrl} alt="QR Code สำหรับชำระเงินผ่าน PromptPay" />
              : <p className="payment-quotation-expired">QR หมดอายุแล้ว กรุณาสร้าง QR ใหม่ก่อนชำระเงิน</p>}
            <strong className={secondsRemaining ? 'promptpay-countdown' : 'promptpay-countdown expired'}>
              {secondsRemaining ? `QR ใช้ได้อีก ${Math.floor(secondsRemaining / 60)}:${String(secondsRemaining % 60).padStart(2, '0')} นาที` : 'QR หมดอายุแล้ว'}
            </strong>
            {qrPayment.hostedInstructionsUrl && <a className="no-print" href={qrPayment.hostedInstructionsUrl} target="_blank" rel="noreferrer">เปิดหน้าแสดง QR จาก Stripe</a>}
          </div>
        </div>

        <div className="payment-quotation-actions no-print">
          <p role="status">{paymentMessage}</p>
          <button className="button button-green" type="button" onClick={checkPaymentStatus} disabled={checkingPayment}>
            {checkingPayment ? 'กำลังตรวจสอบ…' : 'ตรวจสอบการชำระเงิน'}
          </button>
          {secondsRemaining === 0 && <button className="button button-outline" type="button" onClick={submitCheckout} disabled={submitting}>
            {submitting ? 'กำลังสร้าง QR…' : 'สร้าง QR ใหม่'} <ArrowRight size={16} />
          </button>}
        </div>
      </section>
    ) : installmentRows.some((item) => item.status === 'paid') && nextInstallment && orderId ? (
      <section className="success-panel" aria-live="polite">
        <span><Check size={28} /></span>
        <h2>งวดก่อนหน้าชำระแล้ว</h2>
        <p>งวดถัดไป {nextInstallment.installment_number} จาก 3 · {new Date(nextInstallment.due_date).toLocaleDateString('th-TH')} · <Money value={nextInstallment.amount} /></p>
        <p>ยอดรวมแบ่งชำระ 3 งวดโดยไม่มีดอกเบี้ย</p>
        {paymentMessage && <p role="status">{paymentMessage}</p>}
        <button className="button button-green" type="button" onClick={submitCheckout} disabled={submitting}>
          {submitting ? 'กำลังสร้าง QR…' : `ชำระงวดที่ ${nextInstallment.installment_number}`} <ArrowRight size={16} />
        </button>
        <button className="button button-outline" type="button" onClick={() => navigate('/orders')}>กลับไปคำสั่งซื้อของฉัน</button>
      </section>
    ) : (
      <form className="checkout-form" onSubmit={submitCheckout}>
        {unorderableItems.length > 0 && (
          <div className="sx-note sx-note-warn full-width" role="alert">
            <p style={{ margin: '0 0 8px' }}>
              {resolvingLegacyItems
                ? 'กำลังตรวจสอบและเชื่อมรายการเก่ากับสินค้าในแค็ตตาล็อก…'
                : legacyResolutionError || `รายการที่ไม่มีรหัสสินค้าในฐานข้อมูลจึงยังสั่งซื้อไม่ได้: ${unorderableItems.map((item) => item.name).join(', ')}`}
            </p>
            {!resolvingLegacyItems && <button type="button" className="button button-outline small-button" onClick={() => setCart((items) => items.filter(isOrderableItem))}>
              ลบรายการที่สั่งซื้อไม่ได้ออกจากตะกร้า
            </button>}
          </div>
        )}
        <label>ชื่อ-นามสกุล
          <input required disabled={locked} value={shipping.name} placeholder="ชื่อผู้รับสินค้า" onChange={(event) => setShipping({ ...shipping, name: event.target.value })} />
        </label>
        <label>เบอร์โทรศัพท์
          <input type="tel" required disabled={locked} value={shipping.phone} placeholder="08X-XXX-XXXX" onChange={(event) => setShipping({ ...shipping, phone: event.target.value })} />
        </label>
        <div className="sx-address-grid full-width">
          <label className="full-width">บ้านเลขที่ / หมู่บ้าน / ถนน
            <textarea rows="2" required disabled={locked} value={shipping.addressLine} placeholder="บ้านเลขที่ ซอย หมู่บ้าน ถนน" onChange={(event) => setShipping({ ...shipping, addressLine: event.target.value })} />
          </label>
          <label>จังหวัด
            <select required disabled={locked} value={shipping.province} onChange={(event) => setShipping({
              ...shipping,
              province: event.target.value,
              amphoe: '',
              district: '',
              zipcode: '',
            })}>
              <option value="">เลือกจังหวัด</option>
              {THAI_PROVINCES.map((province) => <option key={province} value={province}>{province}</option>)}
            </select>
          </label>
          <label>{shipping.province === 'กรุงเทพมหานคร' ? 'เขต' : 'อำเภอ'}
            <select required disabled={locked || !shipping.province} value={shipping.amphoe} onChange={(event) => setShipping({
              ...shipping,
              amphoe: event.target.value,
              district: '',
              zipcode: '',
            })}>
              <option value="">เลือก{shipping.province === 'กรุงเทพมหานคร' ? 'เขต' : 'อำเภอ'}</option>
              {getAmphoes(shipping.province).map((amphoe) => <option key={amphoe} value={amphoe}>{amphoe}</option>)}
            </select>
          </label>
          <label>{shipping.province === 'กรุงเทพมหานคร' ? 'แขวง' : 'ตำบล'}
            <select required disabled={locked || !shipping.amphoe} value={shipping.district} onChange={(event) => setShipping({
              ...shipping,
              district: event.target.value,
              zipcode: getZipcode(shipping.province, shipping.amphoe, event.target.value),
            })}>
              <option value="">เลือก{shipping.province === 'กรุงเทพมหานคร' ? 'แขวง' : 'ตำบล'}</option>
              {getDistricts(shipping.province, shipping.amphoe).map((district) => <option key={district} value={district}>{district}</option>)}
            </select>
          </label>
          <label>รหัสไปรษณีย์
            <input required disabled={locked} inputMode="numeric" autoComplete="postal-code" maxLength={5} pattern="[0-9]{5}" title="กรุณากรอกรหัสไปรษณีย์ 5 หลัก" value={shipping.zipcode} placeholder="เช่น 23110" onChange={(event) => setShipping({ ...shipping, zipcode: event.target.value.replace(/\D/g, '').slice(0, 5) })} />
          </label>
          <p className="sx-address-hint">เลือกพื้นที่ตามลำดับ จังหวัด → อำเภอ/เขต → ตำบล/แขวง ระบบเติมรหัสไปรษณีย์ให้อัตโนมัติ</p>
        </div>
        <p className="sx-address-hint full-width">ระบบบันทึกชื่อ เบอร์โทร และที่อยู่นี้ไว้ในอุปกรณ์ เพื่อเติมให้อัตโนมัติครั้งถัดไป</p>
        <label className="full-width">หมายเหตุเพิ่มเติม
          <textarea rows="2" disabled={locked} value={shipping.notes} placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)" onChange={(event) => setShipping({ ...shipping, notes: event.target.value })} />
        </label>

        <fieldset className="sx-install full-width" style={{ border: 0, padding: 0, margin: 0 }} disabled={paymentStarted || installmentRows.some((item) => item.status === 'paid')}>
          <legend className="sx-install-title">วิธีชำระเงิน</legend>
          <div className="sx-choice-group" role="radiogroup" aria-label="เลือกวิธีชำระเงิน">
            <label className={`sx-choice ${paymentPlan === 'full' ? 'on' : ''}`}>
              <input type="radio" name="payment-plan" checked={paymentPlan === 'full'} onChange={() => setPaymentPlan('full')} />
              <span><strong>ชำระเต็มจำนวน</strong><small>ชำระยอดรวมครั้งเดียวผ่าน PromptPay</small></span>
            </label>
            <label className={`sx-choice ${paymentPlan === 'three_installments' ? 'on' : ''}`}>
              <input
                type="radio"
                name="payment-plan"
                checked={paymentPlan === 'three_installments'}
                disabled={subtotal < 30}
                onChange={() => setPaymentPlan('three_installments')}
              />
              <span><strong>ผ่อน 3 งวด ไม่มีดอกเบี้ย</strong><small>{subtotal >= 30 ? `แบ่งชำระ 3 ครั้ง งวดละประมาณ ${(subtotal / 3).toLocaleString('th-TH')} บาท` : 'ยอดรวมต้องไม่น้อยกว่า 30 บาท'}</small></span>
            </label>
          </div>
          {paymentPlan === 'three_installments' && <p className="sx-note">งวดแรกชำระวันนี้ งวดที่ 2 และ 3 ครบกำหนดอีก 1 และ 2 เดือนตามลำดับ ระบบส่งอีเมลเตือน 3 วันก่อนและวันครบกำหนด ชำระแต่ละงวดผ่าน QR ได้จากหน้าคำสั่งซื้อของฉัน</p>}
        </fieldset>

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
              <p className="sx-note">ใช้ที่อยู่จัดส่งเดียวกันสำหรับติดตั้ง: {shipping.addressLine} {shipping.district} {shipping.amphoe} {shipping.province}</p>
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
