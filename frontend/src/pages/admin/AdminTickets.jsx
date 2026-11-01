import React, { useState, useMemo } from 'react';
import {
  LifeBuoy,
  Search,
  Filter,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  User,
  MessageSquare,
  Edit3,
} from 'lucide-react';

const priorityLabels = {
  low: { label: 'ต่ำ', tone: 'gray' },
  medium: { label: 'ปานกลาง', tone: 'blue' },
  high: { label: 'สูง', tone: 'yellow' },
  urgent: { label: 'ด่วนที่สุด 🔥', tone: 'red' },
};

const statusLabels = {
  open: { label: 'เปิดเคสใหม่', tone: 'yellow' },
  in_progress: { label: 'กำลังดำเนินการ', tone: 'blue' },
  resolved: { label: 'แก้ไขแล้ว', tone: 'green' },
  closed: { label: 'ปิดเคสเสร็จสิ้น', tone: 'gray' },
};

const categoryLabels = {
  inverter_error: 'อินเวอร์เตอร์แจ้งเตือน Error',
  repair: 'แจ้งซ่อมแซมอุปกรณ์',
  billing: 'สอบถามค่าไฟ / การเงิน',
  inquiry: 'สอบถามการใช้งาน / ขนานไฟ',
  other: 'อื่น ๆ',
};

