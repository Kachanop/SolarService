import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CalendarDays, Check, Clock3, MapPin, Phone, RefreshCw, Wrench } from 'lucide-react';
import { getMyAssignments } from '../services/technicianService.js';

const statusLabels = {
  pending: 'รอดำเนินการ',
  assigned: 'มอบหมายแล้ว',
  confirmed: 'ยืนยันแล้ว',
  surveying: 'กำลังสำรวจ',
  quoted: 'เสนอราคาแล้ว',
  approved: 'อนุมัติแล้ว',
  installing: 'กำลังติดตั้ง',
  completed: 'เสร็จสิ้น',
  cancelled: 'ยกเลิก',
};

const statusTones = {
  pending: 'yellow',
  assigned: 'blue',
  confirmed: 'green',
  surveying: 'blue',
  quoted: 'yellow',
  approved: 'green',
  installing: 'blue',
  completed: 'green',
  cancelled: 'gray',
};

const pageCopy = {
  '/technician': { heading: 'งานของคุณ', description: 'ภาพรวมนัดหมายและงานที่ได้รับมอบหมาย' },
  '/schedule': { heading: 'ตารางนัดหมาย', description: 'รายการนัดหมายทั้งหมดที่มอบหมายให้คุณ' },
  '/jobs': { heading: 'งานที่ได้รับมอบหมาย', description: 'งานที่ยังอยู่ระหว่างดำเนินการ' },
  '/work-history': { heading: 'ประวัติงาน', description: 'งานที่เสร็จสิ้นหรือถูกยกเลิกแล้ว' },
  '/job-detail': { heading: 'รายละเอียดงาน', description: 'ข้อมูลการนัดหมายและรายละเอียดงานที่ได้รับมอบหมาย' },
};

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function getTechnicianName(authUser) {
  const name = authUser?.user_metadata?.full_name || authUser?.email?.split('@')[0];
  return name ? name.split(/\s+/)[0] : 'ช่าง';
}

