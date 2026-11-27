import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ClipboardList, MapPin, Phone, Search, UsersRound, Wrench, X, RotateCcw } from 'lucide-react';
import { assignTechnician, getAdminSurveyReport, getAdminTechnicianWorkflow, updateAdminSurvey } from '../../services/technicianWorkflowService.js';
import { adminService } from '../../services/adminService.js';

const STATUS_LABELS = {
  pending: 'รอดำเนินการ', assigned: 'มอบหมายแล้ว', accepted: 'รับงานแล้ว', confirmed: 'ยืนยันแล้ว', in_progress: 'กำลังดำเนินการ',
  surveying: 'กำลังสำรวจ', survey_completed: 'สำรวจเสร็จแล้ว', quoted: 'เสนอราคาแล้ว', approved: 'อนุมัติแล้ว',
  installing: 'กำลังติดตั้ง', completed: 'เสร็จสิ้น', cancelled: 'ยกเลิก', draft: 'ฉบับร่าง', submitted: 'ส่งรายงานแล้ว',
};
const statusLabel = (status) => STATUS_LABELS[status] || (status === 'unassigned' ? 'รอมอบหมาย' : status || 'ยังไม่ระบุ');
const dateLabel = (value) => value ? new Date(value).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }) : 'ไม่ระบุวันนัด';

