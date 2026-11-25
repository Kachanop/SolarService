import React, { useEffect, useState } from 'react';
import {
  AlertCircle, ArrowRight, CalendarDays, Check, Clock3, Download,
  FileText, Package, RefreshCw, ShieldCheck, Truck, Wrench,
} from 'lucide-react';
import {
  createRepairTicket, createReview, getMyCompletedReviewableInstallations,
  getMyInstallations, getMyMaintenance, getMyOrders, getMyQuotes,
  getMyReviews, getMyTickets, getMyWarranties, respondToQuote,
} from '../../services/customerService.js';
import { uploadPaymentSlip } from '../../services/customerService.js';

const money = (value) => Number(value || 0).toLocaleString('th-TH', { style: 'currency', currency: 'THB' });
const dateTime = (value) => value ? new Date(value).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

export default function CustomerWorkspace({ route, authUser, setToast }) {
  if (route === '/orders') return <CustomerOrders authUser={authUser} setToast={setToast} />;
  if (route === '/quotes') return <CustomerQuotes setToast={setToast} />;
  if (route === '/tracking') return <CustomerTracking setToast={setToast} />;
  if (route === '/reviews') return <CustomerReviews setToast={setToast} />;
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
      <div className="bk-history-heading"><strong>{order.order_number}</strong><span className={`status-pill ${order.status === 'cancelled' ? 'gray' : order.status === 'completed' ? 'green' : 'blue'}`}>{order.status}</span></div>
      <div className="bk-history-details"><span><CalendarDays size={15} /> {dateTime(order.created_at)}</span><span><Truck size={15} /> เลขพัสดุ: {order.tracking_number || 'รออัปเดตจากแอดมิน'}</span><span><Package size={15} /> {money(order.total)}</span></div>
      <div className="bk-history-actions"><button className="button button-outline small-button" type="button" onClick={() => setSlipOrder(order)}><FileText size={14} /> แนบสลิปโอนเงิน</button></div>
      {slipOrder?.id === order.id && <form className="bk-reschedule-form" onSubmit={submitSlip}><label className="bk-field">เลือกสลิปโอนเงิน<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setSlipFile(event.target.files?.[0] || null)} required /></label><div className="bk-history-actions"><button className="button button-green small-button" type="submit" disabled={uploading}>{uploading ? 'กำลังอัปโหลด…' : 'ส่งสลิปให้แอดมินตรวจ'}</button><button className="button button-outline small-button" type="button" onClick={() => setSlipOrder(null)}>ปิด</button></div></form>}
    </article>)}</div>
  </div>;
}

