import React, { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, CalendarDays, Check, ChevronRight, ClipboardList, Clock3, Download, FileText, Plus, ShoppingBag, Sun, User, Wrench } from 'lucide-react';
import { supabase } from '../lib/supabase.js';
import { adminRoutes } from '../lib/routes.js';
import AdminWorkspace from './AdminWorkspace.jsx';
import Booking from '../technician/Booking.jsx';
import TechnicianDashboard from '../technician/TechnicianDashboard.jsx';
import AccountPage from './AccountPage.jsx';

export default function WorkspacePage({ route, title, navigate, setToast, authUser }) {
  const isTechnician = ['/technician', '/schedule', '/jobs', '/survey', '/work-history', '/job-detail'].includes(route);
  const isDashboard = ['/customer', '/technician', '/admin'].includes(route);
  const isBooking = route === '/bookings';
  const isSurvey = route === '/survey';
  const isReview = route === '/reviews';
  const isProfile = route === '/profile' || route === '/account';
  if (adminRoutes.has(route)) {
    return <AdminWorkspace route={route} title={title} navigate={navigate} authUser={authUser} setToast={setToast} />;
  }
  if (isTechnician && !isSurvey) {
    return <TechnicianDashboard route={route} title={title} authUser={authUser} navigate={navigate} />;
  }
  if (isProfile) {
    return <AccountPage authUser={authUser} role={isTechnician ? 'Technician' : 'Customer'} navigate={navigate} setToast={setToast} signOut={() => { window.location.hash = '#/'; }} />;
  }
  const bookingRows = [{ name: 'สำรวจพื้นที่ติดตั้ง', date: '12 พ.ย. 2568 · 09:00 น.', status: 'รอยืนยันช่าง', tone: 'yellow' }, { name: 'สำรวจระบบโซลาร์ 5 kW', date: '18 พ.ย. 2568 · 13:30 น.', status: 'ยืนยันแล้ว', tone: 'green' }];
  const genericRows = isTechnician
    ? [{ name: 'สำรวจบ้านคุณสมชาย', date: 'วันนี้ · 09:00 น.', customer: 'สมชาย ใจดี', status: 'รอดำเนินการ', tone: 'yellow' }, { name: 'ติดตั้งระบบ 5 kW', date: 'พรุ่งนี้ · 10:30 น.', customer: 'คุณนภา แสงทอง', status: 'กำลังดำเนินการ', tone: 'blue' }]
    : [{ name: 'สำรวจพื้นที่บ้านของฉัน', date: '18 พ.ย. 2568 · 13:30 น.', customer: 'ทีมช่าง SolarService', status: 'ยืนยันแล้ว', tone: 'green' }, { name: 'ติดตั้งระบบโซลาร์ 5 kW', date: 'รออนุมัติใบเสนอราคา', customer: 'SolarService', status: 'รอดำเนินการ', tone: 'yellow' }];
  const actions = isTechnician
      ? [{ label: 'ดูตารางนัดหมาย', icon: <CalendarDays />, path: '/schedule' }, { label: 'งานที่ได้รับมอบหมาย', icon: <ClipboardList />, path: '/jobs' }, { label: 'บันทึกผลสำรวจ', icon: <FileText />, path: '/survey' }, { label: 'ประวัติงาน', icon: <Clock3 />, path: '/work-history' }]
      : [{ label: 'จองช่างสำรวจ', icon: <CalendarDays />, path: '/bookings' }, { label: 'เลือกแพ็กเกจ', icon: <Sun />, path: '/packages' }, { label: 'ดูใบเสนอราคา', icon: <FileText />, path: '/quotes' }, { label: 'ติดตามงาน', icon: <Wrench />, path: '/tracking' }];
  function pageAction() {
    if (isBooking) return <Booking user={authUser} navigate={navigate} setToast={setToast} />;
    if (isSurvey) return <SurveyForm authUser={authUser} setToast={setToast} />;
    if (isReview) return <ReviewForm setToast={setToast} />;
    if (route === '/quotes') return <div className="workspace-table"><div className="table-head"><span>รายการ</span><span>วันที่</span><span>สถานะ</span><span>ดำเนินการ</span></div><div className="table-row"><span className="row-icon"><FileText /></span><div className="row-main"><strong>ใบเสนอราคา #QT-085</strong><small>ระบบโซลาร์เซลล์ 5 kW</small></div><span>10 พ.ย. 2568</span><span className="status-pill yellow">รอยืนยัน</span><button className="icon-action" onClick={() => setToast('เปิดใบเสนอราคา #QT-085')} aria-label="ดูใบเสนอราคา"><ArrowUpRight size={16} /></button></div></div>;
    if (route === '/reviews') return <div className="review-callout"><span>★★★★★</span><h3>แชร์ประสบการณ์กับเรา</h3><p>งานติดตั้งของคุณเสร็จเรียบร้อยแล้วหรือยัง? รีวิวของคุณช่วยให้เราพัฒนาบริการให้ดียิ่งขึ้น</p><button className="button button-green" onClick={() => setToast('บันทึกรีวิวเรียบร้อยแล้ว ขอบคุณสำหรับความคิดเห็น')}>เขียนรีวิว <ArrowRight size={16} /></button></div>;
    if (route === '/bookings' || route === '/schedule' || route === '/jobs' || route === '/work-history') return <div className="workspace-table">{(isBooking ? bookingRows : genericRows).map((row) => <div className="table-row" key={row.name}><span className="row-icon">{isTechnician ? <Wrench /> : <CalendarDays />}</span><div className="row-main"><strong>{row.name}</strong><small>{row.date}{row.customer ? ` · ${row.customer}` : ''}</small></div><span className={`status-pill ${row.tone}`}>{row.status}</span><button className="icon-action" onClick={() => navigate(isTechnician ? '/survey' : '/tracking')} aria-label={`ดูรายละเอียด ${row.name}`}><ArrowUpRight size={16} /></button></div>)}</div>;
    if (isDashboard) return <><div className="stats-grid">{(isTechnician ? [['นัดหมายวันนี้', '3', <CalendarDays />], ['งานที่กำลังทำ', '2', <Wrench />], ['สำรวจเสร็จแล้ว', '18', <Check />]] : [['คำสั่งซื้อ', '2', <ShoppingBag />], ['การจองช่าง', '1', <CalendarDays />], ['ใบเสนอราคา', '1', <FileText />]]).map(([label, value, icon]) => <div className="stat-card" key={label}><span>{icon}</span><small>{label}</small><strong>{value}</strong></div>)}</div><div className="quick-actions">{actions.map((action) => <button key={action.label} onClick={() => navigate(action.path)}><span>{action.icon}</span><strong>{action.label}</strong><ChevronRight size={17} /></button>)}</div></>;
    return <div className="workspace-table"><div className="table-row"><span className="row-icon"><FileText /></span><div className="row-main"><strong>กิจกรรมล่าสุด</strong><small>ข้อมูลจะปรากฏเมื่อมีรายการใหม่</small></div><span className="status-pill green">อัปเดตแล้ว</span></div></div>;
  }
  const userGreetingName = authUser?.user_metadata?.full_name || authUser?.email?.split('@')[0] || (isTechnician ? 'ช่าง' : 'คุณลูกค้า');

  return <div className="workspace-wrap">
    <div className="workspace-heading"><div><div className="eyebrow">{isTechnician ? 'TECHNICIAN PORTAL' : 'MY SOLARSERVICE'}</div><h1>{title}</h1><p>{isTechnician ? 'จัดการงานสำรวจและติดตั้งของคุณได้ที่นี่' : 'จัดการการสั่งซื้อ การจอง และบริการของคุณได้ในที่เดียว'}</p></div><div className="workspace-heading-actions"><span className="today-label"><CalendarDays size={15} /> {new Date().toLocaleDateString('th-TH', { dateStyle: 'long' })}</span></div></div>
    {isDashboard && <div className="welcome-strip"><span><Sun size={19} /></span><p>สวัสดี, คุณ{userGreetingName} <small>{isTechnician ? 'มี 2 งานที่ต้องดำเนินการในวันนี้' : 'พร้อมเปลี่ยนบ้านให้เป็นพลังงานสะอาดหรือยัง?'}</small></p><ArrowRight size={18} /></div>}
    <div className="workspace-content"><div className="workspace-section-heading"><div><h2>{isDashboard ? 'รายการล่าสุด' : isBooking ? 'จองช่างเข้าสำรวจพื้นที่' : isSurvey ? 'บันทึกรายงานผลสำรวจ' : title}</h2><p>{isDashboard ? 'ติดตามความเคลื่อนไหวและเข้าถึงเมนูที่ใช้บ่อย' : 'ตรวจสอบรายละเอียดและจัดการข้อมูลของคุณ'}</p></div>{!isDashboard && <button className="button button-outline small-button" onClick={() => setToast('ดาวน์โหลดรายงานเรียบร้อยแล้ว')}><Download size={15} /> ส่งออก</button>}</div>{pageAction()}</div>
  </div>;
}
function SurveyForm({ authUser, setToast }) {
  const [bookings, setBookings] = useState([]);
  const [bookingId, setBookingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    roof_area_sqm: '',
    roof_type: '',
    roof_direction: '',
    recommended_system_kw: '',
    notes: '',
  });

  useEffect(() => {
    let active = true;

    async function loadTechnicianBookings() {
      if (!authUser?.id || !supabase) {
        if (active) {
          setBookings([]);
          setLoading(false);
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .from('technician_assignments')
          .select('id,booking_id,assigned_at,service_bookings!inner(id,booking_number,status,preferred_at,address,province,phone)')
          .eq('technician_id', authUser.id)
          .order('assigned_at', { ascending: false });

        if (error) throw error;

        const assigned = (data || [])
          .map((assignment) => {
            const booking = assignment.service_bookings;
            return Array.isArray(booking) ? booking[0] : booking;
          })
          .filter(Boolean);

        if (active) {
          setBookings(assigned);
          if (!bookingId && assigned[0]?.id) setBookingId(assigned[0].id);
        }
      } catch (error) {
        if (active) {
          setBookings([]);
          setFormError(error instanceof Error ? error.message : 'โหลดงานที่ได้รับมอบหมายไม่สำเร็จ');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadTechnicianBookings();
    return () => { active = false; };
  }, [authUser?.id, bookingId]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!authUser?.id || !supabase) {
      setFormError('กรุณาเข้าสู่ระบบด้วยบัญชีช่างก่อนบันทึกผลสำรวจ');
      return;
    }
    if (!bookingId) {
      setFormError('กรุณาเลือกงานที่ต้องทำสำรวจก่อนบันทึก');
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('technician_assignments')
        .select('id')
        .eq('booking_id', bookingId)
        .eq('technician_id', authUser.id)
        .maybeSingle();

      if (assignmentError) throw assignmentError;
      if (!assignmentData) throw new Error('คุณไม่มีสิทธิ์บันทึกผลสำรวจสำหรับงานนี้');

      const payload = {
        booking_id: bookingId,
        technician_id: authUser.id,
        roof_area_sqm: form.roof_area_sqm ? Number(form.roof_area_sqm) : null,
        roof_type: form.roof_type || null,
        roof_direction: form.roof_direction || null,
        recommended_system_kw: form.recommended_system_kw ? Number(form.recommended_system_kw) : null,
        notes: form.notes.trim(),
        status: 'draft',
        submitted_at: null,
      };

      const { error } = await supabase
        .from('site_surveys')
        .upsert(payload, { onConflict: 'booking_id' })
        .select();

      if (error) throw error;
      setToast('บันทึกผลสำรวจเรียบร้อยแล้ว');
      setForm({
        roof_area_sqm: '',
        roof_type: '',
        roof_direction: '',
        recommended_system_kw: '',
        notes: '',
      });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'บันทึกผลสำรวจไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="booking-form" onSubmit={handleSubmit}>
      <div className="form-fields">
        <label>
          งานที่ทำสำรวจ
          <select value={bookingId} onChange={(event) => setBookingId(event.target.value)} required disabled={loading || bookings.length === 0}>
            <option value="">เลือกงานที่ได้รับมอบหมาย</option>
            {bookings.map((booking) => (
              <option key={booking.id} value={booking.id}>
                {booking.booking_number} · {booking.province}
              </option>
            ))}
          </select>
        </label>
        <label>ขนาดพื้นที่หลังคา (ตร.ม.)
          <input type="number" min="0" step="0.1" value={form.roof_area_sqm} onChange={(event) => setForm({ ...form, roof_area_sqm: event.target.value })} placeholder="เช่น 80" />
        </label>
        <label>ประเภทหลังคา
          <select value={form.roof_type} onChange={(event) => setForm({ ...form, roof_type: event.target.value })}>
            <option value="">เลือกประเภท</option>
            <option value="กระเบื้อง">กระเบื้อง</option>
            <option value="เมทัลชีท">เมทัลชีท</option>
            <option value="คอนกรีต">คอนกรีต</option>
            <option value="อื่น ๆ">อื่น ๆ</option>
          </select>
        </label>
        <label>ทิศทางหลังคา
          <select value={form.roof_direction} onChange={(event) => setForm({ ...form, roof_direction: event.target.value })}>
            <option value="">เลือกทิศทาง</option>
            <option value="ทิศเหนือ">ทิศเหนือ</option>
            <option value="ทิศใต้">ทิศใต้</option>
            <option value="ทิศตะวันออก">ทิศตะวันออก</option>
            <option value="ทิศตะวันตก">ทิศตะวันตก</option>
          </select>
        </label>
        <label>ระบบที่แนะนำ (kW)
          <select value={form.recommended_system_kw} onChange={(event) => setForm({ ...form, recommended_system_kw: event.target.value })}>
            <option value="">เลือกระบบ</option>
            <option value="3">3 kW</option>
            <option value="5">5 kW</option>
            <option value="10">10 kW</option>
          </select>
        </label>
        <label className="full-width">หมายเหตุ / สภาพพื้นที่
          <textarea rows="3" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="รายละเอียดเพิ่มเติมเกี่ยวกับหน้างาน" />
        </label>
        <label className="full-width upload-field">
          <span><Plus size={16} /> แนบรูปภาพหน้างาน</span>
          <input type="file" accept="image/*" multiple disabled />
        </label>
        <small className="bk-hint">การอัปโหลดรูปภาพต้องใช้ Supabase Storage Bucket ที่ถูกตั้งค่าในระบบก่อน จึงยังไม่เปิดใช้งานในเวอร์ชันนี้</small>
        {formError && <p className="bk-error" role="alert">{formError}</p>}
        <button className="button button-green full-width" type="submit" disabled={saving || loading || bookings.length === 0}>
          {saving ? 'กำลังบันทึก…' : 'บันทึกและส่งรายงาน'} <ArrowRight size={16} />
        </button>
      </div>
    </form>
  );
}

function ReviewForm({ setToast }) {
  const [rating, setRating] = useState(5);
  return <form className="form-card review-form" onSubmit={(event) => { event.preventDefault(); setToast(`ส่งรีวิว ${rating} ดาวเรียบร้อยแล้ว ขอบคุณมาก`); }}><h3>งานติดตั้งระบบโซลาร์เซลล์</h3><p>ทีมช่าง SolarService · 20 ตุลาคม 2568</p><div className="star-picker" aria-label="คะแนนรีวิว">{[1, 2, 3, 4, 5].map((value) => <button type="button" className={value <= rating ? 'selected' : ''} key={value} onClick={() => setRating(value)} aria-label={`${value} ดาว`}>★</button>)}</div><label>เล่าประสบการณ์ของคุณ<textarea rows="4" required placeholder="บริการของเราเป็นอย่างไรบ้าง?" /></label><button className="button button-green">ส่งรีวิว <ArrowRight size={16} /></button></form>;
}
