import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CalendarDays, Check, Clock3, MapPin, Phone, RefreshCw, Wrench } from 'lucide-react';
import { supabase, supabaseConfigError } from '../lib/supabase.js';

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
};

function getBooking(assignment) {
  const booking = assignment.service_bookings;
  return Array.isArray(booking) ? booking[0] : booking;
}

function formatDate(value) {
  return new Date(value).toLocaleString('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function getTechnicianName(authUser) {
  const name = authUser?.user_metadata?.full_name || authUser?.email?.split('@')[0];
  return name ? name.split(/\s+/)[0] : 'ช่าง';
}

export default function TechnicianWorkspace({ route, title, authUser, navigate }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadAssignments() {
      setLoading(true);
      setErrorMessage('');
      if (!supabase) {
        setAssignments([]);
        setErrorMessage(supabaseConfigError || 'ไม่สามารถเชื่อมต่อ Supabase ได้');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('technician_assignments')
          .select('id,assigned_at,service_bookings!inner(id,booking_number,status,preferred_at,address,province,phone)')
          .eq('technician_id', authUser.id);
        if (error) throw error;
        if (active) setAssignments((data || []).filter((item) => getBooking(item)));
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
  }, [authUser.id, refreshKey]);

  const bookings = useMemo(() => assignments
    .map((assignment) => ({ ...getBooking(assignment), assignmentId: assignment.id, assigned_at: assignment.assigned_at }))
    .sort((a, b) => new Date(a.preferred_at) - new Date(b.preferred_at)), [assignments]);

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
          <div><h2>{route === '/technician' ? 'งานที่ได้รับมอบหมายล่าสุด' : page.heading}</h2><p>{route === '/technician' ? 'ตรวจสอบกำหนดการและรายละเอียดงานของคุณ' : page.description}</p></div>
          {route === '/technician' && <button className="button button-outline small-button" type="button" onClick={() => navigate('/jobs')}>ดูงานทั้งหมด</button>}
        </div>

        {errorMessage && (
          <div className="technician-error" role="alert">
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
            <button type="button" className="button button-outline small-button" onClick={() => setRefreshKey((key) => key + 1)}>ลองอีกครั้ง</button>
          </div>
        )}
        {loading && <p className="technician-message" role="status">กำลังโหลดรายการงาน…</p>}
        {!loading && !errorMessage && visibleBookings.length === 0 && (
          <div className="technician-empty">
            <CalendarDays size={26} />
            <strong>{route === '/work-history' ? 'ยังไม่มีประวัติงาน' : 'ยังไม่มีงานที่ได้รับมอบหมาย'}</strong>
            <span>เมื่อมีการมอบหมายงาน รายการจะแสดงที่นี่</span>
          </div>
        )}
        {!loading && !errorMessage && visibleBookings.length > 0 && (
          <div className="technician-job-list">
            {visibleBookings.slice(0, route === '/technician' ? 5 : visibleBookings.length).map((booking) => (
              <article className="technician-job-card" key={booking.assignmentId}>
                <div className="technician-job-icon"><Wrench size={18} /></div>
                <div className="technician-job-main">
                  <div className="technician-job-title">
                    <strong>งาน {booking.booking_number}</strong>
                    <span className={`status-pill ${statusTones[booking.status] || 'gray'}`}>{statusLabels[booking.status] || booking.status}</span>
                  </div>
                  <span className="technician-job-detail"><Clock3 size={14} /> {formatDate(booking.preferred_at)}</span>
                  <span className="technician-job-detail"><MapPin size={14} /> {booking.address} {booking.province}</span>
                </div>
                {booking.phone && <a className="technician-call" href={`tel:${booking.phone}`} aria-label={`โทรติดต่อลูกค้างาน ${booking.booking_number}`}><Phone size={15} /> โทร</a>}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
