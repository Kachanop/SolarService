import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  Download,
  Truck,
  CheckCircle,
  Clock,
  Package,
  Eye,
  AlertCircle,
  ExternalLink,
  Phone,
  MapPin,
  Calendar,
} from 'lucide-react';
import { Money } from '../../components/Shared.jsx';

const statusLabels = {
  pending: { label: 'รอชำระ/ตรวจสลิป', tone: 'yellow' },
  confirmed: { label: 'ยืนยันแล้ว', tone: 'blue' },
  processing: { label: 'กำลังเตรียมสินค้า', tone: 'blue' },
  shipped: { label: 'จัดส่งแล้ว', tone: 'green' },
  completed: { label: 'จัดส่งสำเร็จ', tone: 'green' },
  cancelled: { label: 'ยกเลิกคำสั่งซื้อ', tone: 'gray' },
};

const statusOptions = ['pending', 'confirmed', 'processing', 'shipped', 'completed', 'cancelled'];

export default function AdminOrders({ orders, onUpdateStatus, setToast }) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [detailModal, setDetailModal] = useState(null);
  const [trackingInput, setTrackingInput] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => {
    return (orders || []).filter((o) => {
      const matchSearch =
        !search ||
        `${o.order_number} ${o.shipping_name || ''} ${o.phone || ''} ${o.tracking_number || ''}`
          .toLowerCase()
          .includes(search.toLowerCase());
      const matchStatus = !filterStatus || o.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [orders, search, filterStatus]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const totalRevenue = useMemo(() => {
    return (orders || [])
      .filter((o) => o.status !== 'cancelled')
      .reduce((acc, cur) => acc + Number(cur.total || 0), 0);
  }, [orders]);

  function handleStatusChange(order, newStatus) {
    onUpdateStatus(order.id, newStatus);
    if (setToast) setToast(`อัปเดตสถานะคำสั่งซื้อ ${order.order_number} เป็น "${statusLabels[newStatus]?.label || newStatus}"`);
  }

  function handleSaveTracking(order) {
    onUpdateStatus(order.id, order.status, { tracking_number: trackingInput.trim() });
    setDetailModal({ ...order, tracking_number: trackingInput.trim() });
    if (setToast) setToast(`บันทึกเลขพัสดุ ${trackingInput.trim()} เรียบร้อยแล้ว`);
  }

  function exportCSV() {
    const headers = ['เลขที่คำสั่งซื้อ', 'ชื่อผู้รับ', 'เบอร์โทร', 'ที่อยู่จัดส่ง', 'ยอดรวม (บาท)', 'วิธีชำระเงิน', 'สถานะ', 'เลขพัสดุ', 'สั่งซื้อเมื่อ'];
    const rows = filtered.map((o) => [
      `"${o.order_number}"`,
      `"${o.shipping_name || ''}"`,
      `"${o.phone || ''}"`,
      `"${o.shipping_address || ''}"`,
      o.total || 0,
      `"${o.payment_method || ''}"`,
      `"${statusLabels[o.status]?.label || o.status}"`,
      `"${o.tracking_number || ''}"`,
      `"${new Date(o.created_at).toLocaleDateString('th-TH')}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SolarService_Orders_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="admin-orders-view">
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <span style={{ background: '#eaf4e6', color: '#447233' }}><ShoppingBag size={16} /></span>
          <small>คำสั่งซื้อทั้งหมด</small>
          <strong>{(orders || []).length} ออเดอร์</strong>
          <span style={{ fontSize: '9px', color: '#687766' }}>ในระบบอีคอมเมิร์ซ</span>
        </div>
        <div className="stat-card">
          <span style={{ background: '#fff5e6', color: '#b5791a' }}><Clock size={16} /></span>
          <small>รอดำเนินการ / เตรียมของ</small>
          <strong>
            {(orders || []).filter((o) => ['pending', 'confirmed', 'processing'].includes(o.status)).length} ออเดอร์
          </strong>
          <span style={{ fontSize: '9px', color: '#b5791a' }}>ต้องจัดส่ง</span>
        </div>
        <div className="stat-card">
          <span style={{ background: '#eaf1f8', color: '#33628e' }}><Truck size={16} /></span>
          <small>อยู่ระหว่างจัดส่ง</small>
          <strong>{(orders || []).filter((o) => o.status === 'shipped').length} ออเดอร์</strong>
          <span style={{ fontSize: '9px', color: '#33628e' }}>ขนส่งพัสดุ</span>
        </div>
        <div className="stat-card">
          <span style={{ background: '#f5ebfa', color: '#6a3692' }}><CheckCircle size={16} /></span>
          <small>ยอดขายรวมจากออเดอร์</small>
          <strong>฿ {totalRevenue.toLocaleString('th-TH')}</strong>
          <span style={{ fontSize: '9px', color: '#587b45' }}>ไม่รวมงานติดตั้ง</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="admin-toolbar" style={{ marginTop: '16px' }}>
        <div className="admin-toolbar-left">
          <div className="admin-search-box">
            <Search size={14} color="#788775" />
            <input
              type="text"
              placeholder="ค้นหาเลขที่คำสั่งซื้อ, ผู้รับ, เบอร์โทร, เลขพัสดุ..."
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
            <option value="">ทุกสถานะคำสั่งซื้อ</option>
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
        </div>
      </div>

      {/* Orders Table */}
      <div className="admin-table">
        <div
          className="admin-table-head"
          style={{ gridTemplateColumns: 'minmax(140px, 1.2fr) minmax(140px, 1.2fr) minmax(130px, 1fr) minmax(110px, 0.9fr) minmax(130px, 1fr) minmax(110px, 0.9fr)' }}
        >
          <span>เลขที่คำสั่งซื้อ / วันที่</span>
          <span>ผู้รับ & เบอร์โทร</span>
          <span>ยอดรวม</span>
          <span>การจัดส่ง (Tracking)</span>
          <span>สถานะออเดอร์</span>
          <span>การจัดการ</span>
        </div>

        {paginated.length ? (
          paginated.map((order) => {
            const st = statusLabels[order.status] || { label: order.status, tone: 'gray' };
            return (
              <div
                key={order.id}
                className="admin-table-row"
                style={{ gridTemplateColumns: 'minmax(140px, 1.2fr) minmax(140px, 1.2fr) minmax(130px, 1fr) minmax(110px, 0.9fr) minmax(130px, 1fr) minmax(110px, 0.9fr)' }}
              >
                <div>
                  <strong>{order.order_number}</strong>
                  <small style={{ color: '#7c8b7a', fontSize: '10px' }}>
                    {new Date(order.created_at).toLocaleDateString('th-TH')}
                  </small>
                </div>

                <div>
                  <strong>{order.shipping_name || 'ไม่ระบุชื่อ'}</strong>
                  <small style={{ color: '#587b45', fontSize: '10px' }}>
                    {order.phone || '—'}
                  </small>
                </div>

                <div>
                  <strong style={{ color: '#274b1c' }}><Money value={order.total} /></strong>
                  <small style={{ color: '#7a8878', fontSize: '10px', display: 'block' }}>
                    {order.payment_method === 'bank_transfer' ? 'โอนเงินธนาคาร' : 'ชำระออนไลน์'}
                  </small>
                </div>

                <div>
                  {order.tracking_number ? (
                    <span className="status-pill green" style={{ fontSize: '9px' }}>
                      <Truck size={10} style={{ display: 'inline', marginRight: '3px' }} />
                      {order.tracking_number}
                    </span>
                  ) : (
                    <span style={{ fontSize: '10px', color: '#97a395' }}>ยังไม่มีเลขพัสดุ</span>
                  )}
                </div>

                <div>
                  <select
                    className="admin-select"
                    value={order.status}
                    onChange={(e) => handleStatusChange(order, e.target.value)}
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
                    onClick={() => {
                      setDetailModal(order);
                      setTrackingInput(order.tracking_number || '');
                    }}
                  >
                    <Eye size={12} /> รายละเอียด
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <p className="admin-empty">ไม่พบข้อมูลคำสั่งซื้อที่ตรงกับเงื่อนไข</p>
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

      {/* Order Detail Modal */}
      {detailModal && (
        <div
          className="admin-form-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDetailModal(null);
          }}
        >
          <div className="admin-modal-card" style={{ maxWidth: '640px' }}>
            <div className="admin-modal-header">
              <div>
                <h2>รายละเอียดคำสั่งซื้อ {detailModal.order_number}</h2>
                <p>สั่งซื้อเมื่อ {new Date(detailModal.created_at).toLocaleString('th-TH')}</p>
              </div>
              <button
                type="button"
                className="icon-action"
                onClick={() => setDetailModal(null)}
              >
                ×
              </button>
            </div>

            {/* Customer & Shipping Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', background: '#f8faf6', padding: '14px', borderRadius: '8px', marginBottom: '16px' }}>
              <div>
                <strong style={{ fontSize: '12px', color: '#273825', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <MapPin size={13} color="#557945" /> ข้อมูลการจัดส่ง
                </strong>
                <div style={{ marginTop: '6px', fontSize: '11px', color: '#4d5d4a' }}>
                  <div><strong>ชื่อผู้รับ:</strong> {detailModal.shipping_name || '—'}</div>
                  <div><strong>เบอร์โทรศัพท์:</strong> {detailModal.phone || '—'}</div>
                  <div style={{ marginTop: '4px', lineHeight: '1.4' }}>
                    <strong>ที่อยู่:</strong> {detailModal.shipping_address || '—'}
                  </div>
                </div>
              </div>

              <div>
                <strong style={{ fontSize: '12px', color: '#273825', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Truck size={13} color="#557945" /> การติดตามพัสดุ
                </strong>
                <div style={{ marginTop: '8px' }}>
                  <label style={{ fontSize: '10px', color: '#687766', display: 'block', marginBottom: '4px' }}>
                    เลขพัสดุจัดส่ง (Tracking No.)
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      placeholder="เช่น KERRY-123456"
                      value={trackingInput}
                      onChange={(e) => setTrackingInput(e.target.value)}
                      style={{ fontSize: '11px', padding: '5px 8px', borderRadius: '5px', border: '1px solid #ced8c9', flex: 1 }}
                    />
                    <button
                      type="button"
                      className="button button-green small-button"
                      onClick={() => handleSaveTracking(detailModal)}
                    >
                      บันทึก
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <h3 style={{ fontSize: '13px', margin: '0 0 8px', color: '#2b3b29' }}>รายการสินค้าในคำสั่งซื้อ</h3>
            <div className="admin-table" style={{ marginBottom: '16px' }}>
              <div
                className="admin-table-head"
                style={{ gridTemplateColumns: 'minmax(200px, 2fr) minmax(80px, 0.8fr) minmax(90px, 1fr) minmax(100px, 1fr)' }}
              >
                <span>สินค้า</span>
                <span>จำนวน</span>
                <span>ราคา/ชิ้น</span>
                <span>ยอดรวม</span>
              </div>
              {(detailModal.items || [
                { name: 'สินค้าตามคำสั่งซื้อ', quantity: 1, price: detailModal.total, subtotal: detailModal.total },
              ]).map((it, idx) => (
                <div
                  key={idx}
                  className="admin-table-row"
                  style={{ gridTemplateColumns: 'minmax(200px, 2fr) minmax(80px, 0.8fr) minmax(90px, 1fr) minmax(100px, 1fr)' }}
                >
                  <div>
                    <strong>{it.name}</strong>
                    {it.sku && <small style={{ color: '#889686' }}>{it.sku}</small>}
                  </div>
                  <span>{it.quantity} ชิ้น</span>
                  <span><Money value={it.price} /></span>
                  <strong><Money value={it.subtotal || it.price * it.quantity} /></strong>
                </div>
              ))}
            </div>

            {/* Total and Notes */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#eef5ea', borderRadius: '7px' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#566a53' }}>
                  สถานะการชำระเงิน: <strong>{detailModal.payment_status === 'paid' ? 'ชำระเงินแล้ว' : 'รอตรวจสอบชำระเงิน'}</strong>
                </span>
                {detailModal.notes && (
                  <div style={{ fontSize: '10px', color: '#687766', marginTop: '2px' }}>
                    หมายเหตุ: {detailModal.notes}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <small style={{ color: '#687766', display: 'block' }}>ยอดรวมสุทธิ</small>
                <strong style={{ fontSize: '18px', color: '#274b1c' }}><Money value={detailModal.total} /></strong>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
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
    </div>
  );
}

