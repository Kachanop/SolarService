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
  skipped: 'ข้ามรอบ',
};

function createInitialForm() {
  return {
    customer_id: '',
    warranty_id: '',
    title: 'รอบล้างแผงโซลาร์เซลล์ประจำ 6 เดือน',
    reminder_type: 'panel_cleaning',
    due_date: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    frequency_months: 6,
    notes: '',
  };
}

export default function AdminMaintenance({
  reminders,
  customers = [],
  warranties = [],
  onUpdateStatus,
  onAddReminder,
  setToast,
}) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [scheduleModal, setScheduleModal] = useState(null);
  const [form, setForm] = useState(createInitialForm);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    return (reminders || []).filter((item) => {
      const matchSearch =
        !search ||
        `${item.customer_name} ${item.customer_phone} ${item.title} ${item.address || ''}`
          .toLowerCase()
          .includes(search.toLowerCase());
      const matchStatus = !filterStatus || item.status === filterStatus;
      const matchType = !filterType || item.reminder_type === filterType;
      return matchSearch && matchStatus && matchType;
    });
  }, [reminders, search, filterStatus, filterType]);

  async function handleSendNotification(item) {
    try {
      await onUpdateStatus(item.id, 'notified', { last_notified_at: new Date().toISOString() });
      if (setToast) setToast('บันทึกสถานะแจ้งเตือนแล้ว');
    } catch (error) {
      if (setToast) setToast(`อัปเดตสถานะแจ้งเตือนไม่สำเร็จ: ${error?.message || 'กรุณาลองอีกครั้ง'}`);
    }
  }

  async function handleScheduleJob(item) {
    try {
      await onUpdateStatus(item.id, 'scheduled', {
        notes: `นัดหมายช่างวันที่ ${scheduleModal.date} เวลา ${scheduleModal.time}`,
      });
      setScheduleModal(null);
      if (setToast) setToast('บันทึกกำหนดนัดหมายแล้ว');
    } catch (error) {
      if (setToast) setToast(`บันทึกกำหนดนัดหมายไม่สำเร็จ: ${error?.message || 'กรุณาลองอีกครั้ง'}`);
    }
  }

  async function handleMarkComplete(item) {
    try {
      await onUpdateStatus(item.id, 'completed');
      if (setToast) setToast('บันทึกสถานะงานบำรุงรักษาแล้ว');
    } catch (error) {
      if (setToast) setToast(`บันทึกสถานะงานไม่สำเร็จ: ${error?.message || 'กรุณาลองอีกครั้ง'}`);
    }
  }

  async function handleAddReminder(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await onAddReminder(form);
      setModalOpen(false);
      setForm(createInitialForm());
      if (setToast) setToast('เพิ่มรอบบำรุงรักษาแล้ว');
    } catch (error) {
      if (setToast) setToast(`เพิ่มรอบบำรุงรักษาไม่สำเร็จ: ${error?.message || 'กรุณาลองอีกครั้ง'}`);
    } finally {
      setSaving(false);
    }
  }

  const customerWarranties = warranties.filter((item) => item.customer_id === form.customer_id);

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
            <option value="skipped">ข้ามรอบ</option>
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
            <option value="annual_inspection">ตรวจระบบความปลอดภัยประจำปี</option>
          </select>
        </div>

        <div className="admin-toolbar-right">
          <button
            type="button"
            className="button button-dark small-button"
            onClick={() => {
              setForm(createInitialForm());
              setModalOpen(true);
            }}
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
                      : item.status === 'skipped'
                      ? 'gray'
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
                    title="บันทึกสถานะการแจ้งเตือน"
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
          <p className="admin-empty">
            {reminders?.length ? 'ไม่พบรายการที่ตรงกับตัวกรอง' : 'ยังไม่มีรายการแจ้งเตือนบำรุงรักษาในระบบ'}
          </p>
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

            <form onSubmit={handleAddReminder}>
              <div className="admin-form-grid">
                <label>
                  ลูกค้าในระบบ *
                  <select
                    required
                    value={form.customer_id}
                    onChange={(e) => setForm({ ...form, customer_id: e.target.value, warranty_id: '' })}
                  >
                    <option value="">เลือกลูกค้า</option>
                    {customers.filter((customer) => customer.role === 'customer').map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.full_name || 'ไม่ระบุชื่อ'}{customer.phone ? ` · ${customer.phone}` : ''}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  ระบบ/ทะเบียนรับประกัน
                  <select
                    value={form.warranty_id}
                    onChange={(e) => setForm({ ...form, warranty_id: e.target.value })}
                    disabled={!form.customer_id || customerWarranties.length === 0}
                  >
                    <option value="">ไม่ระบุระบบ</option>
                    {customerWarranties.map((warranty) => (
                      <option key={warranty.id} value={warranty.id}>
                        {warranty.warranty_number || warranty.equipment_model || warranty.serial_number || warranty.id}
                      </option>
                    ))}
                  </select>
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

                <label>
                  ความถี่ (เดือน)
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.frequency_months}
                    onChange={(e) => setForm({ ...form, frequency_months: e.target.value })}
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

                <label className="full-width">
                  หมายเหตุ
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows="3"
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
                <button type="submit" className="button button-green" disabled={saving || customers.length === 0}>
                  {saving ? 'กำลังบันทึก...' : 'บันทึกรอบบำรุงรักษา'}
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
