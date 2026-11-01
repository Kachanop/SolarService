import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  ExternalLink,
  Download,
  AlertCircle,
} from 'lucide-react';
import { Money } from '../../components/Shared.jsx';

const methodLabels = {
  bank_transfer: 'โอนผ่านธนาคาร',
  gateway: 'PromptPay / บัตรเครดิต',
  cash: 'เงินสด',
  manual: 'กำหนดเอง',
};

const statusLabels = {
  pending: { label: 'รอตรวจสอบสลิป', tone: 'yellow' },
  verified: { label: 'ยืนยันเรียบร้อย', tone: 'green' },
  rejected: { label: 'ปฏิเสธ / สลิปไม่ถูกต้อง', tone: 'red' },
};

export default function AdminPayments({ payments, onVerify, setToast }) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [slipModal, setSlipModal] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const filtered = useMemo(() => {
    return (payments || []).filter((p) => {
      const matchSearch =
        !search ||
        `${p.reference} ${p.customer_name} ${p.order_or_quote || ''}`
          .toLowerCase()
          .includes(search.toLowerCase());
      const matchStatus = !filterStatus || p.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [payments, search, filterStatus]);

  function handleApprove(item) {
    onVerify(item.id, true);
    if (setToast) setToast(`ยืนยันการชำระเงินสำหรับ ${item.reference} เรียบร้อยแล้ว`);
  }

  function handleRejectSubmit() {
    if (!rejectModal) return;
    onVerify(rejectModal.id, false, rejectReason || 'ยอดเงินไม่ตรง หรือสลิปไม่ถูกต้อง');
    setRejectModal(null);
    setRejectReason('');
    if (setToast) setToast(`ปฏิเสธสลิปการชำระเงิน ${rejectModal.reference} แล้ว`);
  }

  return (
    <div className="admin-payments-view">
      <div className="admin-toolbar">
        <div className="admin-toolbar-left">
          <div className="admin-search-box">
            <Search size={14} color="#788775" />
            <input
              type="text"
              placeholder="ค้นหาเลขที่อ้างอิง, ชื่อลูกค้า, คำสั่งซื้อ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="admin-filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">ทุกสถานะการชำระเงิน</option>
            <option value="pending">รอตรวจสอบสลิป</option>
            <option value="verified">ยืนยันแล้ว</option>
            <option value="rejected">ปฏิเสธ / มีปัญหา</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="admin-table">
        <div
          className="admin-table-head"
          style={{ gridTemplateColumns: 'minmax(140px, 1.2fr) minmax(130px, 1fr) minmax(110px, 0.9fr) minmax(100px, 0.8fr) minmax(100px, 0.8fr) minmax(140px, 1.2fr)' }}
        >
          <span>เลขอ้างอิง / วันเวลา</span>
          <span>ลูกค้า / รายการที่ชำระ</span>
          <span>ยอดเงิน</span>
          <span>ช่องทาง</span>
          <span>สถานะ</span>
          <span>หลักฐาน & จัดการ</span>
        </div>

        {filtered.length ? (
          filtered.map((item) => {
            const sInfo = statusLabels[item.status] || statusLabels.pending;
            return (
              <div
                key={item.id}
                className="admin-table-row"
                style={{ gridTemplateColumns: 'minmax(140px, 1.2fr) minmax(130px, 1fr) minmax(110px, 0.9fr) minmax(100px, 0.8fr) minmax(100px, 0.8fr) minmax(140px, 1.2fr)' }}
              >
                <div>
                  <strong>{item.reference}</strong>
                  <small>{new Date(item.paid_at).toLocaleString('th-TH')}</small>
                </div>

                <div>
                  <strong>{item.customer_name}</strong>
                  <small>{item.order_or_quote || 'คำสั่งซื้อระบบ'}</small>
                </div>

                <div>
                  <strong style={{ color: '#274f1b', fontSize: '12px' }}>
                    <Money value={item.amount} />
                  </strong>
                </div>

                <div>
                  <span>{methodLabels[item.method] || item.method}</span>
                </div>

                <div>
                  <span className={`status-pill ${sInfo.tone}`}>{sInfo.label}</span>
                  {item.verified_by && (
                    <small style={{ display: 'block', marginTop: '3px' }}>
                      ตรวจโดย: {item.verified_by}
                    </small>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {item.slip_url ? (
                    <button
                      type="button"
                      className="button button-outline small-button"
                      style={{ padding: '5px 8px', fontSize: '10px' }}
                      onClick={() => setSlipModal(item)}
                    >
                      <Eye size={12} /> ดูสลิป
                    </button>
                  ) : (
                    <small style={{ color: '#889585' }}>ไม่มีแนบสลิป</small>
                  )}

                  {item.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        className="button button-green small-button"
                        style={{ padding: '5px 8px', fontSize: '10px' }}
                        onClick={() => handleApprove(item)}
                        title="อนุมัติยอดเงินเข้า"
                      >
                        <CheckCircle size={12} /> ยืนยัน
                      </button>
                      <button
                        type="button"
                        className="button button-outline small-button"
                        style={{ padding: '5px 8px', fontSize: '10px', color: '#a03b30', borderColor: '#f1cfc9' }}
                        onClick={() => {
                          setRejectModal(item);
                          setRejectReason('');
                        }}
                        title="ปฏิเสธสลิป"
                      >
                        <XCircle size={12} /> ปฏิเสธ
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <p className="admin-empty">ไม่พบรายการชำระเงินตามเงื่อนไข</p>
        )}
      </div>

      {/* Slip Preview Modal */}
      {slipModal && (
        <div
          className="admin-form-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSlipModal(null);
          }}
        >
          <div className="admin-modal-card" style={{ maxWidth: '480px' }}>
            <div className="admin-modal-header">
              <div>
                <h2>หลักฐานสลิปการโอนเงิน</h2>
                <p>
                  {slipModal.reference} · คุณ {slipModal.customer_name} (
                  <Money value={slipModal.amount} />)
                </p>
              </div>
              <button
                type="button"
                className="icon-action"
                onClick={() => setSlipModal(null)}
              >
                ×
              </button>
            </div>

            <div className="slip-preview-box">
              <img
                src={slipModal.slip_url}
                alt="สลิปโอนเงิน"
                className="slip-preview-img"
              />
              <span style={{ fontSize: '10px', color: '#687766' }}>
                หมายเหตุ: {slipModal.notes || 'โอนผ่านโมบายแบงก์กิ้ง'}
              </span>
            </div>

            <div className="admin-form-actions">
              <button
                type="button"
                className="button button-outline"
                onClick={() => setSlipModal(null)}
              >
                ปิด
              </button>
              {slipModal.status === 'pending' && (
                <>
                  <button
                    type="button"
                    className="button button-outline"
                    style={{ color: '#a03b30' }}
                    onClick={() => {
                      const item = slipModal;
                      setSlipModal(null);
                      setRejectModal(item);
                    }}
                  >
                    ปฏิเสธสลิป
                  </button>
                  <button
                    type="button"
                    className="button button-green"
                    onClick={() => {
                      handleApprove(slipModal);
                      setSlipModal(null);
                    }}
                  >
                    <CheckCircle size={14} /> ยืนยันยอดเงินนี้
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Payment Modal */}
      {rejectModal && (
        <div
          className="admin-form-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setRejectModal(null);
          }}
        >
          <div className="admin-modal-card" style={{ maxWidth: '440px' }}>
            <div className="admin-modal-header">
              <div>
                <h2>ปฏิเสธสลิปการชำระเงิน</h2>
                <p>{rejectModal.reference} (คุณ {rejectModal.customer_name})</p>
              </div>
              <button
                type="button"
                className="icon-action"
                onClick={() => setRejectModal(null)}
              >
                ×
              </button>
            </div>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', color: '#445542' }}>
              เหตุผลในการปฏิเสธ (เพื่อแจ้งให้ลูกค้าทราบ)
              <textarea
                rows="3"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="เช่น สลิปไม่มียอดเงินเข้าจริง, สลิปซ้ำกับรายการอื่น, ยอดเงินไม่ครบ..."
              />
            </label>

            <div className="admin-form-actions" style={{ marginTop: '16px' }}>
              <button
                type="button"
                className="button button-outline"
                onClick={() => setRejectModal(null)}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                className="button"
                style={{ background: '#a03b30', color: '#fff' }}
                onClick={handleRejectSubmit}
              >
                ยืนยันการปฏิเสธ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
