import React, { useEffect, useState } from 'react';
import {
  AlertCircle, ArrowRight, CalendarDays, Check, Clock3, Download,
  FileText, Package, RefreshCw, ShieldCheck, Truck, Wrench, X,
} from 'lucide-react';
import {
  createRepairTicket, createReview, getMyCompletedReviewableOrderItems,
  getMyInstallations, getMyMaintenance, getMyOrders, getMyQuotes,
  getMyReviews, getMyTickets, getMyWarranties, respondToQuote,
} from '../../services/customerService.js';
import { uploadPaymentSlip } from '../../services/customerService.js';
import { createPromptPayQr, getPromptPayPaymentStatus } from '../../services/paymentService.js';

const money = (value) => Number(value || 0).toLocaleString('th-TH', { style: 'currency', currency: 'THB' });
const dateTime = (value) => value ? new Date(value).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
const serviceErrorMessage = (error, fallback) => {
  const message = typeof error === 'string'
    ? error
    : [error?.message, error?.details, error?.hint].filter(Boolean).join(' — ');
  if (!message) return fallback;
  if (/order_item_id|order_items.*schema cache|schema cache.*order_items/i.test(message)) {
    return `${message} — กรุณารัน backend/supabase/migrations/20261127000000_product_reviews.sql ใน Supabase SQL Editor แล้วโหลดหน้านี้ใหม่`;
  }
  if (/quotation_item_id|quotation_items.*schema cache|schema cache.*quotation_items/i.test(message)) {
    return `${message} — กรุณารัน backend/supabase/migrations/20261127030000_installation_product_review_targets.sql ใน Supabase SQL Editor แล้วโหลดหน้านี้ใหม่`;
  }
  return message;
};

const ORDER_STATUS_LABELS = {
  pending: 'รอดำเนินการ',
  confirmed: 'ยืนยันคำสั่งซื้อแล้ว',
  processing: 'กำลังเตรียมสินค้า',
  shipped: 'จัดส่งแล้ว',
  completed: 'จัดส่งสำเร็จ',
  cancelled: 'ยกเลิก',
};

const INSTALLATION_STATUS_LABELS = {
  scheduled: 'นัดหมายแล้ว',
  preparing: 'กำลังเตรียมงาน',
  installing: 'กำลังติดตั้ง',
  testing: 'กำลังทดสอบระบบ',
  completed: 'ติดตั้งเสร็จแล้ว',
  cancelled: 'ยกเลิก',
};

const TRACKING_STATUS_CLASSES = {
  pending: 'tracking-status-pending',
  confirmed: 'tracking-status-confirmed',
  processing: 'tracking-status-processing',
  shipped: 'tracking-status-shipped',
  scheduled: 'tracking-status-scheduled',
  preparing: 'tracking-status-preparing',
  installing: 'tracking-status-installing',
  testing: 'tracking-status-testing',
  completed: 'tracking-status-completed',
  cancelled: 'tracking-status-cancelled',
};

const TRACKING_FILTER_LABELS = {
  ...ORDER_STATUS_LABELS,
  ...INSTALLATION_STATUS_LABELS,
  completed: 'เสร็จสิ้น',
};

const TICKET_STATUS_LABELS = {
  open: 'รับเรื่องแล้ว',
  in_progress: 'กำลังดำเนินการ',
  waiting_customer: 'รอข้อมูลเพิ่มเติม',
  resolved: 'แก้ไขแล้ว',
  closed: 'ปิดงาน',
};

export default function CustomerWorkspace({ route, authUser, navigate, setToast }) {
  if (route === '/orders') return <CustomerOrders authUser={authUser} setToast={setToast} />;
  if (route === '/quotes') return <CustomerQuotes setToast={setToast} />;
  if (route === '/tracking') return <CustomerTracking setToast={setToast} />;
  if (route === '/reviews') return <CustomerReviews navigate={navigate} setToast={setToast} />;
  return <CustomerAfterSales setToast={setToast} />;
}

function Loading({ text = 'กำลังโหลดข้อมูล…' }) {
  return <p className="bk-hint" role="status">{text}</p>;
}

function ErrorBox({ error, retry }) {
  return <div className="bk-form-error" role="alert"><AlertCircle size={18} /><span>{error}</span>{retry && <button type="button" className="button button-outline small-button" onClick={retry}><RefreshCw size={14} /> ลองใหม่</button>}</div>;
}

