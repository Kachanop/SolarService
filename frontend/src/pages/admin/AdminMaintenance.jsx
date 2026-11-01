import React, { useState, useMemo } from 'react';
import {
  BellRing,
  Send,
  Calendar,
  CheckCircle,
  Plus,
  Clock,
  Search,
  Wrench,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

const typeLabels = {
  panel_cleaning: 'รอบล้างแผงโซลาร์เซลล์',
  inverter_check: 'ตรวจเช็คอินเวอร์เตอร์ประจำปี',
  annual_inspection: 'ตรวจระบบความปลอดภัยประจำปี',
  battery_health: 'ตรวจสุขภาพแบตเตอรี่',
};

const statusLabels = {
  pending: 'รอดำเนินการ',
  notified: 'ส่งแจ้งเตือนแล้ว',
  scheduled: 'นัดหมายช่างแล้ว',
  completed: 'เสร็จสิ้นเรียบร้อย',
};

export default function AdminMaintenance({ reminders, onUpdateStatus, onAddReminder, setToast }) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [scheduleModal, setScheduleModal] = useState(null);

  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    address: '',
    title: 'รอบล้างแผงโซลาร์เซลล์ประจำ 6 เดือน',
    reminder_type: 'panel_cleaning',
    due_date: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    frequency_months: 6,
    notes: '',
  });

  const filtered = useMemo(() => {
    return (reminders || []).filter((item) => {
      const matchSearch =
        !search ||
        `${item.customer_name} ${item.customer_phone} ${item.title} ${item.address}`
          .toLowerCase()
          .includes(search.toLowerCase());
      const matchStatus = !filterStatus || item.status === filterStatus;
      const matchType = !filterType || item.reminder_type === filterType;
      return matchSearch && matchStatus && matchType;
    });
  }, [reminders, search, filterStatus, filterType]);

  function handleSendNotification(item) {
    onUpdateStatus(item.id, 'notified', { last_notified_at: new Date().toISOString() });
    if (setToast) {
      setToast(`ส่งข้อความแจ้งเตือนรอบบำรุงรักษาไปยังคุณ ${item.customer_name} เรียบร้อยแล้ว`);
    }
  }

  function handleScheduleJob(item) {
    onUpdateStatus(item.id, 'scheduled', { notes: `นัดหมายช่างวันที่ ${scheduleModal.date} เวลา ${scheduleModal.time}` });
    setScheduleModal(null);
    if (setToast) {
      setToast(`สร้างนัดหมายคิวช่างสำหรับคุณ ${item.customer_name} เรียบร้อยแล้ว`);
    }
  }

  function handleMarkComplete(item) {
    onUpdateStatus(item.id, 'completed');
    if (setToast) {
      setToast(`บันทึกงานบริการบำรุงรักษาเรียบร้อยแล้ว`);
    }
  }

  return (
    <div className="admin-maintenance-view">
      {/* Alert Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '14px 18px',
          background: 'linear-gradient(90deg, #f3f8ee 0%, #e8f2e2 100%)',
          border: '1px solid #d4e2cc',
          borderRadius: '8px',
          marginBottom: '18px',
        }}
      >
        <Sparkles size={20} color="#587b45" />
        <div style={{ flex: 1, fontSize: '11px', color: '#2d4029' }}>
          <strong>ระบบสร้างยอดขายต่อเนื่อง (Recurring Revenue):</strong>
          <span style={{ display: 'block', color: '#576a52', marginTop: '2px' }}>
            แจ้งเตือนลูกค้าล้างแผงทุก 6 เดือน หรือ 1 ปี ช่วยเพิ่มประสิทธิภาพการผลิตไฟ 15-20% พร้อมสร้างรายได้ค่าบริการต่อเนื่อง
          </span>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-toolbar-left">
          <div className="admin-search-box">
            <Search size={14} color="#788775" />
            <input
              type="text"
              placeholder="ค้นหาชื่อลูกค้า, เบอร์โทร, รายการบำรุงรักษา..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="admin-filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">ทุกสถานะ</option>
            <option value="pending">รอดำเนินการ</option>
            <option value="notified">ส่งแจ้งเตือนแล้ว</option>
            <option value="scheduled">นัดหมายช่างแล้ว</option>
            <option value="completed">เสร็จสิ้นเรียบร้อย</option>
          </select>

          <select
            className="admin-filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">ทุกประเภทบริการ</option>
            <option value="panel_cleaning">รอบล้างแผงโซลาร์เซลล์</option>
            <option value="inverter_check">ตรวจเช็คอินเวอร์เตอร์ประจำปี</option>
            <option value="battery_health">ตรวจสุขภาพแบตเตอรี่</option>
          </select>
        </div>

        <div className="admin-toolbar-right">
          <button
            type="button"
            className="button button-dark small-button"
            onClick={() => setModalOpen(true)}
          >
            <Plus size={14} /> เพิ่มรอบบำรุงรักษาใหม่
          </button>
        </div>
      </div>

      {/* Reminders Table */}
      <div className="admin-table">
        <div
          className="admin-table-head"
          style={{ gridTemplateColumns: 'minmax(140px, 1.2fr) minmax(140px, 1.2fr) minmax(100px, 0.8fr) minmax(90px, 0.8fr) minmax(160px, 1.4fr)' }}
        >
          <span>ลูกค้า / ที่อยู่</span>
          <span>รายการบำรุงรักษา</span>
          <span>กำหนดการ</span>
          <span>สถานะ</span>
          <span>ดำเนินการด่วน</span>
        </div>

        {filtered.length ? (
          filtered.map((item) => (
            <div
              key={item.id}
              className="admin-table-row"
              style={{ gridTemplateColumns: 'minmax(140px, 1.2fr) minmax(140px, 1.2fr) minmax(100px, 0.8fr) minmax(90px, 0.8fr) minmax(160px, 1.4fr)' }}
            >
              <div>
                <strong>{item.customer_name}</strong>
                <small>{item.customer_phone} · {item.address || '—'}</small>
              </div>

              <div>
                <span style={{ fontWeight: '600' }}>{item.title}</span>
                <small>{typeLabels[item.reminder_type] || item.reminder_type}</small>
              </div>

              <div>
                <span style={{ color: '#2b3f27', fontWeight: '600' }}>
                  {new Date(item.due_date).toLocaleDateString('th-TH')}
                </span>
                {item.last_notified_at && (
                  <small style={{ color: '#527c42' }}>
                    แจ้งเมื่อ {new Date(item.last_notified_at).toLocaleDateString('th-TH')}
                  </small>
                )}
              </div>

              <div>
                <span
                  className={`status-pill ${
                    item.status === 'completed'
                      ? 'green'
                      : item.status === 'scheduled'
                      ? 'blue'
                      : item.status === 'notified'
                      ? 'purple'
                      : 'yellow'
                  }`}
                >
                  {statusLabels[item.status] || item.status}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                {item.status !== 'completed' && (
                  <button
                    type="button"
                    className="button button-outline small-button"
                    style={{ padding: '5px 8px', fontSize: '9px' }}
                    onClick={() => handleSendNotification(item)}
                    title="ส่งอีเมลหรือ SMS แจ้งเตือนลูกค้า"
                  >
                    <Send size={12} /> แจ้งเตือน
                  </button>
                )}

                {item.status !== 'completed' && item.status !== 'scheduled' && (
                  <button
                    type="button"
                    className="button button-outline small-button"
                    style={{ padding: '5px 8px', fontSize: '9px' }}
                    onClick={() =>
                      setScheduleModal({
                        item,
                        date: item.due_date,
                        time: '10:00',
                      })
                    }
                  >
                    <Calendar size={12} /> นัดช่าง
                  </button>
                )}

                {item.status !== 'completed' && (
                  <button
                    type="button"
                    className="button button-green small-button"
                    style={{ padding: '5px 8px', fontSize: '9px' }}
                    onClick={() => handleMarkComplete(item)}
                  >
                    <CheckCircle size={12} /> เสร็จสิ้น
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="admin-empty">ไม่พบรายการรอบบำรุงรักษา</p>
        )}
      </div>

      {/* Add Reminder Modal */}
      {modalOpen && (
        <div
          className="admin-form-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <div className="admin-modal-card">
            <div className="admin-modal-header">
              <div>
                <h2>เพิ่มรอบบำรุงรักษาและล้างแผง</h2>
                <p>ตั้งค่าแจ้งเตือนรอบ 6 เดือน หรือ 1 ปี เพื่อสร้างความประทับใจและยอดขายซ้ำ</p>
              </div>
              <button
                type="button"
                className="icon-action"
                onClick={() => setModalOpen(false)}
              >
                ×
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onAddReminder(form);
                setModalOpen(false);
                if (setToast) setToast('เพิ่มรอบบำรุงรักษาเรียบร้อยแล้ว');
              }}
            >
              <div className="admin-form-grid">
                <label>
                  ชื่อลูกค้า *
                  <input
                    type="text"
                    required
                    value={form.customer_name}
                    onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                    placeholder="เช่น คุณสมชาย ใจดี"
                  />
                </label>

                <label>
                  เบอร์โทรศัพท์ลูกค้า *
                  <input
                    type="text"
                    required
                    value={form.customer_phone}
                    onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                    placeholder="เช่น 081-234-5678"
                  />
                </label>

                <label className="full-width">
                  สถานที่ติดตั้ง / ที่อยู่
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="ที่อยู่บ้านลูกค้า"
                  />
                </label>

                <label>
                  ประเภทบริการ *
                  <select
                    className="admin-filter-select"
                    value={form.reminder_type}
                    onChange={(e) => setForm({ ...form, reminder_type: e.target.value })}
                  >
                    <option value="panel_cleaning">รอบล้างแผงโซลาร์เซลล์</option>
                    <option value="inverter_check">ตรวจเช็คอินเวอร์เตอร์ประจำปี</option>
                    <option value="battery_health">ตรวจสุขภาพแบตเตอรี่</option>
                    <option value="annual_inspection">ตรวจระบบประจำปี</option>
                  </select>
                </label>

                <label>
                  กำหนดวันที่ต้องเข้าบริการ *
                  <input
                    type="date"
                    required
                    value={form.due_date}
                    onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                  />
                </label>

                <label className="full-width">
                  หัวข้อการแจ้งเตือน
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </label>
              </div>

              <div className="admin-form-actions">
                <button
                  type="button"
                  className="button button-outline"
                  onClick={() => setModalOpen(false)}
                >
                  ยกเลิก
                </button>
                <button type="submit" className="button button-green">
                  บันทึกรอบบำรุงรักษา
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Job Quick Modal */}
      {scheduleModal && (
        <div
          className="admin-form-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setScheduleModal(null);
          }}
        >
          <div className="admin-modal-card" style={{ maxWidth: '480px' }}>
            <div className="admin-modal-header">
              <div>
                <h2>นัดหมายคิวงานช่างเข้าบริการ</h2>
                <p>ลูกค้า: {scheduleModal.item.customer_name}</p>
              </div>
              <button
                type="button"
                className="icon-action"
                onClick={() => setScheduleModal(null)}
              >
                ×
              </button>
            </div>

            <div className="admin-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <label>
                วันที่นัดหมาย
                <input
                  type="date"
                  value={scheduleModal.date}
                  onChange={(e) =>
                    setScheduleModal({ ...scheduleModal, date: e.target.value })
                  }
                />
              </label>

              <label>
                เวลานัดหมาย
                <input
                  type="time"
                  value={scheduleModal.time}
                  onChange={(e) =>
                    setScheduleModal({ ...scheduleModal, time: e.target.value })
                  }
                />
              </label>
            </div>

            <div className="admin-form-actions" style={{ marginTop: '20px' }}>
              <button
                type="button"
                className="button button-outline"
                onClick={() => setScheduleModal(null)}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                className="button button-green"
                onClick={() => handleScheduleJob(scheduleModal.item)}
              >
                ยืนยันนัดหมายช่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