export default function TechnicianDashboard({ route, title, authUser, navigate }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const isDetailPage = route === '/job-detail';
  const selectedBookingId = isDetailPage
    ? new URLSearchParams(window.location.hash.split('?')[1] || '').get('bookingId')
    : null;

  useEffect(() => {
    let active = true;

    async function loadAssignments() {
      setLoading(true);
      setErrorMessage('');

      if (!authUser?.id) {
        if (active) {
          setAssignments([]);
          setLoading(false);
        }
        return;
      }

      try {
        const result = await getMyAssignments();
        if (!active) return;
        setAssignments(result);
      } catch (error) {
        if (active) {
          setAssignments([]);
          setErrorMessage(error instanceof Error ? error.message : 'โหลดรายการงานไม่สำเร็จ');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadAssignments();
    return () => { active = false; };
  }, [authUser?.id, refreshKey]);

  const bookings = useMemo(() => [...assignments].sort((a, b) => new Date(a.preferred_at) - new Date(b.preferred_at)), [assignments]);

  const dashboardBookings = [...bookings].sort((a, b) => new Date(b.assigned_at) - new Date(a.assigned_at));
  const activeBookings = bookings.filter((booking) => !['completed', 'cancelled'].includes(booking.status));
  const historyBookings = bookings.filter((booking) => ['completed', 'cancelled'].includes(booking.status)).reverse();
  const today = new Date();
  const todayCount = activeBookings.filter((booking) => {
    const date = new Date(booking.preferred_at);
    return date.getFullYear() === today.getFullYear()
      && date.getMonth() === today.getMonth()
      && date.getDate() === today.getDate();
  }).length;
  const inProgressCount = bookings.filter((booking) => ['surveying', 'installing'].includes(booking.status)).length;
  const page = pageCopy[route] || pageCopy['/technician'];
  const visibleBookings = route === '/jobs'
    ? activeBookings
    : route === '/work-history'
      ? historyBookings
      : route === '/technician'
        ? dashboardBookings
        : bookings;
  const selectedBooking = bookings.find((booking) => booking.id === selectedBookingId) || null;

  return (
    <div className="workspace-wrap technician-workspace">
      <div className="workspace-heading">
        <div>
          <div className="eyebrow">TECHNICIAN PORTAL</div>
          <h1>{title}</h1>
          <p>สวัสดีคุณ{getTechnicianName(authUser)} · {page.description}</p>
        </div>
        <div className="workspace-heading-actions">
          <span className="today-label"><CalendarDays size={15} /> {today.toLocaleDateString('th-TH', { dateStyle: 'long' })}</span>
          <button className="button button-outline small-button" type="button" onClick={() => setRefreshKey((key) => key + 1)} disabled={loading}>
            <RefreshCw size={14} /> รีเฟรช
          </button>
        </div>
      </div>

      <nav className="technician-tabs" aria-label="เมนูช่าง">
        {[
          ['/technician', 'ภาพรวม'],
          ['/schedule', 'ตารางนัดหมาย'],
          ['/jobs', 'งานของฉัน'],
          ['/work-history', 'ประวัติงาน'],
        ].map(([path, label]) => (
          <button key={path} type="button" className={route === path ? 'active' : ''} onClick={() => navigate(path)}>
            {label}
          </button>
        ))}
      </nav>

      {route === '/technician' && (
        <div className="stats-grid technician-stats">
          <article className="stat-card"><span><CalendarDays /></span><small>นัดหมายวันนี้</small><strong>{loading ? '—' : todayCount}</strong></article>
          <article className="stat-card"><span><Wrench /></span><small>งานที่กำลังดำเนินการ</small><strong>{loading ? '—' : inProgressCount}</strong></article>
          <article className="stat-card"><span><Check /></span><small>งานเสร็จสิ้น</small><strong>{loading ? '—' : bookings.filter((booking) => booking.status === 'completed').length}</strong></article>
        </div>
      )}

      <section className="workspace-content technician-jobs">
        <div className="workspace-section-heading">
          <div>
            <h2>{route === '/technician' ? 'งานที่ได้รับมอบหมายล่าสุด' : page.heading}</h2>
            <p>{route === '/technician' ? 'ตรวจสอบกำหนดการและรายละเอียดงานของคุณ' : page.description}</p>
          </div>
          {route === '/technician' && <button className="button button-outline small-button" type="button" onClick={() => navigate('/jobs')}>ดูงานทั้งหมด</button>}
          {isDetailPage && <button className="button button-outline small-button" type="button" onClick={() => navigate('/jobs')}>กลับไปยังรายการงาน</button>}
        </div>

        {errorMessage && (
          <div className="technician-error" role="alert">
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
            <button type="button" className="button button-outline small-button" onClick={() => setRefreshKey((key) => key + 1)}>ลองอีกครั้ง</button>
          </div>
        )}
        {loading && <p className="technician-message" role="status">กำลังโหลดรายการงาน…</p>}
        {!loading && !errorMessage && isDetailPage && !selectedBooking && (
          <div className="technician-empty">
            <AlertCircle size={26} />
            <strong>ไม่พบงานนี้หรือคุณไม่มีสิทธิ์เข้าถึง</strong>
            <span>แสดงรายละเอียดได้เฉพาะงานที่ได้รับมอบหมายให้บัญชีช่างของคุณ</span>
          </div>
        )}
        {!isDetailPage && !loading && !errorMessage && visibleBookings.length === 0 && (
          <div className="technician-empty">
            <CalendarDays size={26} />
            <strong>{route === '/work-history' ? 'ยังไม่มีประวัติงาน' : 'ยังไม่มีงานที่ได้รับมอบหมาย'}</strong>
            <span>เมื่อมีการมอบหมายงาน รายการจะแสดงที่นี่</span>
          </div>
        )}
        {!isDetailPage && !loading && !errorMessage && visibleBookings.length > 0 && (
          <div className="technician-job-list">
              {visibleBookings.slice(0, route === '/technician' ? 5 : visibleBookings.length).map((booking) => (
                <article className="technician-job-card" key={booking.assignmentId || booking.id}>
                  <div className="technician-job-icon"><Wrench size={18} /></div>
                  <div className="technician-job-main">
                    <div className="technician-job-title">
                      <strong>งาน {booking.booking_number}</strong>
                      <span className={`status-pill ${statusTones[booking.status] || 'gray'}`}>{statusLabels[booking.status] || booking.status}</span>
                    </div>
                    <span className="technician-job-detail"><Clock3 size={14} /> {formatDate(booking.preferred_at)}</span>
                    <span className="technician-job-detail"><MapPin size={14} /> {booking.address} {booking.province}</span>
                    <span className="technician-job-detail"><Phone size={14} /> {booking.phone || 'ไม่มีเบอร์ติดต่อ'}</span>
                    <span className="technician-job-detail"><CalendarDays size={14} /> มอบหมายเมื่อ {formatDate(booking.assigned_at)}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                    <button type="button" className="button button-outline small-button" onClick={() => navigate(`/job-detail?bookingId=${encodeURIComponent(booking.id)}`)}>
                      ดูรายละเอียดงาน
                    </button>
                    {booking.phone && <a className="technician-call" href={`tel:${booking.phone}`} aria-label={`โทรติดต่อลูกค้างาน ${booking.booking_number}`}><Phone size={15} /> โทร</a>}
                  </div>
                </article>
              ))}
          </div>
        )}

        {isDetailPage && !loading && !errorMessage && selectedBooking && (
          <article className="technician-job-card" style={{ display: 'block', padding: '1.25rem' }}>
            <div className="technician-job-title" style={{ marginBottom: '1rem' }}>
              <strong>งาน {selectedBooking.booking_number}</strong>
              <span className={`status-pill ${statusTones[selectedBooking.status] || 'gray'}`}>{statusLabels[selectedBooking.status] || selectedBooking.status}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '1rem' }}>
              <div><small>เลขที่ Booking</small><div><strong>{selectedBooking.booking_number}</strong></div></div>
              <div><small>วันที่นัดหมาย</small><div><strong>{formatDate(selectedBooking.preferred_at)}</strong></div></div>
              <div><small>ที่อยู่ติดตั้ง</small><div><strong>{selectedBooking.address || '—'}</strong></div></div>
              <div><small>จังหวัด</small><div><strong>{selectedBooking.province || '—'}</strong></div></div>
              <div><small>เบอร์โทรศัพท์ลูกค้า</small><div><strong>{selectedBooking.phone || '—'}</strong></div></div>
              <div><small>วันที่ได้รับมอบหมาย</small><div><strong>{formatDate(selectedBooking.assigned_at)}</strong></div></div>
              <div style={{ gridColumn: '1 / -1' }}><small>หมายเหตุ</small><div><strong>{selectedBooking.notes || '—'}</strong></div></div>
            </div>
            {selectedBooking.phone && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <a className="button button-outline small-button" href={`tel:${selectedBooking.phone}`}>
                  <Phone size={15} /> โทรกลับ
                </a>
              </div>
            )}
          </article>
        )}
      </section>
    </div>
  );
}
