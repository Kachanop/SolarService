import React, { useState } from 'react';
import { ArrowRight, ArrowUpRight, CalendarDays, Check, ChevronRight, ClipboardList, Clock3, Download, FileText, Plus, ShoppingBag, Sun, User, Wrench } from 'lucide-react';
import { adminRoutes } from '../lib/routes.js';
import AdminWorkspace from './AdminWorkspace.jsx';
import Booking from '../technician/Booking.jsx';
import TechnicianDashboard from '../technician/TechnicianDashboard.jsx';
import AccountPage from './AccountPage.jsx';

export default function WorkspacePage({ route, title, navigate, setToast, authUser }) {
  const isTechnician = ['/technician', '/schedule', '/jobs', '/survey', '/work-history'].includes(route);
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
    if (isSurvey) return <SurveyForm setToast={setToast} />;
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
function SurveyForm({ setToast }) {
  return <form className="booking-form" onSubmit={(event) => { event.preventDefault(); setToast('บันทึกผลสำรวจและส่งรายงานเรียบร้อยแล้ว'); }}><div className="form-fields"><label>ขนาดพื้นที่หลังคา (ตร.ม.)<input type="number" min="0" required placeholder="เช่น 80" /></label><label>ประเภทหลังคา<select required defaultValue=""><option value="" disabled>เลือกประเภท</option><option>กระเบื้อง</option><option>เมทัลชีท</option><option>คอนกรีต</option><option>อื่น ๆ</option></select></label><label>ทิศทางหลังคา<select required defaultValue=""><option value="" disabled>เลือกทิศทาง</option><option>ทิศเหนือ</option><option>ทิศใต้</option><option>ทิศตะวันออก</option><option>ทิศตะวันตก</option></select></label><label>ระบบที่แนะนำ<select required defaultValue=""><option value="" disabled>เลือกระบบ</option><option>3 kW</option><option>5 kW</option><option>10 kW</option></select></label><label className="full-width">หมายเหตุ / สภาพพื้นที่<textarea rows="3" placeholder="รายละเอียดเพิ่มเติมเกี่ยวกับหน้างาน" /></label><label className="full-width upload-field"><span><Plus size={16} /> เพิ่มรูปภาพจากหน้างาน</span><input type="file" accept="image/*" multiple /></label><button className="button button-green full-width">บันทึกและส่งรายงาน <ArrowRight size={16} /></button></div></form>;
}

function ReviewForm({ setToast }) {
  const [rating, setRating] = useState(5);
  return <form className="form-card review-form" onSubmit={(event) => { event.preventDefault(); setToast(`ส่งรีวิว ${rating} ดาวเรียบร้อยแล้ว ขอบคุณมาก`); }}><h3>งานติดตั้งระบบโซลาร์เซลล์</h3><p>ทีมช่าง SolarService · 20 ตุลาคม 2568</p><div className="star-picker" aria-label="คะแนนรีวิว">{[1, 2, 3, 4, 5].map((value) => <button type="button" className={value <= rating ? 'selected' : ''} key={value} onClick={() => setRating(value)} aria-label={`${value} ดาว`}>★</button>)}</div><label>เล่าประสบการณ์ของคุณ<textarea rows="4" required placeholder="บริการของเราเป็นอย่างไรบ้าง?" /></label><button className="button button-green">ส่งรีวิว <ArrowRight size={16} /></button></form>;
}

