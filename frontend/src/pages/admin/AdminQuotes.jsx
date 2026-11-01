import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  Download,
  Plus,
  CheckCircle,
  Clock,
  Printer,
  Eye,
  AlertCircle,
  Zap,
  Wrench,
  Percent,
} from 'lucide-react';
import { Money } from '../../components/Shared.jsx';

const statusLabels = {
  draft: { label: 'ฉบับร่าง', tone: 'gray' },
  sent: { label: 'ส่งให้ลูกค้าแล้ว', tone: 'blue' },
  approved: { label: 'ลูกค้าอนุมัติแล้ว', tone: 'green' },
  rejected: { label: 'ปฏิเสธข้อเสนอ', tone: 'red' },
  expired: { label: 'หมดอายุแล้ว', tone: 'gray' },
};

const statusOptions = ['draft', 'sent', 'approved', 'rejected', 'expired'];

export default function AdminQuotes({ quotes, onUpdateStatus, onSaveQuote, navigate, setToast }) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sheetModal, setSheetModal] = useState(null);
  const [createModal, setCreateModal] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    booking_number: '',
    system_size_kw: 5.0,
    total: 149000,
    discount: 0,
    valid_until: new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    description: 'แพ็กเกจติดตั้งโซลาร์รูฟท็อป 5 kW ครบวงจร (แผง LONGi 580W 10 แผง + Huawei 5kW Inverter)',
    notes: 'ราคารวมบริการขออนุญาตขนานไฟ กฟน./กฟภ. ติดตั้งมิเตอร์ TOU และบริการล้างแผงฟรี 2 ปี',
  });

  const filtered = useMemo(() => {
    return (quotes || []).filter((q) => {
      const matchSearch =
        !search ||
        `${q.quote_number} ${q.customer_name || ''} ${q.booking_number || ''}`
          .toLowerCase()
          .includes(search.toLowerCase());
      const matchStatus = !filterStatus || q.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [quotes, search, filterStatus]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const totalQuotedValue = useMemo(() => {
    return (quotes || []).reduce((acc, cur) => acc + Number(cur.total || 0), 0);
  }, [quotes]);

  function handleCreateSubmit(e) {
    e.preventDefault();
    if (!form.customer_name || !form.total) {
      alert('กรุณากรอกชื่อลูกค้าและยอดรวมใบเสนอราคา');
      return;
    }
    const netTotal = Math.max(0, Number(form.total) - Number(form.discount || 0));
    const payload = {
      ...form,
      total: Number(form.total),
      discount: Number(form.discount || 0),
      net_total: netTotal,
      system_size_kw: Number(form.system_size_kw) || 5,
      items: [
        { description: form.description, amount: Number(form.total) },
      ],
      status: 'sent',
    };
    onSaveQuote(payload);
    setCreateModal(false);
    if (setToast) setToast('ออกใบเสนอราคาใหม่เรียบร้อยแล้ว');
  }

  function exportCSV() {
    const headers = ['เลขที่ใบเสนอราคา', 'ชื่อลูกค้า', 'อ้างอิงการจอง', 'ขนาดระบบ (kW)', 'ยอดรวม (บาท)', 'ส่วนลด (บาท)', 'ยอดสุทธิ (บาท)', 'สถานะ', 'ใช้ได้ถึงวันที่'];
    const rows = filtered.map((q) => [
      `"${q.quote_number}"`,
      `"${q.customer_name || ''}"`,
      `"${q.booking_number || ''}"`,
      q.system_size_kw || 5,
      q.total || 0,
      q.discount || 0,
      q.net_total || q.total || 0,
      `"${statusLabels[q.status]?.label || q.status}"`,
      `"${q.valid_until || ''}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SolarService_Quotations_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="admin-quotes-view">
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <span style={{ background: '#eaf4e6', color: '#447233' }}><FileText size={16} /></span>
          <small>ใบเสนอราคาทั้งหมด</small>
          <strong>{(quotes || []).length} ฉบับ</strong>
          <span style={{ fontSize: '9px', color: '#687766' }}>ในระบบฝ่ายขาย</span>
        </div>
        <div className="stat-card">
          <span style={{ background: '#eaf1f8', color: '#33628e' }}><Clock size={16} /></span>
          <small>ส่งแล้ว / รอการตัดสินใจ</small>
          <strong>{(quotes || []).filter((q) => q.status === 'sent').length} ฉบับ</strong>
          <span style={{ fontSize: '9px', color: '#33628e' }}>ติดตามผลลูกค้า</span>
        </div>
        <div className="stat-card">
          <span style={{ background: '#f5ebfa', color: '#6a3692' }}><CheckCircle size={16} /></span>
          <small>ลูกค้าอนุมัติแล้ว (Approved)</small>
          <strong>{(quotes || []).filter((q) => q.status === 'approved').length} ฉบับ</strong>
          <span style={{ fontSize: '9px', color: '#587b45' }}>พร้อมนัดวันติดตั้ง</span>
        </div>
        <div className="stat-card">
          <span style={{ background: '#fff5e6', color: '#b5791a' }}><Zap size={16} /></span>
          <small>มูลค่างานเสนอราคารวม</small>
          <strong>฿ {totalQuotedValue.toLocaleString('th-TH')}</strong>
          <span style={{ fontSize: '9px', color: '#687766' }}>ประมาณการยอดขาย</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="admin-toolbar" style={{ marginTop: '16px' }}>
        <div className="admin-toolbar-left">
          <div className="admin-search-box">
            <Search size={14} color="#788775" />
            <input
              type="text"
              placeholder="ค้นหาเลขที่ใบเสนอราคา, ลูกค้า, การจอง..."
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
            <option value="">ทุกสถานะใบเสนอราคา</option>
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
            <Plus size={14} /> ออกใบเสนอราคาใหม่ (Create Quote)
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="admin-table">
        <div
          className="admin-table-head"
          style={{ gridTemplateColumns: 'minmax(140px, 1.2fr) minmax(130px, 1.1fr) minmax(100px, 0.8fr) minmax(120px, 1fr) minmax(130px, 1.1fr) minmax(120px, 1fr)' }}
        >
          <span>เลขที่ใบเสนอราคา</span>
          <span>ลูกค้า & เบอร์โทร</span>
          <span>ขนาดระบบ</span>
          <span>ยอดสุทธิ</span>
          <span>สถานะ</span>
          <span>การจัดการ</span>
        </div>

        {paginated.length ? (
          paginated.map((quote) => {
            const netAmount = quote.net_total || quote.total;
            return (
              <div
                key={quote.id}
                className="admin-table-row"
                style={{ gridTemplateColumns: 'minmax(140px, 1.2fr) minmax(130px, 1.1fr) minmax(100px, 0.8fr) minmax(120px, 1fr) minmax(130px, 1.1fr) minmax(120px, 1fr)' }}
              >
                <div>
                  <strong>{quote.quote_number}</strong>
                  <small style={{ color: '#7c8b7a', fontSize: '10px' }}>
                    อ้างอิง: {quote.booking_number || 'โทรศัพท์'}
                  </small>
                </div>

                <div>
                  <strong>{quote.customer_name || 'ลูกค้าทั่วไป'}</strong>
                  <small style={{ color: '#587b45', fontSize: '10px' }}>
                    {quote.customer_phone || '—'}
                  </small>
                </div>

                <div>
                  <span className="status-pill blue" style={{ fontSize: '9px' }}>
                    {quote.system_size_kw || 5} kW
                  </span>
                </div>

                <div>
                  <strong style={{ color: '#274b1c' }}><Money value={netAmount} /></strong>
                  {quote.discount > 0 && (
                    <small style={{ color: '#b54333', fontSize: '9px', display: 'block' }}>
                      (ลด <Money value={quote.discount} />)
                    </small>
                  )}
                </div>

                <div>
                  <select
                    className="admin-select"
                    value={quote.status}
                    onChange={(e) => onUpdateStatus(quote.id, e.target.value)}
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
                    onClick={() => setSheetModal(quote)}
                  >
                    <Eye size={12} /> ดูใบเสนอราคา
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <p className="admin-empty">ไม่พบข้อมูลใบเสนอราคาที่ตรงกับเงื่อนไข</p>
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

      {/* Official Quotation Sheet Modal */}
      {sheetModal && (
        <div
          className="admin-form-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSheetModal(null);
          }}
        >
          <div className="admin-modal-card" style={{ maxWidth: '680px', padding: '28px' }}>
            {/* Sheet Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #334832', paddingBottom: '16px', marginBottom: '18px' }}>
              <div>
                <span style={{ fontSize: '18px', fontWeight: '800', color: '#273825', letterSpacing: '-0.5px' }}>
                  solar<span style={{ color: '#587b45' }}>service</span>
                </span>
                <p style={{ margin: '3px 0 0', fontSize: '10px', color: '#687766' }}>
                  บริษัท โซลาร์เซอร์วิส พาวเวอร์ จำกัด (สำนักงานใหญ่)<br />
                  โทร. 02-123-4567 · อีเมล: sales@solarservice.co.th
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span className="status-pill green" style={{ fontSize: '11px', fontWeight: '700' }}>
                  ใบเสนอราคา (QUOTATION)
                </span>
                <div style={{ marginTop: '6px', fontSize: '11px', color: '#2b3b28' }}>
                  <strong>เลขที่:</strong> {sheetModal.quote_number}<br />
                  <strong>วันที่:</strong> {new Date(sheetModal.created_at).toLocaleDateString('th-TH')}<br />
                  <strong style={{ color: '#a03b30' }}>ใช้ได้ถึง:</strong> {sheetModal.valid_until}
                </div>
              </div>
            </div>

            {/* Customer Box */}
            <div style={{ background: '#f8faf6', padding: '12px 16px', borderRadius: '7px', marginBottom: '18px', fontSize: '11px' }}>
              <strong>เรียน ลูกค้าผู้มีอุปการคุณ:</strong> {sheetModal.customer_name || 'คุณลูกค้า'}<br />
              <span>เบอร์โทรศัพท์ติดต่อ: {sheetModal.customer_phone || '—'}</span><br />
              <span>อ้างอิงการสำรวจ: {sheetModal.booking_number || 'การปรึกษาออนไลน์'}</span>
            </div>

            {/* Quotation Items Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: '18px' }}>
              <thead>
                <tr style={{ background: '#edf3e8', color: '#2d3d2a' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left', borderRadius: '4px 0 0 4px' }}>ลำดับ</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left' }}>รายการและรายละเอียดระบบ</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>ขนาด (kW)</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', borderRadius: '0 4px 4px 0' }}>จำนวนเงิน (บาท)</th>
                </tr>
              </thead>
              <tbody>
                {(sheetModal.items || [
                  { description: `ระบบโซลาร์เซลล์ ${sheetModal.system_size_kw || 5} kW ครบวงจรพร้อมติดตั้ง`, amount: sheetModal.total },
                ]).map((it, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #edf1e9' }}>
                    <td style={{ padding: '10px' }}>{idx + 1}</td>
                    <td style={{ padding: '10px' }}>
                      <strong>{it.description}</strong>
                      <p style={{ margin: '3px 0 0', fontSize: '10px', color: '#687766' }}>
                        {sheetModal.notes || 'รับประกันงานติดตั้ง 5 ปี ประกันแผง 25 ปี ดำเนินการขอขนานไฟให้ครบถ้วน'}
                      </p>
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>{sheetModal.system_size_kw || 5} kW</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: '700' }}>
                      <Money value={it.amount} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Calculation Breakdown */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
              <div style={{ width: '240px', fontSize: '11px', lineHeight: '1.8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>ยอดรวม (Subtotal):</span>
                  <strong><Money value={sheetModal.total} /></strong>
                </div>
                {sheetModal.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b53b2d' }}>
                    <span>ส่วนลดพิเศษ:</span>
                    <strong>- <Money value={sheetModal.discount} /></strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #334832', paddingTop: '6px', fontSize: '13px', color: '#274b1c' }}>
                  <strong>ยอดสุทธิ (Net Total):</strong>
                  <strong><Money value={sheetModal.net_total || sheetModal.total - (sheetModal.discount || 0)} /></strong>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #edf1e9', paddingTop: '16px' }}>
              <button
                type="button"
                className="button button-green small-button"
                onClick={() => {
                  setSheetModal(null);
                  navigate('/installations');
                }}
              >
                <Wrench size={13} /> สร้างงานติดตั้งจากใบเสนอนี้
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="button button-outline"
                  onClick={() => window.print()}
                >
                  <Printer size={13} /> พิมพ์ใบเสนอราคา
                </button>
                <button
                  type="button"
                  className="button button-dark"
                  onClick={() => setSheetModal(null)}
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Quote Modal */}
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
                <h2>ออกใบเสนอราคาใหม่ (Create Quotation)</h2>
                <p>คำนวณและสร้างเอกสารเสนอราคาสำหรับลูกค้า</p>
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
                เบอร์โทรติดต่อ
                <input
                  type="tel"
                  value={form.customer_phone}
                  onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                  placeholder="081-234-5678"
                />
              </label>

              <label>
                อ้างอิงเลขที่การจอง (ถ้ามี)
                <input
                  type="text"
                  value={form.booking_number}
                  onChange={(e) => setForm({ ...form, booking_number: e.target.value })}
                  placeholder="BK-202611-0081"
                />
              </label>

              <label>
                ขนาดระบบโซลาร์ (kW) *
                <select
                  className="admin-filter-select"
                  value={form.system_size_kw}
                  onChange={(e) => setForm({ ...form, system_size_kw: Number(e.target.value) })}
                >
                  <option value={3.0}>3.0 kW (ระบบขนาดเล็ก)</option>
                  <option value={5.0}>5.0 kW (ระบบยอดนิยม)</option>
                  <option value={10.0}>10.0 kW (ระบบขนาดใหญ่ 3-Phase)</option>
                  <option value={15.0}>15.0 kW (สำหรับธุรกิจ/บ้านขนาดใหญ่มาก)</option>
                </select>
              </label>

              <label>
                ยอดรวมราคาเสนอ (บาท) *
                <input
                  type="number"
                  required
                  min="0"
                  step="100"
                  value={form.total}
                  onChange={(e) => setForm({ ...form, total: e.target.value })}
                />
              </label>

              <label>
                ส่วนลดพิเศษ (บาท)
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={form.discount}
                  onChange={(e) => setForm({ ...form, discount: e.target.value })}
                />
              </label>

              <label className="full-width">
                ใช้ได้ถึงวันที่ (Valid Until) *
                <input
                  type="date"
                  required
                  value={form.valid_until}
                  onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
                />
              </label>

              <label className="full-width">
                รายละเอียดรายการและอุปกรณ์
                <textarea
                  rows="2"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </label>

              <label className="full-width">
                เงื่อนไขและการรับประกัน
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
                สร้างใบเสนอราคา
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