export default function AdminTickets({ tickets, onSaveTicket, setToast }) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [formModal, setFormModal] = useState(null);
  const [detailModal, setDetailModal] = useState(null);

  const filtered = useMemo(() => {
    return (tickets || []).filter((t) => {
      const matchSearch =
        !search ||
        `${t.ticket_number} ${t.customer_name} ${t.title} ${t.description}`
          .toLowerCase()
          .includes(search.toLowerCase());
      const matchStatus = !filterStatus || t.status === filterStatus;
      const matchPriority = !filterPriority || t.priority === filterPriority;
      return matchSearch && matchStatus && matchPriority;
    });
  }, [tickets, search, filterStatus, filterPriority]);

  function handleSaveNew(e) {
    e.preventDefault();
    onSaveTicket(formModal);
    setFormModal(null);
    if (setToast) setToast('เปิดเคสแจ้งซ่อมเรียบร้อยแล้ว');
  }

  function handleUpdateCase(e) {
    e.preventDefault();
    onSaveTicket(detailModal);
    setDetailModal(null);
    if (setToast) setToast('อัปเดตสถานะเคสเรียบร้อยแล้ว');
  }

  return (
    <div className="admin-tickets-view">
      <div className="admin-toolbar">
        <div className="admin-toolbar-left">
          <div className="admin-search-box">
            <Search size={14} color="#788775" />
            <input
              type="text"
              placeholder="ค้นหาเลขที่เคส, ชื่อลูกค้า, อาการที่แจ้ง..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="admin-filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">ทุกสถานะเคส</option>
            <option value="open">เปิดเคสใหม่</option>
            <option value="in_progress">กำลังดำเนินการ</option>
            <option value="resolved">แก้ไขแล้ว</option>
            <option value="closed">ปิดเคส</option>
          </select>

          <select
            className="admin-filter-select"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="">ทุกระดับความสำคัญ</option>
            <option value="urgent">ด่วนที่สุด (Urgent)</option>
            <option value="high">สูง (High)</option>
            <option value="medium">ปานกลาง (Medium)</option>
            <option value="low">ต่ำ (Low)</option>
          </select>
        </div>

        <div className="admin-toolbar-right">
          <button
            type="button"
            className="button button-dark small-button"
            onClick={() =>
              setFormModal({
                customer_name: '',
                customer_phone: '',
                title: '',
                category: 'inverter_error',
                priority: 'medium',
                status: 'open',
                assigned_to_name: 'ช่างเทคนิค SolarService',
                description: '',
                resolution_notes: '',
              })
            }
          >
            <Plus size={14} /> เปิดเคสแจ้งซ่อมใหม่
          </button>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="admin-table">
        <div
          className="admin-table-head"
          style={{ gridTemplateColumns: 'minmax(110px, 0.9fr) minmax(130px, 1fr) minmax(170px, 1.4fr) minmax(90px, 0.7fr) minmax(110px, 0.9fr) 90px' }}
        >
          <span>เลขที่เคส</span>
          <span>ลูกค้า / ผู้แจ้ง</span>
          <span>หัวข้อ & อาการปัญหา</span>
          <span>ความเร่งด่วน</span>
          <span>สถานะ</span>
          <span>จัดการ</span>
        </div>

        {filtered.length ? (
          filtered.map((item) => {
            const pInfo = priorityLabels[item.priority] || priorityLabels.medium;
            const sInfo = statusLabels[item.status] || statusLabels.open;
            return (
              <div
                key={item.id}
                className="admin-table-row"
                style={{ gridTemplateColumns: 'minmax(110px, 0.9fr) minmax(130px, 1fr) minmax(170px, 1.4fr) minmax(90px, 0.7fr) minmax(110px, 0.9fr) 90px' }}
              >
                <div>
                  <strong>{item.ticket_number}</strong>
                  <small>{new Date(item.created_at).toLocaleDateString('th-TH')}</small>
                </div>

                <div>
                  <strong>{item.customer_name}</strong>
                  <small>{item.customer_phone || '—'}</small>
                </div>

                <div>
                  <strong style={{ fontSize: '11px' }}>{item.title}</strong>
                  <small style={{ color: '#7a8775' }}>
                    {categoryLabels[item.category] || item.category}
                  </small>
                </div>

                <div>
                  <span className={`status-pill ${pInfo.tone}`}>{pInfo.label}</span>
                </div>

                <div>
                  <span className={`status-pill ${sInfo.tone}`}>{sInfo.label}</span>
                  {item.assigned_to_name && (
                    <small style={{ display: 'block', marginTop: '3px' }}>
                      ผู้ดูแล: {item.assigned_to_name}
                    </small>
                  )}
                </div>

                <div>
                  <button
                    type="button"
                    className="button button-outline small-button"
                    style={{ padding: '6px 9px', fontSize: '10px' }}
                    onClick={() => setDetailModal({ ...item })}
                  >
                    ดู & แก้ไข
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <p className="admin-empty">ไม่พบเคสแจ้งซ่อมหรือปัญหาตามที่ค้นหา</p>
        )}
      </div>

      {/* New Ticket Modal */}
      {formModal && (
        <div
          className="admin-form-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setFormModal(null);
          }}
        >
          <div className="admin-modal-card">
            <div className="admin-modal-header">
              <div>
                <h2>เปิดเคสแจ้งปัญหาการใช้งานใหม่</h2>
                <p>บันทึกเรื่องร้องเรียนหรือปัญหาอุปกรณ์จากลูกค้า</p>
              </div>
              <button
                type="button"
                className="icon-action"
                onClick={() => setFormModal(null)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveNew}>
              <div className="admin-form-grid">
                <label>
                  ชื่อลูกค้า *
                  <input
                    type="text"
                    required
                    value={formModal.customer_name}
                    onChange={(e) =>
                      setFormModal({ ...formModal, customer_name: e.target.value })
                    }
                    placeholder="เช่น คุณสมชาย ใจดี"
                  />
                </label>

                <label>
                  เบอร์โทรติดต่อ
                  <input
                    type="text"
                    value={formModal.customer_phone}
                    onChange={(e) =>
                      setFormModal({ ...formModal, customer_phone: e.target.value })
                    }
                    placeholder="เช่น 081-234-5678"
                  />
                </label>

                <label>
                  หมวดหมู่ปัญหา *
                  <select
                    className="admin-filter-select"
                    value={formModal.category}
                    onChange={(e) =>
                      setFormModal({ ...formModal, category: e.target.value })
                    }
                  >
                    <option value="inverter_error">อินเวอร์เตอร์แจ้งเตือน Error</option>
                    <option value="repair">แจ้งซ่อมแซมอุปกรณ์</option>
                    <option value="billing">สอบถามค่าไฟ / การเงิน</option>
                    <option value="inquiry">สอบถามการใช้งาน / ขนานไฟ</option>
                    <option value="other">อื่น ๆ</option>
                  </select>
                </label>

                <label>
                  ระดับความสำคัญ *
                  <select
                    className="admin-filter-select"
                    value={formModal.priority}
                    onChange={(e) =>
                      setFormModal({ ...formModal, priority: e.target.value })
                    }
                  >
                    <option value="low">ต่ำ (Low)</option>
                    <option value="medium">ปานกลาง (Medium)</option>
                    <option value="high">สูง (High)</option>
                    <option value="urgent">ด่วนที่สุด (Urgent)</option>
                  </select>
                </label>

                <label className="full-width">
                  หัวข้อเรื่อง / อาการที่พบ *
                  <input
                    type="text"
                    required
                    value={formModal.title}
                    onChange={(e) =>
                      setFormModal({ ...formModal, title: e.target.value })
                    }
                    placeholder="เช่น เครื่องอินเวอร์เตอร์มีไฟกระพริบสีแดง ผลิตไฟไม่ได้"
                  />
                </label>

                <label className="full-width">
                  รายละเอียดอาการเพิ่มเติม
                  <textarea
                    rows="3"
                    value={formModal.description}
                    onChange={(e) =>
                      setFormModal({ ...formModal, description: e.target.value })
                    }
                    placeholder="ระบุข้อความ error code หรือพฤติกรรมที่สังเกตได้..."
                  />
                </label>
              </div>

              <div className="admin-form-actions">
                <button
                  type="button"
                  className="button button-outline"
                  onClick={() => setFormModal(null)}
                >
                  ยกเลิก
                </button>
                <button type="submit" className="button button-green">
                  เปิดเคสแจ้งซ่อม
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Case Details & Resolution Modal */}
      {detailModal && (
        <div
          className="admin-form-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDetailModal(null);
          }}
        >
          <div className="admin-modal-card">
            <div className="admin-modal-header">
              <div>
                <h2>เคส {detailModal.ticket_number}: {detailModal.title}</h2>
                <p>ลูกค้า: {detailModal.customer_name} ({detailModal.customer_phone || '—'})</p>
              </div>
              <button
                type="button"
                className="icon-action"
                onClick={() => setDetailModal(null)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpdateCase}>
              <div style={{ padding: '12px', background: '#f8faf6', borderRadius: '7px', marginBottom: '16px', fontSize: '11px', color: '#3a4b37' }}>
                <strong>รายละเอียดอาการ:</strong>
                <p style={{ margin: '6px 0 0', color: '#576654' }}>
                  {detailModal.description || 'ไม่มีรายละเอียดเพิ่มเติม'}
                </p>
              </div>

              <div className="admin-form-grid">
                <label>
                  สถานะการแก้ปัญหา *
                  <select
                    className="admin-filter-select"
                    value={detailModal.status}
                    onChange={(e) =>
                      setDetailModal({ ...detailModal, status: e.target.value })
                    }
                  >
                    <option value="open">เปิดเคสใหม่ (Open)</option>
                    <option value="in_progress">กำลังดำเนินการ (In Progress)</option>
                    <option value="resolved">แก้ไขแล้ว (Resolved)</option>
                    <option value="closed">ปิดเคสเสร็จสิ้น (Closed)</option>
                  </select>
                </label>

                <label>
                  มอบหมายเจ้าหน้าที่ / ช่าง
                  <input
                    type="text"
                    value={detailModal.assigned_to_name || ''}
                    onChange={(e) =>
                      setDetailModal({ ...detailModal, assigned_to_name: e.target.value })
                    }
                    placeholder="เช่น ช่างเอกชัย / แอดมินสมศรี"
                  />
                </label>

                <label className="full-width">
                  บันทึกผลการแก้ไข / แนวทางแก้ไข (Resolution Notes)
                  <textarea
                    rows="3"
                    value={detailModal.resolution_notes || ''}
                    onChange={(e) =>
                      setDetailModal({ ...detailModal, resolution_notes: e.target.value })
                    }
                    placeholder="บันทึกสิ่งที่ได้ตรวจสอบ วิธีแก้ปัญหา หรือผลการประสานงาน..."
                  />
                </label>
              </div>

              <div className="admin-form-actions">
                <button
                  type="button"
                  className="button button-outline"
                  onClick={() => setDetailModal(null)}
                >
                  ปิด
                </button>
                <button type="submit" className="button button-green">
                  บันทึกการอัปเดตเคส
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
