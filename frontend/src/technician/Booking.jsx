import { useEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowRight, CalendarDays, Check, ClipboardList, Sun, Wrench } from 'lucide-react';
import { SERVICE_TYPES, createBooking, getMyProfile, getSlotAvailability } from '../services/bookingService.js';


const SERVICE_ICONS = {
  survey: <ClipboardList size={22} />,
  installation: <Sun size={22} />,
  maintenance: <Wrench size={22} />,
};

const PROVINCES = ['กรุงเทพมหานคร', 'นนทบุรี', 'ปทุมธานี', 'สมุทรปราการ', 'เชียงใหม่', 'ชลบุรี', 'ขอนแก่น', 'ภูเก็ต', 'อื่น ๆ'];

// สร้างข้อความวันที่แบบ YYYY-MM-DD ตามเวลาของเครื่องผู้ใช้ (ไม่ใช้ toISOString เพราะจะเลื่อนเป็น UTC)
function toDateInputValue(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function normalizePhone(value) {
  return value.replace(/[\s-]/g, '');
}

export default function Booking({ user, navigate, setToast }) {
  const today = toDateInputValue(new Date());
  const submittingRef = useRef(false);

  const [serviceType, setServiceType] = useState('survey');
  const [date, setDate] = useState('');
  const [slotStart, setSlotStart] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [province, setProvince] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState('');

  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ดึงชื่อและเบอร์โทรจากโปรไฟล์เดิม (ถ้ามี)
  useEffect(() => {
    if (!user) return undefined;
    let active = true;
    getMyProfile()
      .then((profile) => {
        if (!active || !profile) return;
        setContactName(profile.full_name || '');
        if (profile.phone) setPhone((current) => current || profile.phone);
      })
      .catch((error) => {
        if (active) {
          setFormError(`โหลดข้อมูลโปรไฟล์ไม่สำเร็จ: ${error instanceof Error ? error.message : 'เกิดข้อผิดพลาด'}`);
        }
      });
    return () => { active = false; };
  }, [user?.id]);

  // ดึงเวลาว่างจริงจากฐานข้อมูลทุกครั้งที่เปลี่ยนวันที่
  async function loadSlots(targetDate, isActive = () => true) {
    if (!targetDate) {
      setSlots([]);
      return;
    }
    setSlotsLoading(true);
    setSlotsError('');
    try {
      const result = await getSlotAvailability(targetDate);
      if (isActive()) setSlots(result);
    } catch (error) {
      if (isActive()) {
        setSlots([]);
        setSlotsError(error instanceof Error ? error.message : 'ตรวจสอบช่วงเวลานัดหมายไม่สำเร็จ');
      }
    } finally {
      if (isActive()) setSlotsLoading(false);
    }
  }

  useEffect(() => {
    if (!user) return undefined;
    let active = true;
    setSlotStart('');
    loadSlots(date, () => active);
    return () => { active = false; };
  }, [date, user?.id]);

  function validate() {
    const next = {};
    if (!serviceType) next.serviceType = 'กรุณาเลือกประเภทบริการ';
    if (!date) next.date = 'กรุณาเลือกวันที่นัดหมาย';
    else if (date < today) next.date = 'ไม่สามารถเลือกวันที่ผ่านมาแล้ว';
    const chosen = slots.find((slot) => slot.slot_start === slotStart);
    if (!slotStart || !chosen) next.slot = 'กรุณาเลือกช่วงเวลา';
    else if (!chosen.is_available) next.slot = 'ช่วงเวลานี้ไม่ว่างแล้ว กรุณาเลือกช่วงเวลาอื่น';
    if (!/^0\d{8,9}$/.test(normalizePhone(phone))) next.phone = 'กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง เช่น 081-234-5678';
    if (!province) next.province = 'กรุณาเลือกจังหวัด';
    if (address.trim().length < 10) next.address = 'กรุณากรอกที่อยู่ให้ครบถ้วน (บ้านเลขที่ ถนน แขวง/ตำบล เขต/อำเภอ)';
    return next;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submittingRef.current) return; // กันกดซ้ำ
    setFormError('');

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    submittingRef.current = true;
    setSubmitting(true);
    try {
      await createBooking({
        serviceType,
        preferredAt: slotStart,
        phone: normalizePhone(phone),
        address: address.trim(),
        province,
        notes: notes.trim(),
      });
      setToast('จองบริการสำเร็จ ทีมงานจะยืนยันนัดหมายภายใน 24 ชั่วโมง');
      navigate('/booking-history');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'จองบริการไม่สำเร็จ กรุณาลองอีกครั้ง');
      if (['SLOT_FULL', 'SLOT_IN_PAST', 'INVALID_SLOT'].includes(error.code)) {
        setSlotStart('');
        loadSlots(date);
      }
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  if (!user) {
    return (
      <div className="page-wrap">
        <div className="empty-state">
          <AlertCircle size={28} />
          <h3>กรุณาเข้าสู่ระบบก่อนจองบริการ</h3>
          <p>ต้องเข้าสู่ระบบเพื่อให้ทีมงานติดต่อและติดตามการจองของคุณได้</p>
          <a className="button button-green" href="#/login">เข้าสู่ระบบ <ArrowRight size={16} /></a>
        </div>
      </div>
    );
  }

  const selected = SERVICE_TYPES.find((item) => item.value === serviceType);

  return (
    <div className="page-wrap">
      <section className="page-intro">
        <div className="eyebrow">SERVICE BOOKING</div>
        <h1>จองบริการช่าง</h1>
        <p>เลือกบริการและช่วงเวลาที่สะดวก ทีมงานจะยืนยันนัดหมายให้ภายใน 24 ชั่วโมง</p>
        <button className="button button-outline small-button" type="button" onClick={() => navigate('/booking-history')}>ดูประวัติการจอง</button>
      </section>

      <form className="bk-form" onSubmit={handleSubmit} noValidate>
        <fieldset className="bk-section">
          <legend>1. เลือกประเภทบริการ</legend>
          <div className="bk-service-grid" role="radiogroup" aria-label="ประเภทบริการ">
            {SERVICE_TYPES.map((item) => (
              <label key={item.value} className={`bk-service-card ${serviceType === item.value ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="service_type"
                  value={item.value}
                  checked={serviceType === item.value}
                  onChange={() => setServiceType(item.value)}
                />
                <span className="bk-service-icon">{SERVICE_ICONS[item.value]}</span>
                <strong>{item.label}</strong>
                <small>{item.description}</small>
                {item.value === 'survey' && <span className="bk-recommend">แนะนำ</span>}
              </label>
            ))}
          </div>
          {errors.serviceType && <p className="bk-error" role="alert">{errors.serviceType}</p>}
          {serviceType === 'survey' && (
            <div className="bk-note">
              <CalendarDays size={18} />
              <p>ช่างจะเข้าสำรวจและวัดพื้นที่จริงที่บ้านคุณ เพื่อประเมินความเหมาะสมในการติดตั้งก่อนเสนอราคา</p>
            </div>
          )}
        </fieldset>

        <fieldset className="bk-section">
          <legend>2. เลือกวันและเวลา</legend>
          <label className="bk-field">
            วันที่นัดหมาย
            <input type="date" value={date} min={today} onChange={(event) => setDate(event.target.value)} aria-invalid={Boolean(errors.date)} />
            {errors.date && <span className="bk-error" role="alert">{errors.date}</span>}
          </label>

          <div className="bk-field">
            <span className="bk-label">ช่วงเวลา</span>
            {!date && <p className="bk-hint">เลือกวันที่ก่อน ระบบจะแสดงช่วงเวลาที่เลือกได้</p>}
            {date && !slotsLoading && !slotsError && (
              <p className="bk-hint" role="note">หมายเหตุ: ตาม RLS ปัจจุบัน ระบบตรวจสอบได้เฉพาะรายการที่บัญชีของคุณอ่านได้ จึงยังยืนยันคิวว่างของลูกค้าทุกคนไม่ได้</p>
            )}
            {date && slotsLoading && <p className="bk-hint" role="status">กำลังตรวจสอบเวลาว่าง…</p>}
            {date && !slotsLoading && slotsError && (
              <div className="bk-inline-error" role="alert">
                <span>{slotsError}</span>
                <button type="button" className="button button-outline small-button" onClick={() => loadSlots(date)}>ลองใหม่</button>
              </div>
            )}
            {date && !slotsLoading && !slotsError && slots.length > 0 && (
              <div className="bk-slot-grid" role="radiogroup" aria-label="ช่วงเวลา">
                {slots.map((slot) => {
                  return (
                    <label key={slot.slot_start} className={`bk-slot ${slotStart === slot.slot_start ? 'selected' : ''} ${slot.is_available ? '' : 'disabled'}`}>
                      <input
                        type="radio"
                        name="slot"
                        value={slot.slot_start}
                        disabled={!slot.is_available}
                        checked={slotStart === slot.slot_start}
                        onChange={() => setSlotStart(slot.slot_start)}
                      />
                      <strong>{slot.slot_label}</strong>
                      <small>
                        {slot.is_available
                          ? 'ยังไม่พบรายการจองที่มองเห็นในช่วงนี้'
                          : slot.unavailable_reason === 'past'
                            ? 'เวลาผ่านไปแล้ว'
                            : 'คุณมีรายการจองแล้ว'}
                      </small>
                    </label>
                  );
                })}
              </div>
            )}
            {errors.slot && <span className="bk-error" role="alert">{errors.slot}</span>}
          </div>
        </fieldset>

        <fieldset className="bk-section">
          <legend>3. ข้อมูลติดต่อและสถานที่</legend>
          <div className="bk-grid">
            <label className="bk-field">
              ชื่อผู้ติดต่อ
              <input value={contactName} readOnly placeholder="ชื่อจากโปรไฟล์ของคุณ" />
              <small className="bk-hint">แก้ไขได้ที่หน้าโปรไฟล์</small>
            </label>
            <label className="bk-field">
              เบอร์โทรศัพท์
              <input type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="08X-XXX-XXXX" aria-invalid={Boolean(errors.phone)} />
              {errors.phone && <span className="bk-error" role="alert">{errors.phone}</span>}
            </label>
            <label className="bk-field">
              จังหวัด
              <select value={province} onChange={(event) => setProvince(event.target.value)} aria-invalid={Boolean(errors.province)}>
                <option value="">เลือกจังหวัด</option>
                {PROVINCES.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
              {errors.province && <span className="bk-error" role="alert">{errors.province}</span>}
            </label>
            <label className="bk-field bk-full">
              ที่อยู่สำหรับเข้าสำรวจ/ติดตั้ง
              <textarea rows="3" value={address} onChange={(event) => setAddress(event.target.value)} placeholder="บ้านเลขที่ ถนน แขวง/ตำบล เขต/อำเภอ รหัสไปรษณีย์" aria-invalid={Boolean(errors.address)} />
              {errors.address && <span className="bk-error" role="alert">{errors.address}</span>}
            </label>
            <label className="bk-field bk-full">
              รายละเอียดเพิ่มเติม (ไม่บังคับ)
              <textarea rows="2" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="เช่น จุดสังเกตบ้าน ชนิดหลังคา หรือเวลาที่ติดต่อได้สะดวก" />
            </label>
          </div>
        </fieldset>

        {formError && (
          <div className="bk-form-error" role="alert">
            <AlertCircle size={18} />
            <span>{formError}</span>
          </div>
        )}

        <div className="bk-actions">
          <p className="bk-summary">
            <Check size={15} /> {selected?.label}
            {date && slotStart ? ` · ${new Date(date).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}
          </p>
          <button className="button button-green" type="submit" disabled={submitting}>
            {submitting ? 'กำลังบันทึกการจอง…' : 'ยืนยันการจอง'} <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