function CustomerQuotes({ setToast }) {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    getMyQuotes().then((data) => { if (active) { setQuotes(data); setError(''); } }).catch((err) => { if (active) setError(err instanceof Error ? err.message : 'โหลดใบเสนอราคาไม่สำเร็จ'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refresh]);
  async function respond(quote, accepted) {
    try { await respondToQuote(quote.id, accepted); setToast(accepted ? 'อนุมัติใบเสนอราคาเรียบร้อยแล้ว' : 'ปฏิเสธใบเสนอราคาเรียบร้อยแล้ว'); setRefresh((value) => value + 1); }
    catch (err) { setToast(err instanceof Error ? err.message : 'บันทึกผลใบเสนอราคาไม่สำเร็จ'); }
  }
  return <div className="workspace-wrap"><div className="workspace-heading"><div><div className="eyebrow">MY QUOTATIONS</div><h1>ใบเสนอราคาของฉัน</h1><p>รายละเอียดและสถานะดึงจากฐานข้อมูล ใบเสนอราคาที่ส่งอนุมัติเท่านั้นที่สามารถตอบรับได้</p></div></div>
    {error && <ErrorBox error={error} />} {loading && <Loading />}
    {!loading && !quotes.length && <div className="technician-empty"><FileText size={26} /><strong>ยังไม่มีใบเสนอราคา</strong></div>}
    <div className="bk-history-list">{quotes.map((quote) => <article className="bk-history-card" key={quote.id}>
      <div className="bk-history-heading"><strong>{quote.quote_number}</strong><span className={`status-pill ${quote.status === 'approved' ? 'green' : quote.status === 'rejected' ? 'gray' : 'yellow'}`}>{quote.status}</span></div>
      <div className="bk-history-details"><span><CalendarDays size={15} /> ครบกำหนด: {quote.valid_until || '—'}</span><span><Package size={15} /> รวม {money(quote.net_total ?? quote.total)}</span>{quote.notes && <p>{quote.notes}</p>}</div>
      {quote.status === 'sent' && <div className="bk-history-actions"><button className="button button-green small-button" type="button" onClick={() => respond(quote, true)}><Check size={14} />อนุมัติราคา</button><button className="button button-outline small-button" type="button" onClick={() => respond(quote, false)}>ปฏิเสธราคา</button></div>}
    </article>)}</div>
  </div>;
}

function CustomerTracking({ setToast }) {
  const [orders, setOrders] = useState([]);
  const [installations, setInstallations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    Promise.all([getMyOrders(), getMyInstallations()]).then(([orderData, installData]) => { if (active) { setOrders(orderData); setInstallations(installData); setError(''); } })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : 'โหลดสถานะติดตามไม่สำเร็จ'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  return <div className="workspace-wrap"><div className="workspace-heading"><div><div className="eyebrow">LIVE TRACKING</div><h1>ติดตามคำสั่งซื้อและงานติดตั้ง</h1><p>ข้อมูลสถานะและเลขพัสดุอ่านจากคำสั่งซื้อและตารางงานติดตั้งจริง</p></div></div>
    {error && <ErrorBox error={error} />} {loading && <Loading />}
    {!loading && !error && <div className="bk-history-list">
      {orders.map((order) => <article className="bk-history-card" key={order.id}><div className="bk-history-heading"><strong>{order.order_number}</strong><span className="status-pill blue">{order.status}</span></div><div className="bk-history-details"><span><Truck size={15} /> เลขพัสดุ: {order.tracking_number || '—'}</span><span><Clock3 size={15} /> อัปเดต: {dateTime(order.updated_at)}</span></div></article>)}
      {installations.map((item) => <article className="bk-history-card" key={item.id}><div className="bk-history-heading"><strong>{item.installation_number}</strong><span className="status-pill blue">{item.status}</span></div><div className="bk-history-details"><span><Wrench size={15} /> นัดหมาย: {dateTime(item.scheduled_at)}</span><span><CalendarDays size={15} /> เริ่มงาน: {dateTime(item.started_at)}</span><span><Check size={15} /> เสร็จสิ้น: {dateTime(item.completed_at)}</span></div></article>)}
      {!orders.length && !installations.length && <div className="technician-empty"><Truck size={26} /><strong>ยังไม่มีข้อมูลติดตาม</strong></div>}
    </div>}
  </div>;
}

function CustomerReviews({ setToast }) {
  const [reviewable, setReviewable] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [installationId, setInstallationId] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.all([getMyCompletedReviewableInstallations(), getMyReviews()])
      .then(([canReview, existing]) => {
        if (active) {
          setReviewable(canReview);
          setReviews(existing);
          setInstallationId(canReview[0]?.id || '');
          setError('');
        }
      })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : 'โหลดรีวิวไม่สำเร็จ'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refresh]);

  async function submit(event) {
    event.preventDefault();
    if (!installationId) return;
    setSaving(true);
    try {
      await createReview({ installationId, rating, comment });
      setToast('บันทึกรีวิวเรียบร้อยแล้ว รอแอดมินเผยแพร่');
      setComment('');
      setRefresh((value) => value + 1);
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'บันทึกรีวิวไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  }

  return <div className="workspace-wrap"><div className="workspace-heading"><div><div className="eyebrow">CUSTOMER REVIEWS</div><h1>รีวิวบริการ</h1><p>รีวิวบันทึกลงตาราง reviews และจำเป็นต้องเป็นงานติดตั้งที่เสร็จสิ้นของบัญชีนี้เท่านั้น</p></div></div>
    {error && <ErrorBox error={error} />} {loading && <Loading />}
    {!loading && !error && <form className="form-card review-form" onSubmit={submit}>
      <h3>แชร์ประสบการณ์ของคุณ</h3>
      {reviewable.length ? <>
        <label>งานที่ติดตั้ง<select value={installationId} onChange={(event) => setInstallationId(event.target.value)}>{reviewable.map((item) => <option key={item.id} value={item.id}>{item.installation_number}</option>)}</select></label>
        <div className="star-picker" aria-label="คะแนนรีวิว">{[1,2,3,4,5].map((value) => <button type="button" className={value <= rating ? 'selected' : ''} key={value} onClick={() => setRating(value)}>★</button>)}</div>
        <label>ความคิดเห็น<textarea rows="4" value={comment} onChange={(event) => setComment(event.target.value)} required placeholder="เล่าประสบการณ์การใช้บริการ" /></label>
        <button className="button button-green" type="submit" disabled={saving}>{saving ? 'กำลังบันทึก…' : 'ส่งรีวิว'} <ArrowRight size={16} /></button>
      </> : <p>ยังไม่มีงานติดตั้งที่เสร็จสิ้นและยังไม่ได้รับรีวิว</p>}
    </form>}
    {!loading && reviews.length > 0 && <div className="bk-history-list">{reviews.map((review) => <article className="bk-history-card" key={review.id}><div className="bk-history-heading"><strong>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</strong><span className={`status-pill ${review.is_published ? 'green' : 'yellow'}`}>{review.is_published ? 'เผยแพร่แล้ว' : 'รอตรวจสอบ'}</span></div><div className="bk-history-details"><p>{review.comment}</p><span>{dateTime(review.created_at)}</span></div></article>)}</div>}
  </div>;
}

function CustomerAfterSales({ setToast }) {
  const [warranties, setWarranties] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showTicket, setShowTicket] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('repair');
  const [priority, setPriority] = useState('medium');
  const [warrantyId, setWarrantyId] = useState('');
  const [saving, setSaving] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.all([getMyWarranties(), getMyMaintenance(), getMyTickets()])
      .then(([war, maint, ticket]) => { if (active) { setWarranties(war); setMaintenance(maint); setTickets(ticket); setError(''); } })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : 'โหลดข้อมูลหลังการขายไม่สำเร็จ'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refresh]);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await createRepairTicket({ title, description, category, priority, warrantyId: warrantyId || null });
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

  return <div className="workspace-wrap"><div className="workspace-heading"><div><div className="eyebrow">AFTER-SALES</div><h1>ใบรับประกันและแจ้งซ่อม</h1><p>ดูอุปกรณ์ที่รับประกัน รอบล้างแผง และสถานะคำขอซ่อมของบัญชีนี้</p></div><button className="button button-green small-button" type="button" onClick={() => setShowTicket(true)}><Wrench size={14} /> แจ้งซ่อม</button></div>
    {error && <ErrorBox error={error} />} {loading && <Loading />}
    {!loading && !error && <>
      <div className="workspace-section-heading"><div><h2>ใบรับประกัน</h2></div></div>
      <div className="bk-history-list">{warranties.map((item) => <article className="bk-history-card" key={item.id}><div className="bk-history-heading"><strong>{item.warranty_number}</strong><span className={`status-pill ${item.status === 'active' ? 'green' : 'yellow'}`}>{item.status}</span></div><div className="bk-history-details"><span><ShieldCheck size={15} /> {item.equipment_model}</span><span>Serial: {item.serial_number}</span><span>หมดอายุ: {item.warranty_end}</span></div></article>)} {!warranties.length && <div className="technician-empty"><ShieldCheck size={26} /><strong>ยังไม่มีใบรับประกัน</strong></div>}</div>
      <div className="workspace-section-heading"><div><h2>รอบบำรุงรักษา / ล้างแผง</h2></div></div>
      <div className="bk-history-list">{maintenance.map((item) => <article className="bk-history-card" key={item.id}><div className="bk-history-heading"><strong>{item.title}</strong><span className="status-pill blue">{item.status}</span></div><div className="bk-history-details"><span><CalendarDays size={15} /> กำหนด: {item.due_date}</span><span><Clock3 size={15} /> ทุก {item.frequency_months} เดือน</span>{item.last_notified_at && <span>แจ้งแล้ว: {dateTime(item.last_notified_at)}</span>}</div></article>)} {!maintenance.length && <div className="technician-empty"><CalendarDays size={26} /><strong>ยังไม่มีรอบบำรุงรักษา</strong></div>}</div>
      <div className="workspace-section-heading"><div><h2>คำขอแจ้งซ่อม</h2></div></div>
      <div className="bk-history-list">{tickets.map((item) => <article className="bk-history-card" key={item.id}><div className="bk-history-heading"><strong>{item.ticket_number} · {item.title}</strong><span className="status-pill blue">{item.status}</span></div><div className="bk-history-details"><p>{item.description}</p>{item.resolution_notes && <p>บันทึกแก้ไข: {item.resolution_notes}</p>}<span>{dateTime(item.created_at)}</span></div></article>)} {!tickets.length && <div className="technician-empty"><Wrench size={26} /><strong>ยังไม่มีคำขอแจ้งซ่อม</strong></div>}</div>
    </>}
    {showTicket && <div className="account-modal-backdrop" role="dialog" aria-modal="true"><form className="form-card" onSubmit={submit}><h3>ฟอร์มแจ้งซ่อม</h3><label>อุปกรณ์ / ใบรับประกัน<select value={warrantyId} onChange={(event) => setWarrantyId(event.target.value)}><option value="">ไม่ระบุใบรับประกัน</option>{warranties.map((item) => <option key={item.id} value={item.id}>{item.warranty_number} · {item.equipment_model}</option>)}</select></label><label>หัวข้ออาการปัญหา<input value={title} onChange={(event) => setTitle(event.target.value)} required /></label><label>รายละเอียด<textarea rows="4" value={description} onChange={(event) => setDescription(event.target.value)} required /></label><div className="form-fields"><label>หมวดหมู่<select value={category} onChange={(event) => setCategory(event.target.value)}><option value="repair">แจ้งซ่อมอุปกรณ์</option><option value="inverter_error">อินเวอร์เตอร์แจ้งเตือน Error</option><option value="billing">การเงิน / ใบเสร็จ</option><option value="inquiry">สอบถามการใช้งาน</option><option value="maintenance">บำรุงรักษา</option><option value="other">อื่น ๆ</option></select></label><label>ความเร่งด่วน<select value={priority} onChange={(event) => setPriority(event.target.value)}><option value="low">ต่ำ</option><option value="medium">ปานกลาง</option><option value="high">สูง</option><option value="urgent">ด่วนที่สุด</option></select></label></div><div className="bk-history-actions"><button className="button button-green" type="submit" disabled={saving}>{saving ? 'กำลังส่ง…' : 'ส่งใบแจ้งซ่อม'}</button><button className="button button-outline" type="button" onClick={() => setShowTicket(false)}>ปิด</button></div></form></div>}
  </div>;
}
