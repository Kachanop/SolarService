import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  Plus,
  Download,
  Calendar,
  Award,
  Eye,
  Trash2,
  Edit3,
  CheckCircle,
  AlertTriangle,
  Clock,
} from 'lucide-react';

const equipmentLabels = {
  solar_panel: 'แผงโซลาร์เซลล์',
  inverter: 'อินเวอร์เตอร์',
  battery: 'แบตเตอรี่',
  installation_work: 'งานติดตั้งโครงสร้าง',
  other: 'อุปกรณ์อื่น ๆ',
};

const statusLabels = {
  active: 'ปกติ (อยู่ในประกัน)',
  expiring_soon: 'ใกล้หมดอายุ (ภายใน 60 วัน)',
  expired: 'หมดอายุแล้ว',
  claimed: 'มีการเคลมประกัน',
};

export default function AdminWarranties({ warranties, onSave, onDelete, setToast }) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [formModal, setFormModal] = useState(null);
  const [certModal, setCertModal] = useState(null);

  const filtered = useMemo(() => {
    return (warranties || []).filter((item) => {
      const matchSearch =
        !search ||
        `${item.warranty_number} ${item.serial_number} ${item.customer_name} ${item.equipment_model}`
          .toLowerCase()
          .includes(search.toLowerCase());
      const matchType = !filterType || item.equipment_type === filterType;
      const matchStatus = !filterStatus || item.status === filterStatus;
      return matchSearch && matchType && matchStatus;
    });
  }, [warranties, search, filterType, filterStatus]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  function handleSave(e) {
    e.preventDefault();
    if (!formModal.serial_number || !formModal.customer_name) {
      alert('กรุณากรอก Serial Number และชื่อลูกค้า');
      return;
    }
    onSave(formModal);
    setFormModal(null);
    if (setToast) setToast('บันทึกข้อมูลการรับประกันเรียบร้อยแล้ว');
  }

  function exportWarrantiesCSV() {
    const headers = ['เลขที่รับประกัน', 'ชื่อลูกค้า', 'เบอร์โทร', 'ประเภทอุปกรณ์', 'รุ่นอุปกรณ์', 'Serial Number', 'วันเริ่มต้น', 'วันหมดอายุ', 'สถานะ'];
    const rows = filtered.map((w) => [
      `"${w.warranty_number}"`,
      `"${w.customer_name || ''}"`,
      `"${w.customer_phone || ''}"`,
      `"${equipmentLabels[w.equipment_type] || w.equipment_type}"`,
      `"${w.equipment_model || ''}"`,
      `"${w.serial_number || ''}"`,
      `"${w.warranty_start}"`,
      `"${w.warranty_end}"`,
      `"${statusLabels[w.status] || w.status}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SolarService_Warranties_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="admin-warranties-view">
      <div className="admin-toolbar">
        <div className="admin-toolbar-left">
          <div className="admin-search-box">
            <Search size={14} color="#788775" />
            <input
              type="text"
              placeholder="ค้นหา Serial No., เลขที่รับประกัน, ชื่อลูกค้า..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <select
            className="admin-filter-select"
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setPage(1);
            }}
          >
            <option value="">ทุกประเภทอุปกรณ์</option>
            <option value="solar_panel">แผงโซลาร์เซลล์</option>
            <option value="inverter">อินเวอร์เตอร์</option>
            <option value="battery">แบตเตอรี่</option>
            <option value="installation_work">งานติดตั้ง</option>
          </select>

          <select
            className="admin-filter-select"
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">ทุกสถานะ</option>
            <option value="active">ปกติ (อยู่ในประกัน)</option>
            <option value="expiring_soon">ใกล้หมดอายุ</option>
            <option value="expired">หมดอายุ</option>
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
                equipment_type: 'inverter',
                equipment_model: '',
                serial_number: '',
                warranty_start: new Date().toISOString().slice(0, 10),
                warranty_end: new Date(Date.now() + 10 * 365 * 24 * 3600 * 1000).toISOString().slice(0, 10),
                status: 'active',
                notes: '',
              })
            }
          >
            <Plus size={14} /> ลงทะเบียนรับประกันใหม่
          </button>

          <button
            type="button"
            className="button button-outline small-button"
            onClick={exportWarrantiesCSV}
          >
            <Download size={14} /> ส่งออก CSV
          </button>
        </div>
      </div>

      {/* Warranties Table */}
      <div className="admin-table">
        <div
          className="admin-table-head"
          style={{ gridTemplateColumns: 'minmax(140px, 1.2fr) minmax(130px, 1fr) minmax(140px, 1.2fr) minmax(100px, 0.8fr) minmax(100px, 0.8fr) 100px' }}
        >
          <span>เลขที่รับประกัน / ลูกค้า</span>
          <span>ประเภท / รุ่นอุปกรณ์</span>
          <span>Serial Number</span>
          <span>วันหมดอายุ</span>
          <span>สถานะ</span>
          <span>จัดการ</span>
        </div>

        {paginated.length ? (
          paginated.map((item) => (
            <div
              key={item.id}
              className="admin-table-row"
              style={{ gridTemplateColumns: 'minmax(140px, 1.2fr) minmax(130px, 1fr) minmax(140px, 1.2fr) minmax(100px, 0.8fr) minmax(100px, 0.8fr) 100px' }}
            >
              <div>
                <strong>{item.warranty_number}</strong>
                <small>{item.customer_name} · {item.customer_phone || '—'}</small>
              </div>

              <div>
                <span>{equipmentLabels[item.equipment_type] || item.equipment_type}</span>
                <small>{item.equipment_model}</small>
              </div>

              <div>
                <code style={{ fontSize: '10px', background: '#eef3ea', padding: '2px 5px', borderRadius: '4px' }}>
                  {item.serial_number}
                </code>
              </div>

              <div>
                <span>{new Date(item.warranty_end).toLocaleDateString('th-TH')}</span>
                <small>เริ่ม {new Date(item.warranty_start).toLocaleDateString('th-TH')}</small>
              </div>

              <div>
                <span
                  className={`status-pill ${
                    item.status === 'active'
                      ? 'green'
                      : item.status === 'expiring_soon'
                      ? 'yellow'
                      : 'red'
                  }`}
                >
                  {statusLabels[item.status] || item.status}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button
                  type="button"
                  className="icon-action"
                  title="ดูบัตรรับประกัน"
                  onClick={() => setCertModal(item)}
                >
                  <Eye size={14} />
                </button>
                <button
                  type="button"
                  className="icon-action"
                  title="แก้ไข"
                  onClick={() => setFormModal({ ...item })}
                >
                  <Edit3 size={14} />
                </button>
                <button
                  type="button"
                  className="icon-action"
                  title="ลบ"
                  onClick={() => {
                    if (confirm(`ต้องการลบรายการรับประกัน ${item.warranty_number} หรือไม่?`)) {
                      onDelete(item.id);
                      if (setToast) setToast('ลบรายการรับประกันเรียบร้อย');
                    }
                  }}
                >
                  <Trash2 size={14} color="#9a3e35" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="admin-empty">ไม่พบข้อมูลการรับประกันที่ตรงกับเงื่อนไข</p>
        )}
      </div>

      {/* Pagination */}
      {filtered.length > pageSize && (
        <div className="admin-pagination">
          <span>
            แสดง {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, filtered.length)} จากทั้งหมด{' '}
            {filtered.length} รายการ
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

      {/* Add / Edit Warranty Modal */}
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
                <h2>{formModal.id ? 'แก้ไขข้อมูลการรับประกัน' : 'ลงทะเบียนรับประกันใหม่'}</h2>
                <p>บันทึก Serial Number และข้อมูลระยะเวลารับประกันของลูกค้า</p>
              </div>
              <button
                type="button"
                className="icon-action"
                onClick={() => setFormModal(null)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="admin-form-grid">
                <label>
                  ชื่อลูกค้า *
                  <input
                    type="text"
                    required
                    value={formModal.customer_name || ''}
                    onChange={(e) =>
                      setFormModal({ ...formModal, customer_name: e.target.value })
                    }
                    placeholder="เช่น คุณสมชาย ใจดี"
                  />
                </label>

                <label>
                  เบอร์โทรศัพท์ลูกค้า
                  <input
                    type="text"
                    value={formModal.customer_phone || ''}
                    onChange={(e) =>
                      setFormModal({ ...formModal, customer_phone: e.target.value })
                    }
                    placeholder="เช่น 081-234-5678"
                  />
                </label>

                <label>
                  ประเภทอุปกรณ์ *
                  <select
                    className="admin-filter-select"
                    value={formModal.equipment_type}
                    onChange={(e) =>
                      setFormModal({ ...formModal, equipment_type: e.target.value })
                    }
                  >
                    <option value="inverter">อินเวอร์เตอร์ (Inverter)</option>
                    <option value="solar_panel">แผงโซลาร์เซลล์ (Solar Panel)</option>
                    <option value="battery">แบตเตอรี่ (Battery Storage)</option>
                    <option value="installation_work">งานติดตั้งโครงสร้างหลังคา</option>
                    <option value="other">อุปกรณ์อื่น ๆ</option>
                  </select>
                </label>

                <label>
                  รุ่นอุปกรณ์ (Model Name) *
                  <input
                    type="text"
                    required
                    value={formModal.equipment_model || ''}
                    onChange={(e) =>
                      setFormModal({ ...formModal, equipment_model: e.target.value })
                    }
                    placeholder="เช่น Huawei SUN2000-5KTL"
                  />
                </label>

                <label className="full-width">
                  Serial Number (S/N) *
                  <input
                    type="text"
                    required
                    value={formModal.serial_number || ''}
                    onChange={(e) =>
                      setFormModal({ ...formModal, serial_number: e.target.value })
                    }
                    placeholder="เช่น HW-INV-88392104"
                  />
                </label>

                <label>
                  วันที่เริ่มรับประกัน *
                  <input
                    type="date"
                    required
                    value={formModal.warranty_start || ''}
                    onChange={(e) =>
                      setFormModal({ ...formModal, warranty_start: e.target.value })
                    }
                  />
                </label>

                <label>
                  วันสิ้นสุดการรับประกัน *
                  <input
                    type="date"
                    required
                    value={formModal.warranty_end || ''}
                    onChange={(e) =>
                      setFormModal({ ...formModal, warranty_end: e.target.value })
                    }
                  />
                </label>

                <label>
                  สถานะการรับประกัน
                  <select
                    className="admin-filter-select"
                    value={formModal.status}
                    onChange={(e) =>
                      setFormModal({ ...formModal, status: e.target.value })
                    }
                  >
                    <option value="active">ปกติ (อยู่ในประกัน)</option>
                    <option value="expiring_soon">ใกล้หมดอายุ</option>
                    <option value="expired">หมดอายุแล้ว</option>
                    <option value="claimed">มีการเคลมประกัน</option>
                  </select>
                </label>

                <label className="full-width">
                  หมายเหตุและเงื่อนไขการรับประกัน
                  <textarea
                    rows="3"
                    value={formModal.notes || ''}
                    onChange={(e) =>
                      setFormModal({ ...formModal, notes: e.target.value })
                    }
                    placeholder="รายละเอียดเงื่อนไขการรับประกันศูนย์..."
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
                  บันทึกข้อมูลรับประกัน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Certificate Preview Modal */}
      {certModal && (
        <div
          className="admin-form-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setCertModal(null);
          }}
        >
          <div className="admin-modal-card" style={{ maxWidth: '580px' }}>
            <div className="warranty-cert-card">
              <div className="cert-header">
                <div>
                  <div className="eyebrow" style={{ color: '#446835' }}>
                    บัตรรับประกันอิเล็กทรอนิกส์
                  </div>
                  <h3 style={{ margin: '4px 0', fontSize: '18px', color: '#1e301c' }}>
                    SolarService Official Warranty
                  </h3>
                  <code style={{ fontSize: '11px', color: '#556950' }}>
                    {certModal.warranty_number}
                  </code>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <ShieldCheck size={38} color="#587b45" />
                </div>
              </div>

              <div className="cert-grid">
                <div>
                  <small style={{ color: '#768774' }}>ผู้ถือบัตรรับประกัน (ลูกค้า)</small>
                  <strong style={{ display: 'block', fontSize: '13px' }}>
                    {certModal.customer_name}
                  </strong>
                  <span style={{ fontSize: '10px', color: '#687766' }}>
                    {certModal.customer_phone || '—'}
                  </span>
                </div>

                <div>
                  <small style={{ color: '#768774' }}>ประเภทและรุ่นอุปกรณ์</small>
                  <strong style={{ display: 'block', fontSize: '13px' }}>
                    {certModal.equipment_model}
                  </strong>
                  <span style={{ fontSize: '10px', color: '#687766' }}>
                    {equipmentLabels[certModal.equipment_type]}
                  </span>
                </div>

                <div>
                  <small style={{ color: '#768774' }}>Serial Number</small>
                  <code style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>
                    {certModal.serial_number}
                  </code>
                </div>

                <div>
                  <small style={{ color: '#768774' }}>ระยะเวลาคุ้มครอง</small>
                  <span style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#27521c' }}>
                    {new Date(certModal.warranty_start).toLocaleDateString('th-TH')} -{' '}
                    {new Date(certModal.warranty_end).toLocaleDateString('th-TH')}
                  </span>
                </div>
              </div>

              {certModal.notes && (
                <div style={{ marginTop: '16px', padding: '10px', background: 'rgba(255,255,255,0.7)', borderRadius: '6px', fontSize: '10px' }}>
                  <strong>เงื่อนไข:</strong> {certModal.notes}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                type="button"
                className="button button-outline"
                onClick={() => setCertModal(null)}
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