function CustomerOrders({ authUser, setToast }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [slipOrder, setSlipOrder] = useState(null);
  const [slipFile, setSlipFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getMyOrders().then((data) => { if (active) { setOrders(data); setError(''); } })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : 'โหลดคำสั่งซื้อไม่สำเร็จ'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [authUser?.id, refresh]);

  async function submitSlip(event) {
    event.preventDefault();
    if (!slipOrder || !slipFile) return;
    setUploading(true);
    try {
      await uploadPaymentSlip({ orderId: slipOrder.id, amount: slipOrder.total, file: slipFile });
      setToast('อัปโหลดสลิปและส่งตรวจสอบเรียบร้อยแล้ว');
      setSlipOrder(null);
      setSlipFile(null);
      setRefresh((value) => value + 1);
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'อัปโหลดสลิปไม่สำเร็จ');
    } finally {
      setUploading(false);
    }
  }

  return <div className="workspace-wrap"><div className="workspace-heading"><div><div className="eyebrow">MY ORDERS</div><h1>คำสั่งซื้อของฉัน</h1><p>ดูสถานะสินค้า เลขพัสดุ และแนบสลิปโอนเงินจากข้อมูลคำสั่งซื้อจริง</p></div></div>
    {error && <ErrorBox error={error} retry={() => setRefresh((value) => value + 1)} />}
    {loading && <Loading />}
    {!loading && !error && !orders.length && <div className="technician-empty"><Package size={26} /><strong>ยังไม่มีคำสั่งซื้อ</strong><span>รายการคำสั่งซื้อที่สร้างจากหน้าชำระเงินจะปรากฏที่นี่</span></div>}
    <div className="bk-history-list">{orders.map((order) => <article className="bk-history-card" key={order.id}>
      <div className="bk-history-heading"><strong>{order.order_number}</strong><span className={`status-pill ${order.status === 'cancelled' ? 'gray' : order.status === 'completed' ? 'green' : 'blue'}`}>{ORDER_STATUS_LABELS[order.status] || order.status}</span></div>
      <div className="bk-history-details"><span><CalendarDays size={15} /> {dateTime(order.created_at)}</span><span><Truck size={15} /> เลขพัสดุ: {order.tracking_number || 'รออัปเดตจากแอดมิน'}</span><span><Package size={15} /> {money(order.total)}</span></div>
      {order.order_installments?.length > 0 && <div className="bk-history-details">
        <strong>ผ่อนชำระ 3 งวด ไม่มีดอกเบี้ย</strong>
        {(() => {
          const orderedInstallments = [...order.order_installments].sort((a, b) => a.installment_number - b.installment_number);
          const nextPendingId = orderedInstallments.find((item) => item.status === 'pending')?.id;
          return orderedInstallments.map((installment) => (
            <div key={installment.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <span>งวด {installment.installment_number} · ครบกำหนด {installment.due_date} · {money(installment.amount)} · {installment.status === 'paid' ? 'ชำระแล้ว' : 'รอชำระ'}</span>
              {installment.status === 'pending' && installment.id === nextPendingId && (
                <InstallmentPayment order={order} installment={installment} onPaid={() => setRefresh((value) => value + 1)} />
              )}
            </div>
          ));
        })()}
      </div>}
      {!order.order_installments?.length && <div className="bk-history-actions"><button className="button button-outline small-button" type="button" onClick={() => setSlipOrder(order)}><FileText size={14} /> แนบสลิปโอนเงิน</button></div>}
      {!order.order_installments?.length && slipOrder?.id === order.id && <form className="bk-reschedule-form" onSubmit={submitSlip}><label className="bk-field">เลือกสลิปโอนเงิน<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setSlipFile(event.target.files?.[0] || null)} required /></label><div className="bk-history-actions"><button className="button button-green small-button" type="submit" disabled={uploading}>{uploading ? 'กำลังอัปโหลด…' : 'ส่งสลิปให้แอดมินตรวจ'}</button><button className="button button-outline small-button" type="button" onClick={() => setSlipOrder(null)}>ปิด</button></div></form>}
    </article>)}</div>
  </div>;
}

