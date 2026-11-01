import React, { useState, useMemo } from 'react';
import {
  CalendarDays,
  Search,
  Filter,
  Download,
  Plus,
  UserCheck,
  MapPin,
  Clock,
  Phone,
  Eye,
  CheckCircle,
  AlertCircle,
  FileText,
  Wrench,
} from 'lucide-react';

const statusLabels = {
  pending: { label: 'รอดำเนินการ', tone: 'yellow' },
  assigned: { label: 'มอบหมายช่างแล้ว', tone: 'blue' },
  confirmed: { label: 'ยืนยันวันนัดแล้ว', tone: 'green' },
  surveying: { label: 'กำลังสำรวจหน้างาน', tone: 'blue' },
  quoted: { label: 'เสนอราคาแล้ว', tone: 'yellow' },
  approved: { label: 'อนุมัติงานติดตั้ง', tone: 'green' },
  installing: { label: 'กำลังติดตั้ง', tone: 'blue' },
  completed: { label: 'เสร็จสิ้นสมบูรณ์', tone: 'green' },
  cancelled: { label: 'ยกเลิกการจอง', tone: 'gray' },
};

const statusOptions = ['pending', 'assigned', 'confirmed', 'surveying', 'quoted', 'approved', 'installing', 'completed', 'cancelled'];
const provinces = ['กรุงเทพมหานคร', 'นนทบุรี', 'ปทุมธานี', 'สมุทรปราการ', 'ชลบุรี', 'เชียงใหม่', 'ขอนแก่น', 'ภูเก็ต'];