export default function AdminTechnicianManagement({ authUser, setToast, navigate }) {
  const [bookings, setBookings] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [surveyFilter, setSurveyFilter] = useState('');
  const [installationFilter, setInstallationFilter] = useState('');
  const [selection, setSelection] = useState({});
  const [saving, setSaving] = useState('');
  const [revision, setRevision] = useState(0);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [report, setReport] = useState(null);
  const [reportError, setReportError] = useState('');
  const [reportEdit, setReportEdit] = useState(false);
  const [reportSaving, setReportSaving] = useState(false);
  const [installationReport, setInstallationReport] = useState(null);
  const [installationReportError, setInstallationReportError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    getAdminTechnicianWorkflow().then((data) => {
      if (active) {
        setBookings(data.bookings); setTechnicians(data.technicians);
        setSelectedBooking((current) => current ? data.bookings.find((booking) => booking.id === current.id) || current : current);
      }
    }).catch((reason) => { if (active) setError(reason.message || 'โหลดข้อมูลงานช่างไม่สำเร็จ'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [revision]);

  const visible = useMemo(() => bookings.filter((booking) => {
    const text = `${booking.booking_number || ''} ${booking.customer_name || ''} ${booking.phone || ''} ${booking.address || ''} ${booking.province || ''}`.toLowerCase();
    const surveyStatus = booking.survey_assignment?.status || 'unassigned';
    const installStatus = booking.installation_assignment?.status || 'unassigned';
    return (!search || text.includes(search.trim().toLowerCase()))
      && (!statusFilter || booking.status === statusFilter)
      && (!surveyFilter || surveyStatus === surveyFilter)
      && (!installationFilter || installStatus === installationFilter);
  }), [bookings, search, statusFilter, surveyFilter, installationFilter]);

  async function assign(booking, type) {
    const technicianId = selection[`${booking.id}:${type}`];
    if (!technicianId) return;
    setSaving(`${booking.id}:${type}`);
    try {
      await assignTechnician(booking.id, technicianId, type, authUser?.id);
      setToast(`มอบหมายงาน${type === 'survey' ? 'สำรวจ' : 'ติดตั้ง'}แล้ว`);
      setRevision((value) => value + 1);
    } catch (reason) { setToast(`มอบหมายไม่สำเร็จ: ${reason.message}`); }
    finally { setSaving(''); }
  }

  async function openReport(bookingId) {
    setReportError(''); setReportEdit(false); setReport({ loading: true, bookingId });
    try {
      const data = await getAdminSurveyReport(bookingId);
      if (!data) { setReport(null); setReportError('ยังไม่มีรายงานสำรวจสำหรับงานนี้'); return; }
      setReport({ ...data, bookingId });
    } catch (reason) { setReport(null); setReportError(reason.message || 'เปิดรายงานไม่สำเร็จ'); }
  }

  async function saveReportChanges(form) {
    if (!report?.id) return;
    setReportSaving(true); setReportError('');
    try {
      await updateAdminSurvey(report.id, form);
      const data = await getAdminSurveyReport(report.bookingId);
      setReport({ ...data, bookingId: report.bookingId }); setReportEdit(false); setToast('บันทึกการแก้ไขรายงานแล้ว');
    } catch (reason) { setReportError(reason.message || 'บันทึกการแก้ไขไม่สำเร็จ'); }
    finally { setReportSaving(false); }
  }

  async function openInstallationReport(bookingId) {
    setInstallationReportError(''); setInstallationReport({ loading: true, images: [] });
    try {
      const images = await adminService.getInstallationUpdates(bookingId);
      setInstallationReport({ loading: false, images });
    } catch (reason) {
      setInstallationReport(null); setInstallationReportError(reason.message || 'เปิดรายงานติดตั้งไม่สำเร็จ');
    }
  }

  const pendingSurvey = bookings.filter((b) => !b.survey_assignment && !['completed', 'cancelled'].includes(b.status)).length;
  const surveying = bookings.filter((b) => b.survey_assignment?.status === 'in_progress').length;
  const pendingInstall = bookings.filter((b) => b.survey_assignment?.status === 'completed' && (!b.installation_assignment || ['assigned', 'accepted', 'in_progress'].includes(b.installation_assignment.status))).length;
  const completed = bookings.filter((b) => b.status === 'completed' || (b.survey_assignment?.status === 'completed' && b.installation_assignment?.status === 'completed')).length;
  const clearFilters = () => { setSearch(''); setStatusFilter(''); setSurveyFilter(''); setInstallationFilter(''); };
  const hasFilters = search || statusFilter || surveyFilter || installationFilter;

  return <div className="admin-technician-management">
    <section className="technician-summary-grid" aria-label="ภาพรวมงาน">
      <SummaryCard icon={<ClipboardList size={18}/>} label="งานทั้งหมด" value={bookings.length} loading={loading}/>
      <SummaryCard icon={<CalendarDays size={18}/>} label="งานรอมอบหมาย" value={pendingSurvey} loading={loading}/>
      <SummaryCard icon={<MapPin size={18}/>} label="กำลังสำรวจ" value={surveying} loading={loading}/>
      <SummaryCard icon={<Wrench size={18}/>} label="รอติดตั้ง / กำลังติดตั้ง" value={pendingInstall} loading={loading}/>
      <SummaryCard icon={<UsersRound size={18}/>} label="งานเสร็จแล้ว" value={completed} loading={loading}/>
    </section>

    <section className="technician-survey-section">
      <div className="workspace-section-heading"><div><h2>รายการงาน</h2><p>ค้นหา มอบหมายทีม และติดตามสถานะงานจากข้อมูลระบบ</p></div><button className="button button-outline small-button" onClick={() => navigate('/manage-bookings')}>ดูการจอง</button></div>
      <div className="technician-filters">
        <label className="admin-search-box"><Search size={15}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหารหัสงาน ชื่อลูกค้า เบอร์โทร หรือพื้นที่"/></label>
        <select aria-label="กรองสถานะงาน" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="">สถานะงานทั้งหมด</option>{uniqueStatuses(bookings.map((b) => b.status)).map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}</select>
        <select aria-label="กรองสถานะสำรวจ" value={surveyFilter} onChange={(e) => setSurveyFilter(e.target.value)}><option value="">สถานะสำรวจทั้งหมด</option><option value="unassigned">รอมอบหมาย</option>{uniqueStatuses(bookings.map((b) => b.survey_assignment?.status)).map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}</select>
        <select aria-label="กรองสถานะติดตั้ง" value={installationFilter} onChange={(e) => setInstallationFilter(e.target.value)}><option value="">สถานะติดตั้งทั้งหมด</option><option value="unassigned">รอมอบหมาย</option>{uniqueStatuses(bookings.map((b) => b.installation_assignment?.status)).map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}</select>
        {hasFilters && <button type="button" className="button button-outline small-button" onClick={clearFilters}><RotateCcw size={13}/> ล้างตัวกรอง</button>}
      </div>
      {loading && <p className="technician-message">กำลังโหลดรายการ…</p>}
      {error && <div className="technician-error" role="alert">{error} <button className="button button-outline small-button" onClick={() => setRevision((v) => v + 1)}>ลองอีกครั้ง</button></div>}
      {!loading && !error && <div className="technician-table-wrap"><table className="technician-data-table"><thead><tr><th>งาน / นัดหมาย</th><th>ลูกค้า</th><th>พื้นที่ / ที่อยู่</th><th>ทีมสำรวจ</th><th>ทีมติดตั้ง</th><th>สถานะงาน</th><th>จัดการ</th></tr></thead>
        <tbody>{visible.map((booking) => <tr key={booking.id}>
          <td><strong>{booking.booking_number || '—'}</strong><small>{dateLabel(booking.preferred_at)}</small></td>
          <td><strong>{booking.customer_name || 'ไม่ระบุชื่อลูกค้า'}</strong><small>{booking.phone || 'ไม่มีเบอร์โทร'}</small></td>
          <td className="technician-table-location"><strong>{booking.province || 'ไม่ระบุพื้นที่'}</strong><small title={booking.address || ''}>{booking.address || 'ไม่ระบุที่อยู่'}</small></td>
          <td><AssignmentSummary assignment={booking.survey_assignment}/></td><td><AssignmentSummary assignment={booking.installation_assignment}/></td>
          <td><StatusBadge status={booking.status}/></td>
          <td><button className="button button-outline small-button" onClick={() => setSelectedBooking(booking)}>จัดการงาน</button></td>
        </tr>)}
          {!visible.length && <tr><td colSpan="7" className="technician-no-bookings">{bookings.length ? 'ไม่พบงานตามตัวกรอง' : 'ยังไม่มีรายการจองในระบบ'}</td></tr>}
        </tbody></table></div>}
    </section>

    <section className="technician-team-section"><div className="workspace-section-heading"><div><h2>ทีมช่าง</h2><p>รายชื่อและประเภททีมสำหรับมอบหมายงาน</p></div></div><div className="technician-team-grid">{technicians.map((tech) => {
      const activeAssignments = bookings.reduce((count, booking) => count + [booking.survey_assignment, booking.installation_assignment].filter((assignment) => assignment?.technician_id === tech.id && ['assigned', 'accepted', 'in_progress'].includes(assignment.status)).length, 0);
      return <article className="technician-team-card" key={tech.id}>{tech.avatar_url ? <img className="technician-avatar" src={tech.avatar_url} alt=""/> : <div className="technician-avatar">{(tech.full_name || 'ช').slice(0, 1)}</div>}<div className="technician-card-info"><strong>{tech.full_name || 'ไม่ระบุชื่อ'}</strong><small>{tech.phone || 'ไม่มีเบอร์โทร'}</small><small>ประเภท: {tech.technician_type === 'survey' ? 'สำรวจ' : tech.technician_type === 'installation' ? 'ติดตั้ง' : 'สำรวจและติดตั้ง'}</small><small>งานที่รับผิดชอบ: {activeAssignments} งาน</small></div></article>;
    })}{!loading && !technicians.length && <p className="technician-no-bookings">ยังไม่มีรายชื่อทีมช่าง</p>}</div></section>

    {selectedBooking && <div className="workflow-modal-backdrop" onClick={() => setSelectedBooking(null)}><section className="workflow-modal technician-manage-modal" role="dialog" aria-modal="true" aria-labelledby="manage-job-title" onClick={(e) => e.stopPropagation()}>
      <div className="technician-modal-heading"><div><h2 id="manage-job-title">จัดการงาน {selectedBooking.booking_number}</h2><p>{selectedBooking.customer_name || 'ไม่ระบุชื่อลูกค้า'} · {selectedBooking.phone || 'ไม่มีเบอร์โทร'}</p></div><button className="technician-icon-button" aria-label="ปิด" onClick={() => setSelectedBooking(null)}><X size={18}/></button></div>
      <div className="technician-detail-grid"><span><small>ที่อยู่</small>{selectedBooking.address || '—'}{selectedBooking.province ? `, ${selectedBooking.province}` : ''}</span><span><small>บริการ</small>{selectedBooking.notes || 'ไม่ระบุรายละเอียดบริการ'}</span><span><small>วันนัด</small>{dateLabel(selectedBooking.preferred_at)}</span><span><small>สถานะงาน</small><StatusBadge status={selectedBooking.status}/></span></div>
      <div className="technician-management-sections">
        <section><h3>ทีมสำรวจ</h3><AssignmentCell booking={selectedBooking} type="survey" technicians={technicians} selection={selection} setSelection={setSelection} saving={saving} onAssign={assign}/></section>
        <section><h3>ทีมติดตั้ง</h3><AssignmentCell booking={selectedBooking} type="installation" technicians={technicians} selection={selection} setSelection={setSelection} saving={saving} onAssign={assign}/></section>
        <section><h3>รายงานสำรวจ</h3>{selectedBooking.survey_assignment ? <button className="button button-outline small-button" onClick={() => openReport(selectedBooking.id)}>ดูรายงานสำรวจ</button> : <span className="technician-unassigned">ยังไม่มีรายงานสำรวจ</span>}</section>
        <section><h3>รายงานติดตั้ง</h3>{selectedBooking.installation_assignment ? <button className="button button-outline small-button" onClick={() => openInstallationReport(selectedBooking.id)}>ดูรายงานติดตั้ง</button> : <span className="technician-unassigned">ยังไม่มีรายงานติดตั้ง</span>}</section>
        <section><h3>ประวัติการมอบหมาย ({selectedBooking.assignment_history.length})</h3><div className="technician-history-list">{selectedBooking.assignment_history.map((item) => <small key={item.id}>{item.assignment_type === 'survey' ? 'สำรวจ' : 'ติดตั้ง'} · {item.profiles?.full_name || item.technician_id.slice(0, 8)} · {statusLabel(item.status)} · ผู้มอบหมาย {item.assigned_by_name || '—'} · {dateLabel(item.assigned_at)}</small>)}</div></section>
      </div>
    </section></div>}
    {reportError && <div className="technician-error" role="alert">{reportError}<button className="technician-icon-button" aria-label="ปิดข้อความ" onClick={() => setReportError('')}><X size={16}/></button></div>}
    {installationReportError && <div className="technician-error" role="alert">{installationReportError}<button className="technician-icon-button" aria-label="ปิดข้อความ" onClick={() => setInstallationReportError('')}><X size={16}/></button></div>}
    {installationReport && <div className="workflow-modal-backdrop" onClick={() => setInstallationReport(null)}><section className="workflow-modal" role="dialog" aria-modal="true" aria-labelledby="installation-report-title" onClick={(e) => e.stopPropagation()}><button className="button button-outline small-button" onClick={() => setInstallationReport(null)}>ปิด</button><h2 id="installation-report-title">รายงานติดตั้ง</h2>{installationReport.loading ? <p>กำลังโหลดรายงาน…</p> : installationReport.images.length ? <div className="survey-photo-grid">{installationReport.images.map((image) => <a key={image.id} href={image.url} target="_blank" rel="noreferrer"><img src={image.url} alt={`ภาพงานติดตั้ง ${dateLabel(image.created_at)}`}/><small>{dateLabel(image.created_at)}</small></a>)}</div> : <p>ยังไม่มีภาพหรือข้อมูลรายงานติดตั้งสำหรับงานนี้</p>}</section></div>}
    {report && <div className="workflow-modal-backdrop" onClick={() => setReport(null)}><section className="workflow-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}><button className="button button-outline small-button" onClick={() => setReport(null)}>ปิด</button>{report.loading ? <p>กำลังโหลดรายงาน…</p> : <><h2>รายงานสำรวจหน้างาน</h2><p>ผู้สำรวจ: {report.technician_name || '—'}</p>{reportEdit ? <AdminSurveyEditor report={report} saving={reportSaving} onCancel={() => setReportEdit(false)} onSave={saveReportChanges}/> : <><button className="button button-outline small-button" onClick={() => setReportEdit(true)}>แก้ไขรายงาน</button><div className="form-fields">{[['ผู้ติดต่อ',report.contact_name],['เบอร์โทร',report.contact_phone],['ที่อยู่',report.installation_address],['ประเภทหลังคา',report.roof_type],['พื้นที่หลังคา',report.roof_area_sqm],['ทิศทาง',report.roof_direction],['ระบบแนะนำ (kW)',report.recommended_system_kw],['สภาพพื้นที่',report.site_conditions],['ตำแหน่งแผง',report.panel_location],['ตำแหน่ง Inverter',report.inverter_location],['อุปกรณ์',report.equipment_details],['ปัญหา',report.problems],['ข้อเสนอแนะ',report.recommendations],['วันที่สำรวจ',report.survey_date]].map(([label,value]) => <div key={label}><small>{label}</small><p>{value || '—'}</p></div>)}</div><div className="survey-photo-grid">{(report.survey_images || []).map((image) => <a key={image.id} href={image.url} target="_blank" rel="noreferrer"><img src={image.url} alt={image.caption}/></a>)}</div></>}</>}</section></div>}
  </div>;
}

function SummaryCard({ icon, label, value, loading }) { return <article className="technician-summary-card"><span>{icon}</span><div><small>{label}</small><strong>{loading ? '—' : value}</strong></div></article>; }
function uniqueStatuses(statuses) { return [...new Set(statuses.filter(Boolean))]; }
function StatusBadge({ status }) { const tone = ['completed', 'survey_completed'].includes(status) ? 'green' : ['cancelled'].includes(status) ? 'red' : ['in_progress', 'surveying', 'installing'].includes(status) ? 'blue' : 'yellow'; return <span className={`status-pill ${tone}`}>{statusLabel(status)}</span>; }
function AssignmentSummary({ assignment }) { return <div className="technician-assignment-summary"><strong>{assignment?.profiles?.full_name || (assignment ? 'มอบหมายแล้ว' : 'รอมอบหมาย')}</strong><StatusBadge status={assignment?.status || 'unassigned'}/></div>; }

function AssignmentCell({ booking, type, technicians, selection, setSelection, saving, onAssign }) {
  const current = type === 'survey' ? booking.survey_assignment : booking.installation_assignment;
  const allWorkCompleted = booking.survey_assignment?.status === 'completed' && booking.installation_assignment?.status === 'completed';
  const activeTechs = technicians.filter((t) => t.id !== current?.technician_id && ((t.technician_type || 'both') === type || t.technician_type === 'both'));
  const label = type === 'survey' ? 'สำรวจ' : 'ติดตั้ง';
  if (allWorkCompleted || current?.status === 'completed') return <div className="technician-assign-control"><AssignmentSummary assignment={current}/></div>;
  if (type === 'installation' && booking.survey_assignment?.status !== 'completed') return <div className="technician-assign-control">{current && <small>{current.profiles?.full_name || current.technician_id.slice(0, 8)} · {statusLabel(current.status)}</small>}<span className="technician-unassigned">{booking.survey_assignment ? 'รอสำรวจเสร็จสิ้น' : 'รอมอบหมายงานสำรวจ'}</span></div>;
  return <div className="technician-assign-control">{current && <small>{current.profiles?.full_name || current.technician_id.slice(0, 8)} · {statusLabel(current.status)}</small>}<select aria-label={`เลือกช่าง${label}`} value={selection[`${booking.id}:${type}`] || ''} onChange={(e) => setSelection((s) => ({ ...s, [`${booking.id}:${type}`]: e.target.value }))}><option value="">{current ? `เปลี่ยนทีม${label}` : `เลือกทีม${label}`}</option>{activeTechs.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}</select><button className="button button-green small-button" disabled={!selection[`${booking.id}:${type}`] || saving === `${booking.id}:${type}`} onClick={() => onAssign(booking, type)}>{saving === `${booking.id}:${type}` ? 'กำลังบันทึก…' : 'มอบหมาย'}</button></div>;
}

function AdminSurveyEditor({ report, saving, onCancel, onSave }) {
  const [form, setForm] = useState({ contact_name: report.contact_name || '', contact_phone: report.contact_phone || '', installation_address: report.installation_address || '', roof_type: report.roof_type || '', roof_area_sqm: report.roof_area_sqm ?? '', roof_direction: report.roof_direction || '', recommended_system_kw: report.recommended_system_kw ?? '', panel_location: report.panel_location || '', inverter_location: report.inverter_location || '', equipment_details: report.equipment_details || '', site_conditions: report.site_conditions || '', problems: report.problems || '', recommendations: report.recommendations || '', survey_date: report.survey_date || '', notes: report.notes || '' });
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const textField = (label, key, wide = false) => <label className={wide ? 'full-width' : ''}>{label}<textarea rows={wide ? 2 : 1} value={form[key]} onChange={(e) => update(key, e.target.value)}/></label>;
  return <form className="form-fields" onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
    {textField('ชื่อผู้ติดต่อ','contact_name')}{textField('เบอร์โทรศัพท์','contact_phone')}{textField('ที่อยู่ติดตั้ง','installation_address',true)}{textField('ประเภทหลังคา','roof_type')}{textField('พื้นที่หลังคา (ตร.ม.)','roof_area_sqm')}{textField('ทิศทางหลังคา','roof_direction')}{textField('ขนาดระบบแนะนำ (kW)','recommended_system_kw')}{textField('ตำแหน่งแผง Solar','panel_location')}{textField('ตำแหน่ง Inverter','inverter_location')}{textField('รายละเอียดอุปกรณ์','equipment_details',true)}{textField('สภาพพื้นที่ติดตั้ง','site_conditions',true)}{textField('ปัญหาหรือข้อจำกัด','problems',true)}{textField('ข้อเสนอแนะ','recommendations',true)}{textField('หมายเหตุ','notes',true)}
    <label>วันที่สำรวจ<input type="date" value={form.survey_date} onChange={(e) => update('survey_date', e.target.value)}/></label><div className="full-width workflow-actions"><button type="button" className="button button-outline" onClick={onCancel} disabled={saving}>ยกเลิก</button><button type="submit" className="button button-green" disabled={saving}>{saving ? 'กำลังบันทึก…' : 'บันทึกการแก้ไข'}</button></div>
  </form>;
}