function InstallmentPayment({ order, installment, onPaid }) {
  const [qr, setQr] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const handled = React.useRef(false);

  async function createQr() {
    setLoading(true);
    setMessage('');
    handled.current = false;
    try {
      const result = await createPromptPayQr(order.id, installment.id);
      if (result.status !== 'succeeded' && !result.qrCodeUrl) {
        throw new Error('Stripe ไม่ได้ส่ง QR สำหรับชำระเงินกลับมา');
      }
      setQr(result);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'สร้าง QR ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  async function checkStatus() {
    if (!qr || handled.current) return;
    try {
      const result = await getPromptPayPaymentStatus(order.id, installment.id);
      if (result.paid) {
        handled.current = true;
        setQr(null);
        onPaid();
      } else if (result.expired) {
        setMessage('QR หมดอายุแล้ว กรุณาสร้าง QR ใหม่');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'ตรวจสอบสถานะไม่สำเร็จ');
    }
  }

  useEffect(() => {
    if (!qr) return undefined;
    const interval = window.setInterval(checkStatus, 5000);
    return () => window.clearInterval(interval);
  }, [qr, order.id, installment.id]);

  if (!qr) {
    return <div>
      <button className="button button-green small-button" type="button" onClick={createQr} disabled={loading}>
        {loading ? 'กำลังสร้าง QR…' : `ชำระงวด ${installment.installment_number}`}
      </button>
      {message && <span role="alert">{message}</span>}
    </div>;
  }

  const expired = Date.now() >= new Date(qr.expiresAt).getTime();
  return <div style={{ display: 'grid', gap: 8, justifyItems: 'start' }}>
    {qr.qrCodeUrl && !expired && <img src={qr.qrCodeUrl} alt={`QR PromptPay งวดที่ ${installment.installment_number}`} width="180" />}
    <span>{money(installment.amount)} · {expired ? 'QR หมดอายุ' : `หมดอายุ ${dateTime(qr.expiresAt)}`}</span>
    <div className="bk-history-actions">
      <button className="button button-outline small-button" type="button" onClick={checkStatus}>ตรวจสอบการชำระ</button>
      {expired && <button className="button button-green small-button" type="button" onClick={createQr} disabled={loading}>สร้าง QR ใหม่</button>}
      <button className="button button-outline small-button" type="button" onClick={() => setQr(null)}>ปิด</button>
    </div>
    {message && <span role="status">{message}</span>}
  </div>;
}

function CustomerQuotes({ setToast }) {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [previewQuote, setPreviewQuote] = useState(null);
  useEffect(() => {
    let active = true;
    getMyQuotes().then((data) => { if (active) { setQuotes(data); setError(''); } }).catch((err) => { if (active) setError(err instanceof Error ? err.message : 'โหลดใบเสนอราคาไม่สำเร็จ'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refresh]);
  async function respond(quote, accepted) {
    try { await respondToQuote(quote.id, accepted); setToast(accepted ? 'อนุมัติใบเสนอราคาเรียบร้อยแล้ว' : 'ปฏิเสธใบเสนอราคาเรียบร้อยแล้ว'); setRefresh((value) => value + 1); }
    catch (err) { setToast(err instanceof Error ? err.message : 'บันทึกผลใบเสนอราคาไม่สำเร็จ'); }
  }
  function printQuoteSheet() {
    document.body.classList.add('print-payment-quotation');
    window.addEventListener('afterprint', () => document.body.classList.remove('print-payment-quotation'), { once: true });
    window.print();
    window.setTimeout(() => document.body.classList.remove('print-payment-quotation'), 1000);
  }
  return <div className="workspace-wrap"><div className="workspace-heading"><div><div className="eyebrow">MY QUOTATIONS</div><h1>ใบเสนอราคาของฉัน</h1><p>รายละเอียดและสถานะดึงจากฐานข้อมูล ใบเสนอราคาที่ส่งอนุมัติเท่านั้นที่สามารถตอบรับได้</p></div></div>
    {error && <ErrorBox error={error} />} {loading && <Loading />}
    {!loading && !quotes.length && <div className="technician-empty"><FileText size={26} /><strong>ยังไม่มีใบเสนอราคา</strong></div>}
    <div className="bk-history-list">{quotes.map((quote) => <article className="bk-history-card" key={quote.id}>
      <div className="bk-history-heading"><strong>{quote.quote_number}</strong><span className={`status-pill ${quote.status === 'approved' ? 'green' : quote.status === 'rejected' ? 'gray' : 'yellow'}`}>{quote.status}</span></div>
      <div className="bk-history-details">
        <span><CalendarDays size={15} /> ครบกำหนด: {quote.valid_until || '—'}</span>
        <span><Package size={15} /> รวม {money(quote.net_total ?? quote.total)}</span>
        {(quote.quotation_items || []).map((item) => (
          <span key={item.id}>{item.description} × {item.quantity} ({money(item.line_total ?? item.unit_price * item.quantity)})</span>
        ))}
        {quote.notes && <p>{quote.notes}</p>}
      </div>
      <div className="bk-history-actions">
        <button className="button button-outline small-button" type="button" onClick={() => setPreviewQuote(quote)}><FileText size={14} /> ดู / พิมพ์ใบเสนอราคา</button>
        {quote.status === 'sent' && <>
          <button className="button button-green small-button" type="button" onClick={() => respond(quote, true)}><Check size={14} />อนุมัติราคา</button>
          <button className="button button-outline small-button" type="button" onClick={() => respond(quote, false)}>ปฏิเสธราคา</button>
        </>}
      </div>
    </article>)}</div>
    {previewQuote && <div
      className="account-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`ใบเสนอราคา ${previewQuote.quote_number}`}
      onClick={(event) => { if (event.target === event.currentTarget) setPreviewQuote(null); }}
    >
      <div className="payment-quotation-document" style={{ maxWidth: '680px', width: '100%', background: '#fff', padding: '24px', borderRadius: '16px', maxHeight: '90vh', overflow: 'auto' }}>
        <header className="payment-quotation-header">
          <div>
            <span className="payment-quotation-brand">SOLARSERVICE</span>
            <h2>ใบเสนอราคา (QUOTATION)</h2>
            <p>สรุปรายการแพ็กเกจและอุปกรณ์โซลาร์เซลล์</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }} className="no-print">
            <button className="button button-outline small-button" type="button" onClick={printQuoteSheet}>พิมพ์ / บันทึก PDF</button>
            <button className="button button-dark small-button" type="button" onClick={() => setPreviewQuote(null)}>ปิด</button>
          </div>
        </header>
        <div className="payment-quotation-meta">
          <div><small>เลขที่ใบเสนอราคา</small><strong>{previewQuote.quote_number}</strong></div>
          <div><small>วันที่ออกเอกสาร</small><strong>{dateTime(previewQuote.created_at)}</strong></div>
          <div><small>ใช้ได้ถึง</small><strong>{previewQuote.valid_until || '—'}</strong></div>
        </div>
        <div className="payment-quotation-table-wrap">
          <table className="payment-quotation-table">
            <thead><tr><th>รายการ</th><th>จำนวน</th><th>รวม</th></tr></thead>
            <tbody>
              {(previewQuote.quotation_items?.length ? previewQuote.quotation_items : [{ id: 'default', description: previewQuote.notes || 'แพ็กเกจติดตั้งโซลาร์เซลล์', quantity: 1, line_total: previewQuote.total }]).map((item) => (
                <tr key={item.id}>
                  <td>{item.description}</td>
                  <td>{item.quantity}</td>
                  <td>{money(item.line_total ?? item.unit_price * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr><th colSpan="2">ยอดสุทธิ</th><th>{money(previewQuote.net_total ?? previewQuote.total)}</th></tr></tfoot>
          </table>
        </div>
        {previewQuote.notes && <p className="payment-quotation-service">{previewQuote.notes}</p>}
      </div>
    </div>}
  </div>;
}

function CustomerTracking({ setToast }) {
  const [orders, setOrders] = useState([]);
  const [installations, setInstallations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  useEffect(() => {
    let active = true;
    Promise.all([getMyOrders(), getMyInstallations()]).then(([orderData, installData]) => { if (active) { setOrders(orderData); setInstallations(installData); setError(''); } })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : 'โหลดสถานะติดตามไม่สำเร็จ'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const statusOptions = typeFilter === 'orders'
    ? ORDER_STATUS_LABELS
    : typeFilter === 'installations'
      ? INSTALLATION_STATUS_LABELS
      : TRACKING_FILTER_LABELS;
  const statusCount = (status) => (
    (typeFilter !== 'installations' ? orders.filter((order) => order.status === status).length : 0)
    + (typeFilter !== 'orders' ? installations.filter((item) => item.status === status).length : 0)
  );
  const filteredOrders = typeFilter !== 'installations'
    ? orders.filter((order) => statusFilter === 'all' || order.status === statusFilter)
    : [];
  const filteredInstallations = typeFilter !== 'orders'
    ? installations.filter((item) => statusFilter === 'all' || item.status === statusFilter)
    : [];
  const totalItems = orders.length + installations.length;
  const filteredCount = filteredOrders.length + filteredInstallations.length;

  return <div className="workspace-wrap"><div className="workspace-heading"><div><div className="eyebrow">LIVE TRACKING</div><h1>ติดตามคำสั่งซื้อและงานติดตั้ง</h1><p>ข้อมูลสถานะและเลขพัสดุอ่านจากคำสั่งซื้อและตารางงานติดตั้งจริง</p></div></div>
    {error && <ErrorBox error={error} />} {loading && <Loading />}
    {!loading && !error && <>
      <div className="tracking-filters">
        <label className="bk-field">
          ประเภท
          <select value={typeFilter} onChange={(event) => {
            setTypeFilter(event.target.value);
            setStatusFilter('all');
          }}>
            <option value="all">ทั้งหมด ({totalItems})</option>
            <option value="orders">คำสั่งซื้อ ({orders.length})</option>
            <option value="installations">งานติดตั้ง ({installations.length})</option>
          </select>
        </label>
        <label className="bk-field">
          สถานะ
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">ทุกสถานะ ({typeFilter === 'orders' ? orders.length : typeFilter === 'installations' ? installations.length : totalItems})</option>
            {Object.entries(statusOptions).map(([status, label]) => (
              <option key={status} value={status}>{label} ({statusCount(status)})</option>
            ))}
          </select>
        </label>
      </div>
      <p className="tracking-result-count">แสดง {filteredCount} จาก {totalItems} รายการ</p>
      {filteredCount > 0 ? <div className="bk-history-list">
        {filteredOrders.map((order) => <article className="bk-history-card" key={order.id}>
          <div className="bk-history-heading">
            <strong>{order.order_number}</strong>
            <span className={`status-pill ${TRACKING_STATUS_CLASSES[order.status] || 'gray'}`}>{ORDER_STATUS_LABELS[order.status] || order.status}</span>
          </div>
          <div className="bk-history-details">
            <span><Truck size={15} /> เลขพัสดุ: {order.tracking_number || '—'}</span>
            <span><Clock3 size={15} /> อัปเดต: {dateTime(order.updated_at)}</span>
          </div>
        </article>)}
        {filteredInstallations.map((item) => <article className="bk-history-card" key={item.id}>
          <div className="bk-history-heading">
            <strong>{item.installation_number}</strong>
            <span className={`status-pill ${TRACKING_STATUS_CLASSES[item.status] || 'gray'}`}>{INSTALLATION_STATUS_LABELS[item.status] || item.status}</span>
          </div>
          <div className="bk-history-details">
            <span><Wrench size={15} /> นัดหมาย: {dateTime(item.scheduled_at)}</span>
            <span><CalendarDays size={15} /> เริ่มงาน: {dateTime(item.started_at)}</span>
            <span><Check size={15} /> เสร็จสิ้น: {dateTime(item.completed_at)}</span>
          </div>
        </article>)}
      </div> : <div className="technician-empty">
        <Truck size={26} />
        <strong>{totalItems ? 'ไม่พบรายการตามตัวกรอง' : 'ยังไม่มีข้อมูลติดตาม'}</strong>
        <span>{totalItems ? 'ลองเปลี่ยนประเภทหรือสถานะที่เลือก' : 'คำสั่งซื้อและงานติดตั้งจะแสดงที่นี่เมื่อมีรายการ'}</span>
      </div>}
    </>}
  </div>;
}

function CustomerReviews({ navigate, setToast }) {
  const [reviewable, setReviewable] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewTargetKey, setReviewTargetKey] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [failedImageUrl, setFailedImageUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const selectedItem = reviewable.find((item) => item.review_target_key === reviewTargetKey);
  const selectedProduct = selectedItem?.products;
  const selectedImageUrl = selectedProduct?.image_url || '';

  useEffect(() => {
    let active = true;
    Promise.all([
      getMyCompletedReviewableOrderItems(),
      getMyReviews(),
    ])
      .then(([orderItems, existing]) => {
        if (active) {
          const reviewTargets = orderItems.map((item) => ({
            ...item,
            review_target_type: 'order_item',
            review_target_key: `order:${item.id}`,
          }));
          setReviewable(reviewTargets);
          setReviews(existing);
          setReviewTargetKey(reviewTargets[0]?.review_target_key || '');
          setError('');
        }
      })
      .catch((err) => { if (active) setError(serviceErrorMessage(err, 'โหลดรีวิวไม่สำเร็จ')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refresh]);

  async function submit(event) {
    event.preventDefault();
    if (!selectedItem) return;
    setSaving(true);
    try {
      await createReview({
        orderItemId: selectedItem.id,
        rating,
        comment,
      });
      setToast('เผยแพร่รีวิวบนหน้าสินค้าเรียบร้อยแล้ว');
      setComment('');
      setRefresh((value) => value + 1);
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'บันทึกรีวิวไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  }

  return <div className="workspace-wrap"><div className="workspace-heading"><div><div className="eyebrow">PRODUCT REVIEWS</div><h1>รีวิวสินค้า</h1><p>รีวิวสินค้าที่คุณสั่งซื้อและได้รับสินค้าเรียบร้อยแล้ว</p></div></div>
    {error && <ErrorBox error={error} />} {loading && <Loading />}
    {!loading && !error && <form className="form-card review-form" onSubmit={submit}>
      <h3>แชร์ประสบการณ์การใช้สินค้า</h3>
      {reviewable.length ? <>
        <label>สินค้าที่ต้องการรีวิว
          <select value={reviewTargetKey} onChange={(event) => setReviewTargetKey(event.target.value)}>
            {reviewable.map((item) => (
              <option key={item.review_target_key} value={item.review_target_key}>
                {item.products?.name || item.product_name} · {item.orders?.order_number}
              </option>
            ))}
          </select>
        </label>
        {selectedItem && <article className="review-product-preview">
          <div className="review-product-image">
            {selectedImageUrl && failedImageUrl !== selectedImageUrl
              ? <img src={selectedImageUrl} alt={selectedProduct?.name || selectedItem.product_name} onError={() => setFailedImageUrl(selectedImageUrl)} />
              : <Package size={34} aria-hidden="true" />}
          </div>
          <div className="review-product-info">
            <small>{selectedProduct?.category || 'สินค้าในคำสั่งซื้อที่จัดส่งสำเร็จ'}</small>
            <strong>{selectedProduct?.name || selectedItem.product_name}</strong>
            {selectedProduct?.description && <p>{selectedProduct.description}</p>}
            {selectedProduct?.sku && <span>รหัสสินค้า {selectedProduct.sku}</span>}
            <span>{money(selectedItem.unit_price)} / ชิ้น · จำนวน {selectedItem.quantity}</span>
            <span>รวม {money(selectedItem.line_total ?? selectedItem.unit_price * selectedItem.quantity)}</span>
            <span>
              คำสั่งซื้อ {selectedItem.orders?.order_number}
              {selectedItem.orders?.created_at ? ` · ${new Date(selectedItem.orders.created_at).toLocaleDateString('th-TH')}` : ''}
            </span>
          </div>
        </article>}
        <div className="star-picker" aria-label="คะแนนรีวิว">{[1,2,3,4,5].map((value) => <button type="button" className={value <= rating ? 'selected' : ''} key={value} onClick={() => setRating(value)}>★</button>)}</div>
        <label>ความคิดเห็น<textarea rows="4" value={comment} onChange={(event) => setComment(event.target.value)} required placeholder="เล่าประสบการณ์การใช้สินค้า" /></label>
        <button className="button button-green" type="submit" disabled={saving}>{saving ? 'กำลังบันทึก…' : 'ส่งรีวิว'} <ArrowRight size={16} /></button>
      </> : <p>ยังไม่มีสินค้าที่จัดส่งสำเร็จและรอรีวิว</p>}
    </form>}
    {!loading && reviews.length > 0 && <div className="bk-history-list">{reviews.map((review) => {
      const reviewedItems = review.order_items ? [review.order_items] : [];
      const reviewedProductName = (item) => item.products?.name || item.product_name || item.description;
      return <article className="bk-history-card" key={review.id}>
        <div className="bk-history-heading">
          <strong>{reviewedProductName(reviewedItems[0]) || 'สินค้า'}</strong>
          <span className={`status-pill ${review.is_published ? 'green' : 'yellow'}`}>{review.is_published ? 'เผยแพร่แล้ว' : 'ซ่อนอยู่'}</span>
        </div>
        {reviewedItems.length > 0 && <div className="review-history-products">
          {reviewedItems.map((item) => {
            const product = item.products || {};
            const productName = reviewedProductName(item);
            const quantity = Number(item.quantity || 0);
            const total = item.line_total ?? Number(item.unit_price || 0) * quantity;
            return <div className="review-history-product" key={item.id}>
              <div className="review-history-product-image">
                {product.image_url
                  ? <img src={product.image_url} alt={productName} onError={(event) => { event.currentTarget.hidden = true; }} />
                  : <Package size={22} aria-hidden="true" />}
              </div>
              <div className="review-product-info">
                <small>{product.category || 'สินค้าในคำสั่งซื้อ'}</small>
                <strong>{productName}</strong>
                {product.description && <p>{product.description}</p>}
                {product.sku && <span>รหัสสินค้า {product.sku}</span>}
                {item.equipment_model && <span>รุ่นอุปกรณ์ {item.equipment_model}</span>}
                {item.warranty_number && <span>เลขรับประกัน {item.warranty_number}</span>}
                {item.warranty_end && <span>รับประกันถึง {new Date(item.warranty_end).toLocaleDateString('th-TH')}</span>}
                {item.unit_price != null && item.quantity != null && <>
                  <span>{money(item.unit_price)} / ชิ้น · จำนวน {quantity.toLocaleString('th-TH')}</span>
                  <span>รวม {money(total)}</span>
                </>}
              </div>
            </div>;
          })}
        </div>}
        <div className="bk-history-details">
          <span>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
          {review.order_items?.orders?.order_number && <span>คำสั่งซื้อ {review.order_items.orders.order_number}</span>}
          <p>{review.comment}</p>
          <span>{dateTime(review.created_at)}</span>
        </div>
        {review.is_published && navigate && (
          <div className="bk-history-actions">
            <button type="button" className="button button-outline small-button" onClick={() => navigate('/products')}>
              ดูสินค้าและรีวิวบนหน้าร้าน <ArrowRight size={14} />
            </button>
          </div>
        )}
      </article>;
    })}</div>}
  </div>;
}

function CustomerAfterSales({ setToast }) {
  const [warranties, setWarranties] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [ticketHistoryError, setTicketHistoryError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showTicket, setShowTicket] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('repair');
  const [priority, setPriority] = useState('medium');
  const [warrantyId, setWarrantyId] = useState('');
  const [certificate, setCertificate] = useState(null);
  const [saving, setSaving] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.all([getMyWarranties(), getMyMaintenance(), getMyTickets()])
      .then(([war, maint, ticketResult]) => {
        if (active) {
          setWarranties(war);
          setMaintenance(maint);
          setTickets(ticketResult.tickets);
          setTicketHistoryError(ticketResult.historyError);
          setError('');
        }
      })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : 'โหลดข้อมูลหลังการขายไม่สำเร็จ'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refresh]);

  useEffect(() => {
    if (!showTicket) return undefined;
    function closeOnEscape(event) {
      if (event.key === 'Escape' && !saving) setShowTicket(false);
    }
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [showTicket, saving]);

  useEffect(() => {
    if (!showTicket) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [showTicket]);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const ticket = await createRepairTicket({ title, description, category, priority, warrantyId: warrantyId || null });
      setTickets((current) => [{
        ...ticket,
        support_ticket_events: [{
          id: `local-${ticket.id}`,
          new_status: ticket.status,
          note: 'รับเรื่องแจ้งซ่อมแล้ว',
          created_at: ticket.created_at,
        }],
      }, ...current.filter((item) => item.id !== ticket.id)]);
      setToast('ส่งใบแจ้งซ่อมเรียบร้อยแล้ว');
      setTitle('');
      setDescription('');
      setShowTicket(false);
      setRefresh((value) => value + 1);
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'ส่งใบแจ้งซ่อมไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  }

  function printWarrantyCertificate() {
    document.body.classList.add('print-customer-warranty');
    window.addEventListener('afterprint', () => document.body.classList.remove('print-customer-warranty'), { once: true });
    window.print();
    window.setTimeout(() => document.body.classList.remove('print-customer-warranty'), 1000);
  }

  return <div className="workspace-wrap">
    <style>{`
      @media print {
        body.print-customer-warranty * { visibility: hidden !important; }
        body.print-customer-warranty .customer-warranty-certificate,
        body.print-customer-warranty .customer-warranty-certificate * { visibility: visible !important; }
        body.print-customer-warranty .account-modal-backdrop { position: static; padding: 0; background: none; }
        body.print-customer-warranty .customer-warranty-certificate { position: fixed; inset: 0; width: 100%; padding: 28px; border: 0; box-shadow: none; }
        body.print-customer-warranty .customer-warranty-certificate .no-print { display: none !important; }
      }
    `}</style>
    <div className="workspace-heading"><div><div className="eyebrow">AFTER-SALES</div><h1>ใบรับประกันและแจ้งซ่อม</h1><p>ดูอุปกรณ์ที่รับประกัน รอบล้างแผง และสถานะคำขอซ่อมของบัญชีนี้</p></div><button className="button button-green small-button" type="button" onClick={() => setShowTicket(true)} aria-haspopup="dialog" aria-expanded={showTicket}><Wrench size={14} /> แจ้งซ่อม</button></div>
    {error && <ErrorBox error={error} />} {loading && <Loading />}
    {!loading && <>
      <div className="workspace-section-heading"><div><h2>ใบรับประกัน</h2></div></div>
      <div className="bk-history-list">
        {warranties.map((item) => <article className="bk-history-card" key={item.id}>
          <div className="bk-history-heading"><strong>{item.warranty_number}</strong><span className={`status-pill ${item.status === 'active' ? 'green' : item.status === 'expired' ? 'gray' : 'yellow'}`}>{item.status}</span></div>
          <div className="bk-history-details">
            <span><ShieldCheck size={15} /> {item.equipment_model}</span>
            {item.unit_number && <span>ชิ้นที่ {item.unit_number}</span>}
            <span>Serial: {item.serial_number || 'รอระบุจากเจ้าหน้าที่'}</span>
            <span>เริ่มรับประกัน: {item.warranty_start}</span>
            <span>หมดอายุ: {item.warranty_end}</span>
          </div>
          <div className="bk-history-actions"><button className="button button-outline small-button" type="button" onClick={() => setCertificate(item)}><FileText size={14} /> ดู / พิมพ์ใบรับประกัน</button></div>
        </article>)}
        {!error && !warranties.length && <div className="technician-empty"><ShieldCheck size={26} /><strong>ยังไม่มีใบรับประกัน</strong></div>}
      </div>
      <div className="workspace-section-heading"><div><h2>รอบบำรุงรักษา / ล้างแผง</h2></div></div>
      <div className="bk-history-list">{maintenance.map((item) => <article className="bk-history-card" key={item.id}><div className="bk-history-heading"><strong>{item.title}</strong><span className="status-pill blue">{item.status}</span></div><div className="bk-history-details"><span><CalendarDays size={15} /> กำหนด: {item.due_date}</span><span><Clock3 size={15} /> ทุก {item.frequency_months} เดือน</span>{item.last_notified_at && <span>แจ้งแล้ว: {dateTime(item.last_notified_at)}</span>}</div></article>)} {!error && !maintenance.length && <div className="technician-empty"><CalendarDays size={26} /><strong>ยังไม่มีรอบบำรุงรักษา</strong></div>}</div>
      <div className="workspace-section-heading"><div><h2>คำขอแจ้งซ่อม</h2></div></div>
      {ticketHistoryError && <div className="bk-form-error" role="alert">{ticketHistoryError}</div>}
      <div className="bk-history-list">
        {tickets.map((item) => <article className="bk-history-card" key={item.id}>
          <div className="bk-history-heading"><strong>{item.ticket_number} · {item.title}</strong><span className="status-pill blue">{TICKET_STATUS_LABELS[item.status] || item.status}</span></div>
          <div className="bk-history-details"><p>{item.description}</p><span>วันที่แจ้ง: {dateTime(item.created_at)}</span>{item.resolution_notes && <p>บันทึกแก้ไข: {item.resolution_notes}</p>}</div>
          {item.support_ticket_events?.length > 0 && <ol className="bk-history-details" aria-label="ประวัติการดำเนินการ">
            {[...item.support_ticket_events].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).map((event) => (
              <li key={event.id}>
                {TICKET_STATUS_LABELS[event.new_status] || event.new_status} · {event.note} · {dateTime(event.created_at)}
              </li>
            ))}
          </ol>}
        </article>)}
        {!error && !tickets.length && <div className="technician-empty"><Wrench size={26} /><strong>ยังไม่มีคำขอแจ้งซ่อม</strong></div>}
      </div>
    </>}
    {certificate && <div className="account-modal-backdrop" role="dialog" aria-modal="true" aria-label={`ใบรับประกัน ${certificate.warranty_number}`} onClick={(event) => { if (event.target === event.currentTarget) setCertificate(null); }}>
      <section className="customer-warranty-certificate" style={{ width: 'min(680px, calc(100vw - 32px))', padding: 28, background: '#fff', borderRadius: 16, border: '2px solid #526e48', color: '#27392c' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <div><div className="eyebrow">SOLARSERVICE</div><h2>ใบรับประกันสินค้า</h2><strong>{certificate.warranty_number}</strong></div>
          <ShieldCheck size={40} />
        </div>
        <hr />
        <p><strong>สินค้า:</strong> {certificate.equipment_model}</p>
        {certificate.unit_number && <p><strong>ชิ้นที่:</strong> {certificate.unit_number}</p>}
        <p><strong>หมายเลขเครื่อง (Serial):</strong> {certificate.serial_number || 'รอระบุจากเจ้าหน้าที่'}</p>
        <p><strong>เริ่มรับประกัน:</strong> {certificate.warranty_start}</p>
        <p><strong>สิ้นสุดการรับประกัน:</strong> {certificate.warranty_end}</p>
        <p><strong>สถานะ:</strong> {certificate.status}</p>
        {certificate.notes && <p><strong>เงื่อนไข:</strong> {certificate.notes}</p>}
        <div className="bk-history-actions no-print">
          <button className="button button-green" type="button" onClick={printWarrantyCertificate}>พิมพ์ / บันทึก PDF</button>
          <button className="button button-outline" type="button" onClick={() => setCertificate(null)}>ปิด</button>
        </div>
      </section>
    </div>}
    {showTicket && <div
      className="account-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="repair-ticket-title"
      onClick={(event) => {
        if (event.target === event.currentTarget && !saving) setShowTicket(false);
      }}
    >
      <form className="form-card repair-ticket-modal" onSubmit={submit}>
        <div className="repair-ticket-modal-heading">
          <h2 id="repair-ticket-title">ฟอร์มแจ้งซ่อม</h2>
          <button className="repair-ticket-modal-close" type="button" onClick={() => setShowTicket(false)} disabled={saving} aria-label="ปิดหน้าต่างแจ้งซ่อม">
            <X size={18} />
          </button>
        </div>
        <label>อุปกรณ์ / ใบรับประกัน
          <select value={warrantyId} onChange={(event) => setWarrantyId(event.target.value)}>
            <option value="">ไม่ระบุใบรับประกัน</option>
            {warranties.map((item) => <option key={item.id} value={item.id}>{item.warranty_number} · {item.equipment_model}</option>)}
          </select>
        </label>
        <label>หัวข้ออาการปัญหา<input value={title} onChange={(event) => setTitle(event.target.value)} required /></label>
        <label>รายละเอียด<textarea rows="4" value={description} onChange={(event) => setDescription(event.target.value)} required /></label>
        <div className="form-fields">
          <label>หมวดหมู่
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="repair">แจ้งซ่อมอุปกรณ์</option>
              <option value="inverter_error">อินเวอร์เตอร์แจ้งเตือน Error</option>
              <option value="billing">การเงิน / ใบเสร็จ</option>
              <option value="inquiry">สอบถามการใช้งาน</option>
              <option value="maintenance">บำรุงรักษา</option>
              <option value="other">อื่น ๆ</option>
            </select>
          </label>
          <label>ความเร่งด่วน
            <select value={priority} onChange={(event) => setPriority(event.target.value)}>
              <option value="low">ต่ำ</option>
              <option value="medium">ปานกลาง</option>
              <option value="high">สูง</option>
              <option value="urgent">ด่วนที่สุด</option>
            </select>
          </label>
        </div>
        <div className="bk-history-actions">
          <button className="button button-green" type="submit" disabled={saving}>{saving ? 'กำลังส่ง…' : 'ส่งใบแจ้งซ่อม'}</button>
          <button className="button button-outline" type="button" onClick={() => setShowTicket(false)} disabled={saving}>ปิด</button>
        </div>
      </form>
    </div>}
  </div>;
}