export default function AdminBookings({
  bookings,
  technicians,
  onUpdateStatus,
  onAssignTechnician,
  onSaveBooking,
  navigate,
  setToast,
}) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterProvince, setFilterProvince] = useState('');
  const [detailModal, setDetailModal] = useState(null);
  const [createModal, setCreateModal] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [form, setForm] = useState({
    customer_name: '',
    phone: '',
    province: 'กรุงเทพมหานคร',
    address: '',
    preferred_at: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().slice(0, 16),
    service_type: 'survey',
    notes: '',
  });

  const filtered = useMemo(() => {
    return (bookings || []).filter((b) => {
      const matchSearch =
        !search ||
        `${b.booking_number} ${b.customer_name || ''} ${b.phone || ''} ${b.province || ''} ${b.address || ''}`
          .toLowerCase()
          .includes(search.toLowerCase());
      const matchStatus = !filterStatus || b.status === filterStatus;
      const matchProv = !filterProvince || b.province === filterProvince;
      return matchSearch && matchStatus && matchProv;
    });
  }, [bookings, search, filterStatus, filterProvince]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  function handleCreateSubmit(e) {
    e.preventDefault();
    if (!form.customer_name || !form.phone || !form.address) {
      alert('กรุณากรอกข้อมูลชื่อลูกค้า เบอร์โทร และที่อยู่');
      return;
    }
    onSaveBooking(form);
    setCreateModal(false);
    setForm({
      customer_name: '',
      phone: '',
      province: 'กรุงเทพมหานคร',
      address: '',
      preferred_at: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().slice(0, 16),
      service_type: 'survey',
      notes: '',
    });
    if (setToast) setToast('เปิดคิวจองช่างสำรวจใหม่เรียบร้อยแล้ว');
  }

  function exportCSV() {
    const headers = ['เลขที่การจอง', 'ชื่อลูกค้า', 'เบอร์โทร', 'จังหวัด', 'ที่อยู่นัดหมาย', 'วันเวลานัด', 'สถานะ', 'ช่างผู้รับผิดชอบ', 'หมายเหตุ'];
    const rows = filtered.map((b) => [
      `"${b.booking_number}"`,
      `"${b.customer_name || ''}"`,
      `"${b.phone || ''}"`,
      `"${b.province || ''}"`,
      `"${b.address || ''}"`,
      `"${new Date(b.preferred_at).toLocaleString('th-TH')}"`,
      `"${statusLabels[b.status]?.label || b.status}"`,
      `"${(b.technician_names || []).join(', ')}"`,
      `"${b.notes || ''}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SolarService_Bookings_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="admin-bookings-view">
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <span style={{ background: '#eaf4e6', color: '#447233' }}><CalendarDays size={16} /></span>
          <small>การจองสำรวจทั้งหมด</small>
          <strong>{(bookings || []).length} รายการ</strong>
          <span style={{ fontSize: '9px', color: '#687766' }}>ระบบนัดหมาย</span>
        </div>
        <div className="stat-card">
          <span style={{ background: '#fff5e6', color: '#b5791a' }}><Clock size={16} /></span>
          <small>รอมอบหมายช่าง / ยืนยัน</small>
          <strong>
            {(bookings || []).filter((b) => ['pending', 'assigned'].includes(b.status)).length} คิว
          </strong>
          <span style={{ fontSize: '9px', color: '#b5791a' }}>ต้องจัดคิวช่าง</span>
        </div>
        <div className="stat-card">
          <span style={{ background: '#eaf1f8', color: '#33628e' }}><UserCheck size={16} /></span>
          <small>ช่างพร้อมให้บริการ</small>
          <strong>{(technicians || []).length} คน</strong>
          <span style={{ fontSize: '9px', color: '#587b45' }}>ทีมผู้เชี่ยวชาญ</span>
        </div>
        <div className="stat-card">
          <span style={{ background: '#f5ebfa', color: '#6a3692' }}><CheckCircle size={16} /></span>
          <small>สำรวจและติดตั้งสำเร็จ</small>
          <strong>{(bookings || []).filter((b) => ['quoted', 'approved', 'completed'].includes(b.status)).length} รายการ</strong>
          <span style={{ fontSize: '9px', color: '#587b45' }}>มีผลตอบรับ</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="admin-toolbar" style={{ marginTop: '16px' }}>
        <div className="admin-toolbar-left">
          <div className="admin-search-box">
            <Search size={14} color="#788775" />
            <input
              type="text"
              placeholder="ค้นหาเลขที่จอง, ชื่อลูกค้า, เบอร์โทร, ที่อยู่..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <select
            className="admin-filter-select"
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">ทุกสถานะการจอง</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>{statusLabels[s]?.label || s}</option>
            ))}
          </select>

          <select
            className="admin-filter-select"
            value={filterProvince}
            onChange={(e) => {
              setFilterProvince(e.target.value);
              setPage(1);
            }}
          >
            <option value="">ทุกจังหวัด</option>
            {provinces.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div className="admin-toolbar-right">
          <button
            type="button"
            className="button button-outline small-button"
            onClick={exportCSV}
          >
            <Download size={14} /> ส่งออก CSV
          </button>
          <button
            type="button"
            className="button button-dark small-button"
            onClick={() => setCreateModal(true)}
          >
            <Plus size={14} /> เปิดคิวจองใหม่ (โทรศัพท์/หน้าร้าน)
          </button>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="admin-table">
        <div
          className="admin-table-head"
          style={{ gridTemplateColumns: 'minmax(140px, 1.2fr) minmax(130px, 1.1fr) minmax(130px, 1.1fr) minmax(130px, 1fr) minmax(130px, 1.1fr) minmax(100px, 0.8fr)' }}
        >
          <span>เลขที่จอง / วันที่สร้าง</span>
          <span>ลูกค้า & เบอร์โทร</span>
          <span>จังหวัด & วันนัดหมาย</span>
          <span>สถานะงาน</span>
          <span>มอบหมายช่าง</span>
          <span>การจัดการ</span>
        </div>

        {paginated.length ? (
          paginated.map((booking) => (
            <div
              key={booking.id}
              className="admin-table-row"
              style={{ gridTemplateColumns: 'minmax(140px, 1.2fr) minmax(130px, 1.1fr) minmax(130px, 1.1fr) minmax(130px, 1fr) minmax(130px, 1.1fr) minmax(100px, 0.8fr)' }}
            >
              <div>
                <strong>{booking.booking_number}</strong>
                <small style={{ color: '#7c8b7a', fontSize: '10px' }}>
                  {new Date(booking.created_at).toLocaleDateString('th-TH')}
                </small>
              </div>

              <div>
                <strong>{booking.customer_name || 'ลูกค้าทั่วไป'}</strong>
                <small style={{ color: '#587b45', fontSize: '10px' }}>
                  {booking.phone || '—'}
                </small>
              </div>

              <div>
                <span>{booking.province}</span>
                <small style={{ color: '#274b1c', fontWeight: '600', fontSize: '10px', display: 'block' }}>
                  {new Date(booking.preferred_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
                </small>
              </div>

              <div>
                <select
                  className="admin-select"
                  value={booking.status}
                  onChange={(e) => onUpdateStatus(booking.id, e.target.value)}
                  style={{ fontSize: '9px', padding: '5px 7px' }}
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>{statusLabels[s]?.label || s}</option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  className="admin-select"
                  value=""
                  onChange={(e) => {
                    const tech = (technicians || []).find((t) => t.id === e.target.value);
                    if (tech) onAssignTechnician(booking.id, tech.id, tech.full_name);
                  }}
                  style={{ fontSize: '9px', padding: '5px 7px' }}
                >
                  <option value="">
                    {booking.technician_names?.length ? `ช่าง: ${booking.technician_names[0]}` : '+ มอบหมายช่าง…'}
                  </option>
                  {(technicians || []).map((t) => (
                    <option key={t.id} value={t.id}>{t.full_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <button
                  type="button"
                  className="button button-outline small-button"
                  onClick={() => setDetailModal(booking)}
                >
                  <Eye size={12} /> รายละเอียด
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="admin-empty">ไม่พบข้อมูลการจองที่ตรงกับเงื่อนไข</p>
        )}
      </div>

      {/* Pagination */}
      {filtered.length > pageSize && (
        <div className="admin-pagination">
          <span>
            แสดง {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, filtered.length)} จากทั้งหมด {filtered.length} รายการ
          </span>
          <div className="admin-pagination-controls">
            <button
              type="button"
              className="admin-page-btn"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                className={`admin-page-btn ${page === p ? 'active' : ''}`}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              className="admin-page-btn"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              ›
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailModal && (
        <div
          className="admin-form-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDetailModal(null);
          }}
        >
          <div className="admin-modal-card" style={{ maxWidth: '600px' }}>
            <div className="admin-modal-header">
              <div>
                <h2>รายละเอียดคิวจองสำรวจ {detailModal.booking_number}</h2>
                <p>สร้างคำขอเมื่อ {new Date(detailModal.created_at).toLocaleString('th-TH')}</p>
              </div>
              <button
                type="button"
                className="icon-action"
                onClick={() => setDetailModal(null)}
              >
                ×
              </button>
            </div>

            <div style={{ background: '#f8faf6', padding: '16px', borderRadius: '8px', marginBottom: '16px', fontSize: '11px', color: '#324230' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <strong>ลูกค้า:</strong> {detailModal.customer_name || 'ลูกค้าทั่วไป'}
                </div>
                <div>
                  <strong>เบอร์โทรศัพท์:</strong> {detailModal.phone || '—'}
                </div>
                <div>
                  <strong>จังหวัด:</strong> {detailModal.province || '—'}
                </div>
                <div>
                  <strong>วันเวลานัดหมาย:</strong> {new Date(detailModal.preferred_at).toLocaleString('th-TH')}
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <strong>สถานที่/ที่อยู่นัดหมาย:</strong>
                  <p style={{ margin: '4px 0 0', color: '#576654' }}>{detailModal.address || '—'}</p>
                </div>
                {detailModal.notes && (
                  <div style={{ gridColumn: 'span 2', background: '#eef5ea', padding: '8px', borderRadius: '6px' }}>
                    <strong>ความต้องการเพิ่มเติม / หมายเหตุ:</strong>
                    <p style={{ margin: '3px 0 0', color: '#47633a' }}>{detailModal.notes}</p>
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <strong style={{ fontSize: '12px', color: '#273826' }}>ช่างผู้รับผิดชอบงานนี้:</strong>
              <div style={{ marginTop: '6px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {detailModal.technician_names?.length ? (
                  detailModal.technician_names.map((name, i) => (
                    <span key={i} className="status-pill green">
                      <Wrench size={10} style={{ display: 'inline', marginRight: '3px' }} /> {name}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '11px', color: '#97a395' }}>ยังไม่ได้มอบหมายช่าง</span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #edf1e9', paddingTop: '16px' }}>
              <button
                type="button"
                className="button button-green small-button"
                onClick={() => {
                  setDetailModal(null);
                  navigate('/manage-quotes');
                }}
              >
                <FileText size={13} /> ไปหน้าออกใบเสนอราคา
              </button>

              <button
                type="button"
                className="button button-outline"
                onClick={() => setDetailModal(null)}
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Booking Modal */}
      {createModal && (
        <div
          className="admin-form-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setCreateModal(false);
          }}
        >
          <form className="admin-product-form" onSubmit={handleCreateSubmit} style={{ maxWidth: '580px' }}>
            <div className="workspace-section-heading">
              <div>
                <h2>เปิดคิวจองช่างสำรวจหน้างานใหม่</h2>
                <p>สำหรับรับโทรศัพท์ลูกค้าหรือบริการ Walk-in</p>
              </div>
              <button
                type="button"
                className="icon-action"
                onClick={() => setCreateModal(false)}
              >
                ×
              </button>
            </div>

            <div className="admin-form-grid">
              <label>
                ชื่อ-นามสกุล ลูกค้า *
                <input
                  type="text"
                  required
                  value={form.customer_name}
                  onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                  placeholder="เช่น คุณสมชาย ใจดี"
                />
              </label>

              <label>
                เบอร์โทรศัพท์ติดต่อ *
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="081-234-5678"
                />
              </label>

              <label>
                จังหวัดที่ตั้งหน้างาน *
                <select
                  className="admin-filter-select"
                  value={form.province}
                  onChange={(e) => setForm({ ...form, province: e.target.value })}
                >
                  {provinces.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </label>

              <label>
                วันเวลานัดหมายเข้าสำรวจ *
                <input
                  type="datetime-local"
                  required
                  value={form.preferred_at}
                  onChange={(e) => setForm({ ...form, preferred_at: e.target.value })}
                />
              </label>

              <label className="full-width">
                ที่อยู่อย่างละเอียด (บ้านเลขที่ ซอย ถนน แขวง/ตำบล) *
                <textarea
                  rows="2"
                  required
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="ระบุสถานที่ติดตั้งให้ชัดเจนเพื่อให้ช่างเดินทางไปถูก..."
                />
              </label>

              <label className="full-width">
                ขนาดระบบที่สนใจ / หมายเหตุเพิ่มเติม
                <textarea
                  rows="2"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="เช่น สนใจระบบ 5kW ค่าไฟเดือนละ 4,000 บาท หลังคาซีแพคโมเนีย"
                />
              </label>
            </div>

            <div className="admin-form-actions">
              <button
                type="button"
                className="button button-outline"
                onClick={() => setCreateModal(false)}
              >
                ยกเลิก
              </button>
              <button type="submit" className="button button-green">
                สร้างคิวจอง
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

