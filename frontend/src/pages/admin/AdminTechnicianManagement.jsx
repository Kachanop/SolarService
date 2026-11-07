import React, { useMemo, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  MapPin,
  Phone,
  Search,
  UsersRound,
  Wrench,
} from 'lucide-react';

const statusInfo = {
  pending: { label: 'รอมอบหมายช่าง', tone: 'yellow' },
  assigned: { label: 'มอบหมายช่างแล้ว', tone: 'blue' },
  confirmed: { label: 'ยืนยันนัดหมาย', tone: 'green' },
  surveying: { label: 'กำลังสำรวจ', tone: 'blue' },
  quoted: { label: 'สำรวจเสร็จแล้ว', tone: 'green' },
  approved: { label: 'อนุมัติงาน', tone: 'green' },
  installing: { label: 'กำลังติดตั้ง', tone: 'blue' },
  completed: { label: 'เสร็จสิ้น', tone: 'green' },
  cancelled: { label: 'ยกเลิก', tone: 'gray' },
};

function formatAppointment(value) {
  if (!value) return 'ไม่ระบุวันนัด';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'ไม่ระบุวันนัด';
  return date.toLocaleString('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function AdminTechnicianManagement({
  technicians = [],
  bookings = [],
  onAssignTechnician,
  setToast,
  navigate,
}) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterProvince, setFilterProvince] = useState('');
  const [selectedTechnicians, setSelectedTechnicians] = useState({});
  const [assigningBookingId, setAssigningBookingId] = useState(null);

  const provinces = useMemo(
    () => [...new Set(bookings.map((booking) => booking.province).filter(Boolean))].sort(),
    [bookings],
  );
  const filteredBookings = useMemo(() => bookings.filter((booking) => {
    const searchText = [
      booking.booking_number,
      booking.customer_name,
      booking.phone,
      booking.address,
      booking.province,
      ...(booking.technician_names || []),
    ].join(' ').toLowerCase();
    return (!search || searchText.includes(search.toLowerCase()))
      && (!filterStatus || booking.status === filterStatus)
      && (!filterProvince || booking.province === filterProvince);
  }), [bookings, search, filterStatus, filterProvince]);

  const assignedCount = bookings.filter((booking) => (booking.technician_ids || []).length > 0).length;
  const pendingCount = bookings.filter((booking) => ['pending', 'assigned'].includes(booking.status)).length;
  const activeCount = bookings.filter((booking) => ['confirmed', 'surveying', 'installing'].includes(booking.status)).length;
  const completedCount = bookings.filter((booking) => ['quoted', 'approved', 'completed'].includes(booking.status)).length;

  async function assignTechnician(booking) {
    const technicianId = selectedTechnicians[booking.id];
    if (!technicianId) {
      setToast?.('กรุณาเลือกช่างก่อนมอบหมายงาน');
      return;
    }

    setAssigningBookingId(booking.id);
    try {
      await onAssignTechnician(booking.id, technicianId);
      setSelectedTechnicians((current) => {
        const next = { ...current };
        delete next[booking.id];
        return next;
      });
      setToast?.(`มอบหมายงาน ${booking.booking_number || ''} เรียบร้อยแล้ว`);
    } catch (error) {
      setToast?.(`มอบหมายช่างไม่สำเร็จ: ${error instanceof Error ? error.message : 'เกิดข้อผิดพลาด'}`);
    } finally {
      setAssigningBookingId(null);
    }
  }

  return (
    <div className="admin-technician-management">
      <div className="stats-grid">
        <div className="stat-card">
          <span><UsersRound size={16} /></span>
          <small>ทีมช่างในระบบ</small>
          <strong>{technicians.length} คน</strong>
          <em className="technician-stat-caption">บัญชีช่างที่พร้อมรับงาน</em>
        </div>
        <div className="stat-card">
          <span><ClipboardList size={16} /></span>
          <small>คิวรอมอบหมาย</small>
          <strong>{pendingCount} งาน</strong>
          <em className="technician-stat-caption">รายการสำรวจที่ยังไม่เสร็จ</em>
        </div>
        <div className="stat-card">
          <span><Wrench size={16} /></span>
          <small>มีช่างรับผิดชอบแล้ว</small>
          <strong>{assignedCount} งาน</strong>
          <em className="technician-stat-caption">คิวที่มีช่างได้รับมอบหมาย</em>
        </div>
        <div className="stat-card">
          <span><CheckCircle2 size={16} /></span>
          <small>สำรวจ/ดำเนินงานแล้ว</small>
          <strong>{completedCount} งาน</strong>
          <em className="technician-stat-caption">สำรวจเสร็จหรือปิดงานแล้ว</em>
        </div>
      </div>

      <section className="technician-team-section">
        <div className="workspace-section-heading">
          <div>
            <h2>ทีมช่าง</h2>
            <p>ดูข้อมูลติดต่อและจำนวนคิวงานที่ได้รับมอบหมาย</p>
          </div>
          <button type="button" className="button button-outline small-button" onClick={() => navigate('/manage-users')}>
            จัดการบัญชีช่าง
          </button>
        </div>
        {technicians.length ? (
          <div className="technician-team-grid">
            {technicians.map((technician) => {
              const workload = bookings.filter((booking) => (booking.technician_ids || []).includes(technician.id)).length;
              return (
                <article className="technician-team-card" key={technician.id}>
                  <div className="technician-avatar">{(technician.full_name || 'ช').charAt(0)}</div>
                  <div className="technician-card-info">
                    <strong>{technician.full_name || 'ไม่ระบุชื่อช่าง'}</strong>
                    <small>ช่างเทคนิค</small>
                  </div>
                  <span className="technician-workload">{workload} คิว</span>
                  {technician.phone ? (
                    <a className="technician-phone" href={`tel:${technician.phone}`}>
                      <Phone size={13} /> {technician.phone}
                    </a>
                  ) : (
                    <span className="technician-phone unavailable">ยังไม่มีเบอร์โทร</span>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="technician-empty">ยังไม่มีบัญชีช่างในระบบ สามารถกำหนดสิทธิ์ช่างได้จาก CRM & ผู้ใช้</div>
        )}
      </section>

      <section className="technician-survey-section">
        <div className="workspace-section-heading">
          <div>
            <h2>คิวสำรวจพื้นที่และงานบริการ</h2>
            <p>ค้นหาคิว ตรวจสอบพื้นที่นัดหมาย และมอบหมายช่างรับผิดชอบ</p>
          </div>
          <button type="button" className="button button-outline small-button" onClick={() => navigate('/manage-bookings')}>
            <CalendarDays size={14} /> จัดการการจอง
          </button>
        </div>

        <div className="admin-toolbar">
          <div className="admin-toolbar-left">
            <label className="admin-search-box">
              <Search size={14} color="#788775" />
              <input
                type="search"
                placeholder="ค้นหาเลขจอง ลูกค้า เบอร์โทร หรือพื้นที่..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <select className="admin-filter-select" value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)}>
              <option value="">ทุกสถานะงาน</option>
              {Object.entries(statusInfo).map(([status, info]) => (
                <option key={status} value={status}>{info.label}</option>
              ))}
            </select>
            <select className="admin-filter-select" value={filterProvince} onChange={(event) => setFilterProvince(event.target.value)}>
              <option value="">ทุกพื้นที่</option>
              {provinces.map((province) => <option key={province} value={province}>{province}</option>)}
            </select>
          </div>
          <div className="technician-active-summary">
            <MapPin size={14} /> กำลังดำเนินงาน {activeCount} คิว
          </div>
        </div>

        <div className="admin-table technician-bookings-table">
          <div className="admin-table-head">
            <span>คิว / วันนัด</span>
            <span>ลูกค้า</span>
            <span>พื้นที่สำรวจ</span>
            <span>สถานะ</span>
            <span>ช่างผู้รับผิดชอบ</span>
            <span>มอบหมายช่าง</span>
          </div>
          {filteredBookings.length ? filteredBookings.map((booking) => {
            const assignedIds = booking.technician_ids || [];
            const availableTechnicians = technicians.filter((technician) => !assignedIds.includes(technician.id));
            const status = statusInfo[booking.status] || { label: booking.status || 'ไม่ระบุสถานะ', tone: 'gray' };
            const canAssign = !['completed', 'cancelled'].includes(booking.status) && availableTechnicians.length > 0;
            return (
              <div className="admin-table-row" key={booking.id}>
                <div>
                  <strong>{booking.booking_number || 'ไม่ระบุเลขที่คิว'}</strong>
                  <small>{formatAppointment(booking.preferred_at)}</small>
                </div>
                <div>
                  <strong>{booking.customer_name || 'ลูกค้าทั่วไป'}</strong>
                  <small>{booking.phone || 'ไม่ระบุเบอร์โทร'}</small>
                </div>
                <div className="technician-location">
                  <strong>{booking.province || 'ไม่ระบุพื้นที่'}</strong>
                  <small>{booking.address || 'ไม่มีรายละเอียดที่อยู่'}</small>
                </div>
                <div><span className={`status-pill ${status.tone}`}>{status.label}</span></div>
                <div className="technician-assignees">
                  {(booking.technician_names || []).length
                    ? booking.technician_names.join(', ')
                    : <span className="technician-unassigned">ยังไม่มีช่างรับงาน</span>}
                </div>
                <div className="technician-assign-control">
                  {canAssign ? (
                    <>
                      <select
                        aria-label={`เลือกช่างสำหรับคิว ${booking.booking_number || ''}`}
                        value={selectedTechnicians[booking.id] || ''}
                        onChange={(event) => setSelectedTechnicians((current) => ({ ...current, [booking.id]: event.target.value }))}
                      >
                        <option value="">เลือกช่าง</option>
                        {availableTechnicians.map((technician) => (
                          <option key={technician.id} value={technician.id}>{technician.full_name || 'ไม่ระบุชื่อ'}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="button button-green small-button"
                        disabled={!selectedTechnicians[booking.id] || assigningBookingId === booking.id}
                        onClick={() => assignTechnician(booking)}
                      >
                        {assigningBookingId === booking.id ? 'กำลังบันทึก...' : 'มอบหมาย'}
                      </button>
                    </>
                  ) : (
                    <span className="technician-assign-unavailable">
                      {['completed', 'cancelled'].includes(booking.status) ? 'ปิดงานแล้ว' : 'ไม่มีช่างว่าง'}
                    </span>
                  )}
                </div>
              </div>
            );
          }) : (
            <div className="technician-no-bookings">
              {bookings.length ? 'ไม่พบคิวที่ตรงกับตัวกรอง' : 'ยังไม่มีคิวสำรวจหรือบริการในระบบ'}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
