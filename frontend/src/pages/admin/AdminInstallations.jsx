import React, { useState, useMemo } from 'react';
import {
  Wrench,
  Search,
  Filter,
  Download,
  Plus,
  CheckCircle,
  Clock,
  MapPin,
  Calendar,
  ShieldCheck,
  Zap,
  Phone,
  Eye,
  AlertCircle,
  CheckSquare,
  Square,
} from 'lucide-react';

const statusLabels = {
  scheduled: { label: 'นัดหมายแล้ว', tone: 'yellow' },
  preparing: { label: 'จัดเตรียมอุปกรณ์', tone: 'blue' },
  installing: { label: 'กำลังติดตั้งบนหลังคา', tone: 'blue' },
  testing: { label: 'ทดสอบขนานไฟ กฟน./กฟภ.', tone: 'yellow' },
  completed: { label: 'ส่งมอบงานเรียบร้อย', tone: 'green' },
  cancelled: { label: 'ยกเลิกการติดตั้ง', tone: 'gray' },
};

const statusOptions = ['scheduled', 'preparing', 'installing', 'testing', 'completed', 'cancelled'];

export default function AdminInstallations({
  installations,
  technicians,
  onUpdateStatus,
  onSaveInstallation,
  navigate,
  setToast,
}) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [stageModal, setStageModal] = useState(null);
  const [createModal, setCreateModal] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [form, setForm] = useState({
    customer_name: '',
    phone: '',
    address: '',
    quote_number: '',
    system_size_kw: 5.0,
    lead_technician: 'ช่างเอกชัย ช่างใหญ่',
    scheduled_at: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().slice(0, 16),
    notes: 'ติดตั้งแผง 10 แผง และอินเวอร์เตอร์ 5kW พร้อมมิเตอร์ TOU',
  });

  const filtered = useMemo(() => {
    return (installations || []).filter((item) => {
      const matchSearch =
        !search ||
        `${item.installation_number} ${item.customer_name || ''} ${item.address || ''} ${item.lead_technician || ''}`
          .toLowerCase()
          .includes(search.toLowerCase());
      const matchStatus = !filterStatus || item.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [installations, search, filterStatus]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  function handleCreateSubmit(e) {
    e.preventDefault();
    if (!form.customer_name || !form.address) {
      alert('กรุณากรอกชื่อลูกค้าและสถานที่ติดตั้ง');
      return;
    }
    onSaveInstallation({
      ...form,
      system_size_kw: Number(form.system_size_kw) || 5,
    });
    setCreateModal(false);
    if (setToast) setToast('สร้างนัดหมายงานติดตั้งใหม่เรียบร้อยแล้ว');
  }

  function toggleStage(stageKey) {
    if (!stageModal) return;
    const nextStages = {
      ...stageModal.stages,
      [stageKey]: !stageModal.stages?.[stageKey],
    };
    const allDone = Object.values(nextStages).every(Boolean);
    const nextStatus = allDone ? 'completed' : stageModal.status;

    onUpdateStatus(stageModal.id, nextStatus, { stages: nextStages });
    setStageModal({ ...stageModal, stages: nextStages, status: nextStatus });
    if (setToast) setToast('อัปเดตขั้นตอนการทำงานเรียบร้อย');
  }

  function exportCSV() {
    const headers = ['เลขที่งานติดตั้ง', 'ชื่อลูกค้า', 'เบอร์โทร', 'สถานที่ติดตั้ง', 'ขนาดระบบ (kW)', 'หัวหน้าทีมช่าง', 'วันนัดติดตั้ง', 'สถานะ'];
    const rows = filtered.map((inst) => [
      `"${inst.installation_number}"`,
      `"${inst.customer_name || ''}"`,
      `"${inst.phone || ''}"`,
      `"${inst.address || ''}"`,
      inst.system_size_kw || 5,
      `"${inst.lead_technician || ''}"`,
      `"${new Date(inst.scheduled_at).toLocaleString('th-TH')}"`,
      `"${statusLabels[inst.status]?.label || inst.status}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SolarService_Installations_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="admin-installations-view">
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <span style={{ background: '#eaf4e6', color: '#447233' }}><Wrench size={16} /></span>
          <small>ไซต์งานติดตั้งทั้งหมด</small>
          <strong>{(installations || []).length} ไซต์งาน</strong>
          <span style={{ fontSize: '9px', color: '#687766' }}>ระบบโครงการ</span>
        </div>
        <div className="stat-card">
          <span style={{ background: '#fff5e6', color: '#b5791a' }}><Clock size={16} /></span>
          <small>นัดหมาย & เตรียมอุปกรณ์</small>
          <strong>{(installations || []).filter((i) => ['scheduled', 'preparing'].includes(i.status)).length} ไซต์งาน</strong>
          <span style={{ fontSize: '9px', color: '#b5791a' }}>งานล่วงหน้า</span>
        </div>
        <div className="stat-card">
          <span style={{ background: '#eaf1f8', color: '#33628e' }}><Zap size={16} /></span>
          <small>กำลังติดตั้ง / ทดสอบระบบ</small>
          <strong>{(installations || []).filter((i) => ['installing', 'testing'].includes(i.status)).length} ไซต์งาน</strong>
          <span style={{ fontSize: '9px', color: '#33628e' }}>ช่างกำลังปฏิบัติงาน</span>
        </div>
        <div className="stat-card">
          <span style={{ background: '#f5ebfa', color: '#6a3692' }}><CheckCircle size={16} /></span>
          <small>ส่งมอบงานสำเร็จ 100%</small>
          <strong>{(installations || []).filter((i) => i.status === 'completed').length} ไซต์งาน</strong>
          <span style={{ fontSize: '9px', color: '#587b45' }}>ออกใบรับประกันแล้ว</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="admin-toolbar" style={{ marginTop: '16px' }}>
        <div className="admin-toolbar-left">
          <div className="admin-search-box">
            <Search size={14} color="#788775" />
            <input
              type="text"
              placeholder="ค้นหาเลขที่ติดตั้ง, ลูกค้า, สถานที่, หัวหน้าช่าง..."
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
            <option value="">ทุกสถานะงานติดตั้ง</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>{statusLabels[s]?.label || s}</option>
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
            <Plus size={14} /> สร้างนัดหมายงานติดตั้งใหม่
          </button>
        </div>
      </div>

      {/* Installations Table */}
      <div className="admin-table">
        <div
          className="admin-table-head"
          style={{ gridTemplateColumns: 'minmax(140px, 1.2fr) minmax(130px, 1.1fr) minmax(130px, 1.1fr) minmax(120px, 1fr) minmax(130px, 1.1fr) minmax(120px, 1fr)' }}
        >
          <span>เลขที่ติดตั้ง / วันที่</span>
          <span>ลูกค้า & เบอร์โทร</span>
          <span>วันเวลานัดติดตั้ง</span>
          <span>หัวหน้าทีมช่าง</span>
          <span>สถานะงาน</span>
          <span>การจัดการ</span>
        </div>

        {paginated.length ? (
          paginated.map((inst) => (
            <div
              key={inst.id}
              className="admin-table-row"
              style={{ gridTemplateColumns: 'minmax(140px, 1.2fr) minmax(130px, 1.1fr) minmax(130px, 1.1fr) minmax(120px, 1fr) minmax(130px, 1.1fr) minmax(120px, 1fr)' }}
            >
              <div>
                <strong>{inst.installation_number}</strong>
                <small style={{ color: '#7c8b7a', fontSize: '10px' }}>
                  ระบบ {inst.system_size_kw || 5} kW
                </small>
              </div>

              <div>
                <strong>{inst.customer_name || 'ลูกค้าทั่วไป'}</strong>
                <small style={{ color: '#587b45', fontSize: '10px' }}>
                  {inst.phone || '—'}
                </small>
              </div>

              <div>
                <span>{new Date(inst.scheduled_at).toLocaleDateString('th-TH')}</span>
                <small style={{ color: '#274b1c', fontWeight: '600', fontSize: '10px', display: 'block' }}>
                  เวลา {new Date(inst.scheduled_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                </small>
              </div>

              <div>
                <span className="status-pill blue" style={{ fontSize: '9px' }}>
                  {inst.lead_technician || 'ยังไม่กำหนด'}
                </span>
              </div>

              <div>
                <select
                  className="admin-select"
                  value={inst.status}
                  onChange={(e) => onUpdateStatus(inst.id, e.target.value)}
                  style={{ fontSize: '9px', padding: '5px 7px' }}
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>{statusLabels[s]?.label || s}</option>
                  ))}
                </select>
              </div>

              <div>
                <button
                  type="button"
                  className="button button-outline small-button"
                  onClick={() => setStageModal(inst)}
                >
                  <Eye size={12} /> ขั้นตอน & รายละเอียด
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="admin-empty">ไม่พบข้อมูลงานติดตั้งที่ตรงกับเงื่อนไข</p>
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

      {/* Stage Tracking & Detail Modal */}
      {stageModal && (
        <div
          className="admin-form-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setStageModal(null);
          }}
        >
          <div className="admin-modal-card" style={{ maxWidth: '640px' }}>
            <div className="admin-modal-header">
              <div>
                <h2>ควบคุมงานติดตั้ง {stageModal.installation_number}</h2>
                <p>ระบบโซลาร์เซลล์ {stageModal.system_size_kw || 5} kW · ลูกค้า: {stageModal.customer_name}</p>
              </div>
              <button
                type="button"
                className="icon-action"
                onClick={() => setStageModal(null)}
              >
                ×
              </button>
            </div>

            {/* Site Info Box */}
            <div style={{ background: '#f8faf6', padding: '14px', borderRadius: '7px', marginBottom: '18px', fontSize: '11px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div><strong>สถานที่ติดตั้ง:</strong> {stageModal.address || '—'}</div>
                <div><strong>เบอร์ติดต่อหน้างาน:</strong> {stageModal.phone || '—'}</div>
                <div><strong>วันนัดหมายติดตั้ง:</strong> {new Date(stageModal.scheduled_at).toLocaleString('th-TH')}</div>
                <div><strong>หัวหน้าช่าง:</strong> {stageModal.lead_technician || '—'}</div>
              </div>
            </div>

            {/* Stages Checklist */}
            <h3 style={{ fontSize: '13px', margin: '0 0 10px', color: '#273826' }}>
              รายการตรวจสอบความคืบหน้าหน้างาน (Work Stages Checklist)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
              {[
                { key: 'site_ready', label: '1. ตรวจสอบพื้นที่หน้างานและความพร้อมโครงสร้างหลังคา' },
                { key: 'equipment_delivered', label: '2. จัดส่งแผงโซลาร์เซลล์และอินเวอร์เตอร์ถึงหน้างาน' },
                { key: 'panels_mounted', label: '3. ติดตั้งโครงสร้างยึดและประกอบแผงโซลาร์เซลล์บนหลังคา' },
                { key: 'inverter_wired', label: '4. ติดตั้งตู้ Combiner Box และเดินสายไฟ AC/DC เข้าอินเวอร์เตอร์' },
                { key: 'grid_tested', label: '5. ทดสอบการผลิตไฟและระบบความปลอดภัยขนานไฟ (Commissioning)' },
              ].map((stage) => {
                const isChecked = Boolean(stageModal.stages?.[stage.key]);
                return (
                  <button
                    key={stage.key}
                    type="button"
                    onClick={() => toggleStage(stage.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      background: isChecked ? '#edf5ea' : '#fcfdfb',
                      border: `1px solid ${isChecked ? '#b8d8ad' : '#e2e8de'}`,
                      borderRadius: '7px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '11px',
                      color: isChecked ? '#28461f' : '#495847',
                      fontWeight: isChecked ? '600' : 'normal',
                    }}
                  >
                    {isChecked ? <CheckSquare size={16} color="#457034" /> : <Square size={16} color="#9aa797" />}
                    <span>{stage.label}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #edf1e9', paddingTop: '16px' }}>
              <button
                type="button"
                className="button button-green small-button"
                onClick={() => {
                  setStageModal(null);
                  navigate('/warranties');
                }}
              >
                <ShieldCheck size={13} /> ไปหน้าออกใบรับประกันสินค้า
              </button>

              <button
                type="button"
                className="button button-outline"
                onClick={() => setStageModal(null)}
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Installation Modal */}
      {createModal && (
        <div
          className="admin-form-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setCreateModal(false);
          }}
        >
          <form className="admin-product-form" onSubmit={handleCreateSubmit} style={{ maxWidth: '600px' }}>
            <div className="workspace-section-heading">
              <div>
                <h2>สร้างนัดหมายงานติดตั้งใหม่</h2>
                <p>วางแผนคิวงานติดตั้งสำหรับลูกค้าที่อนุมัติใบเสนอราคาแล้ว</p>
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
                เบอร์โทรศัพท์ติดต่อ
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="081-234-5678"
                />
              </label>

              <label>
                อ้างอิงใบเสนอราคา (ถ้ามี)
                <input
                  type="text"
                  value={form.quote_number}
                  onChange={(e) => setForm({ ...form, quote_number: e.target.value })}
                  placeholder="QT-202611-0088"
                />
              </label>

              <label>
                ขนาดระบบโซลาร์ (kW) *
                <select
                  className="admin-filter-select"
                  value={form.system_size_kw}
                  onChange={(e) => setForm({ ...form, system_size_kw: Number(e.target.value) })}
                >
                  <option value={3.0}>3.0 kW</option>
                  <option value={5.0}>5.0 kW</option>
                  <option value={10.0}>10.0 kW</option>
                  <option value={15.0}>15.0 kW</option>
                </select>
              </label>

              <label>
                หัวหน้าทีมช่างติดตั้ง *
                <select
                  className="admin-filter-select"
                  value={form.lead_technician}
                  onChange={(e) => setForm({ ...form, lead_technician: e.target.value })}
                >
                  {(technicians || []).map((t) => (
                    <option key={t.id} value={t.full_name}>{t.full_name}</option>
                  ))}
                  <option value="ช่างเอกชัย ช่างใหญ่">ช่างเอกชัย ช่างใหญ่</option>
                  <option value="ช่างสมศักดิ์ สายตรวจ">ช่างสมศักดิ์ สายตรวจ</option>
                </select>
              </label>

              <label>
                วันเวลานัดหมายเข้าติดตั้ง *
                <input
                  type="datetime-local"
                  required
                  value={form.scheduled_at}
                  onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                />
              </label>

              <label className="full-width">
                สถานที่และที่อยู่ติดตั้งอย่างละเอียด *
                <textarea
                  rows="2"
                  required
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="ระบุสถานที่ติดตั้ง..."
                />
              </label>

              <label className="full-width">
                รายละเอียดอุปกรณ์และหมายเหตุ
                <textarea
                  rows="2"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
                สร้างนัดหมายติดตั้ง
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

