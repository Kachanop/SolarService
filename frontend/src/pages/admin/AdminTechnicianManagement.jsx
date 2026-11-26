import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ClipboardList, MapPin, Phone, Search, UsersRound, Wrench } from 'lucide-react';
import { assignTechnician, getAdminSurveyReport, getAdminTechnicianWorkflow, updateAdminSurvey } from '../../services/technicianWorkflowService.js';

function dateLabel(value) { return value ? new Date(value).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }) : 'ไม่ระบุวันนัด'; }

export default function AdminTechnicianManagement({ authUser, setToast, navigate }) {
  const [bookings, setBookings] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [selection, setSelection] = useState({});
  const [saving, setSaving] = useState('');
  const [revision, setRevision] = useState(0);
  const [report,setReport]=useState(null);
  const [reportError,setReportError]=useState('');
  const [reportEdit,setReportEdit]=useState(false);
  const [reportSaving,setReportSaving]=useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    getAdminTechnicianWorkflow().then((data) => {
      if (active) { setBookings(data.bookings); setTechnicians(data.technicians); }
    }).catch((reason) => { if (active) setError(reason.message || 'โหลดข้อมูลงานช่างไม่สำเร็จ'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [revision]);

  const visible = useMemo(() => bookings.filter((booking) => {
    const text = `${booking.booking_number} ${booking.customer_name} ${booking.phone} ${booking.address} ${booking.province}`.toLowerCase();
    return (!search || text.includes(search.toLowerCase())) && (!filter || booking.status === filter);
  }), [bookings, search, filter]);

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
    setReportError('');setReportEdit(false);setReport({loading:true,bookingId});
    try { const data=await getAdminSurveyReport(bookingId);if(!data){setReport(null);setReportError('ยังไม่มีรายงานสำรวจสำหรับงานนี้');return;}setReport({...data,bookingId}); }
    catch(reason){setReport(null);setReportError(reason.message||'เปิดรายงานไม่สำเร็จ');}
  }
  async function saveReportChanges(form) {
    if(!report?.id)return;
    setReportSaving(true);setReportError('');
    try { await updateAdminSurvey(report.id,form);const data=await getAdminSurveyReport(report.bookingId);setReport({...data,bookingId:report.bookingId});setReportEdit(false);setToast('บันทึกการแก้ไขรายงานแล้ว'); }
    catch(reason){setReportError(reason.message||'บันทึกการแก้ไขไม่สำเร็จ');}
    finally{setReportSaving(false);}
  }

  const pendingSurvey = bookings.filter((b) => !b.survey_assignment && !['completed','cancelled'].includes(b.status)).length;
  const pendingInstall = bookings.filter((b) => b.survey_assignment?.status === 'completed' && !b.installation_assignment).length;
  return <div className="admin-technician-management">
    <div className="stats-grid">
      <article className="stat-card"><span><UsersRound size={16}/></span><small>ช่างในระบบ</small><strong>{loading ? '—' : technicians.length}</strong></article>
      <article className="stat-card"><span><ClipboardList size={16}/></span><small>รอมอบหมายสำรวจ</small><strong>{loading ? '—' : pendingSurvey}</strong></article>
      <article className="stat-card"><span><Wrench size={16}/></span><small>รอมอบหมายติดตั้ง</small><strong>{loading ? '—' : pendingInstall}</strong></article>
      <article className="stat-card"><span><CalendarDays size={16}/></span><small>งานบริการทั้งหมด</small><strong>{loading ? '—' : bookings.length}</strong></article>
    </div>
    <section className="technician-survey-section">
      <div className="workspace-section-heading"><div><h2>มอบหมายและติดตามงานช่าง</h2><p>รายการจองและสถานะ assignment จาก Supabase</p></div><button className="button button-outline small-button" onClick={() => navigate('/manage-bookings')}>ดูการจอง</button></div>
      <div className="admin-toolbar"><div className="admin-toolbar-left"><label className="admin-search-box"><Search size={14}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหาเลขจอง ลูกค้า หรือพื้นที่"/></label><select className="admin-filter-select" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="">ทุกสถานะ</option>{['pending','assigned','confirmed','surveying','survey_completed','quoted','approved','installing','completed','cancelled'].map((s) => <option key={s} value={s}>{s}</option>)}</select></div></div>
      {loading && <p className="technician-message">กำลังโหลดรายการจาก Supabase…</p>}
      {error && <div className="technician-error" role="alert">{error} <button className="button button-outline small-button" onClick={() => setRevision((v) => v + 1)}>ลองอีกครั้ง</button></div>}
      {!loading && !error && <div className="admin-table technician-bookings-table">
        <div className="admin-table-head"><span>งาน / นัดหมาย</span><span>ลูกค้า</span><span>พื้นที่</span><span>สำรวจ</span><span>ติดตั้ง</span><span>รายงาน</span></div>
        {visible.map((booking) => <div className="admin-table-row" key={booking.id}>
          <div><strong>{booking.booking_number}</strong><small>{dateLabel(booking.preferred_at)} · {booking.status}</small></div>
          <div><strong>{booking.customer_name || '—'}</strong><small><Phone size={12}/> {booking.phone}</small></div>
          <div className="technician-location"><strong>{booking.province}</strong><small><MapPin size={12}/> {booking.address}</small></div>
          <AssignmentCell booking={booking} type="survey" technicians={technicians} selection={selection} setSelection={setSelection} saving={saving} onAssign={assign}/>
          <AssignmentCell booking={booking} type="installation" technicians={technicians} selection={selection} setSelection={setSelection} saving={saving} onAssign={assign}/>
          <div>{booking.survey_assignment ? <button className="button button-outline small-button" onClick={() => openReport(booking.id)}>ดูรายงาน</button> : <span className="technician-unassigned">ยังไม่มีรายงาน</span>}<details><summary>ประวัติ ({booking.assignment_history.length})</summary>{booking.assignment_history.map((item)=><small key={item.id}>{item.assignment_type} · {item.profiles?.full_name || item.technician_id.slice(0,8)} · {item.status} · ผู้มอบหมาย {item.assigned_by_name || '—'} · {dateLabel(item.assigned_at)}</small>)}</details></div>
        </div>)}
        {!visible.length && <div className="technician-no-bookings">{bookings.length ? 'ไม่พบงานตามตัวกรอง' : 'ยังไม่มีรายการจองในฐานข้อมูล'}</div>}
      </div>}
    </section>
    <section className="technician-team-section"><div className="workspace-section-heading"><div><h2>ทีมช่าง</h2><p>รายชื่อช่างสำหรับมอบหมายงานสำรวจและติดตั้ง</p></div></div><div className="technician-team-grid">{technicians.map((tech) => <article className="technician-team-card" key={tech.id}>{tech.avatar_url ? <img className="technician-avatar" src={tech.avatar_url} alt=""/> : <div className="technician-avatar">{(tech.full_name || 'ช').slice(0,1)}</div>}<div className="technician-card-info"><strong>{tech.full_name || 'ไม่ระบุชื่อ'}</strong><small>{tech.phone || 'ไม่มีเบอร์โทร'}</small></div></article>)}</div></section>
    {reportError&&<div className="technician-error" role="alert">{reportError}</div>}
    {report&&<div className="workflow-modal-backdrop" onClick={()=>setReport(null)}><section className="workflow-modal" onClick={(e)=>e.stopPropagation()}><button className="button button-outline small-button" onClick={()=>setReport(null)}>ปิด</button>{report.loading?<p>กำลังโหลดรายงาน…</p>:<><h2>รายงานสำรวจหน้างาน</h2><p>ผู้สำรวจ: {report.technician_name || '—'}</p>{reportEdit?<AdminSurveyEditor report={report} saving={reportSaving} onCancel={()=>setReportEdit(false)} onSave={saveReportChanges}/>:<><button className="button button-outline small-button" onClick={()=>setReportEdit(true)}>แก้ไขรายงาน (Admin)</button><div className="form-fields">{[['ผู้ติดต่อ',report.contact_name],['เบอร์โทร',report.contact_phone],['ที่อยู่',report.installation_address],['ประเภทหลังคา',report.roof_type],['พื้นที่หลังคา',report.roof_area_sqm],['ทิศทาง',report.roof_direction],['ระบบแนะนำ (kW)',report.recommended_system_kw],['สภาพพื้นที่',report.site_conditions],['ตำแหน่งแผง',report.panel_location],['ตำแหน่ง Inverter',report.inverter_location],['อุปกรณ์',report.equipment_details],['ปัญหา',report.problems],['ข้อเสนอแนะ',report.recommendations],['วันที่สำรวจ',report.survey_date]].map(([label,value])=><div key={label}><small>{label}</small><p>{value||'—'}</p></div>)}</div><div className="survey-photo-grid">{(report.survey_images||[]).map((image)=><a key={image.id} href={image.url} target="_blank" rel="noreferrer"><img src={image.url} alt={image.caption}/></a>)}</div></>}</>}</section></div>}
  </div>;
}

function AssignmentCell({ booking, type, technicians, selection, setSelection, saving, onAssign }) {
  const current = type === 'survey' ? booking.survey_assignment : booking.installation_assignment;
  const allWorkCompleted = booking.survey_assignment?.status === 'completed'
    && booking.installation_assignment?.status === 'completed';
  const activeTechs = technicians.filter((t) => t.id !== current?.technician_id && ((t.technician_type || 'both') === type || t.technician_type === 'both'));
  const label = type === 'survey' ? 'สำรวจ' : 'ติดตั้ง';
  if (allWorkCompleted || current?.status === 'completed') {
    return <span className="status-pill green">completed</span>;
  }
  if (type === 'installation' && booking.survey_assignment?.status !== 'completed') {
    return <div className="technician-assign-control">
      {current && <small>{current.profiles?.full_name || current.technician_id.slice(0,8)} · {current.status}</small>}
      <span className="technician-unassigned">{booking.survey_assignment ? 'รอสำรวจเสร็จสิ้น' : 'รอมอบหมายงานสำรวจ'}</span>
    </div>;
  }
  return <div className="technician-assign-control">
    {current && <small>{current.profiles?.full_name || current.technician_id.slice(0,8)} · {current.status}</small>}
    <select aria-label={`เลือกช่าง${label}`} value={selection[`${booking.id}:${type}`] || ''} onChange={(e) => setSelection((s) => ({...s,[`${booking.id}:${type}`]:e.target.value}))}>
      <option value="">{current ? `เปลี่ยนช่าง${label}` : `เลือกช่าง${label}`}</option>{activeTechs.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
    </select>
    <button className="button button-green small-button" disabled={!selection[`${booking.id}:${type}`] || saving === `${booking.id}:${type}`} onClick={() => onAssign(booking,type)}>{saving === `${booking.id}:${type}` ? 'บันทึก…' : 'มอบหมาย'}</button>
  </div>;
}

function AdminSurveyEditor({ report, saving, onCancel, onSave }) {
  const [form,setForm]=useState({
    contact_name:report.contact_name||'',contact_phone:report.contact_phone||'',installation_address:report.installation_address||'',
    roof_type:report.roof_type||'',roof_area_sqm:report.roof_area_sqm??'',roof_direction:report.roof_direction||'',
    recommended_system_kw:report.recommended_system_kw??'',panel_location:report.panel_location||'',inverter_location:report.inverter_location||'',
    equipment_details:report.equipment_details||'',site_conditions:report.site_conditions||'',problems:report.problems||'',recommendations:report.recommendations||'',
    survey_date:report.survey_date||'',notes:report.notes||'',
  });
  const update=(key,value)=>setForm((current)=>({...current,[key]:value}));
  const textField=(label,key,wide=false)=> <label className={wide?'full-width':''}>{label}<textarea rows={wide?2:1} value={form[key]} onChange={(e)=>update(key,e.target.value)}/></label>;
  return <form className="form-fields" onSubmit={(e)=>{e.preventDefault();onSave(form);}}>
    {textField('ชื่อผู้ติดต่อ','contact_name')}{textField('เบอร์โทรศัพท์','contact_phone')}{textField('ที่อยู่ติดตั้ง','installation_address',true)}
    {textField('ประเภทหลังคา','roof_type')}{textField('พื้นที่หลังคา (ตร.ม.)','roof_area_sqm')}{textField('ทิศทางหลังคา','roof_direction')}
    {textField('ขนาดระบบแนะนำ (kW)','recommended_system_kw')}{textField('ตำแหน่งแผง Solar','panel_location')}{textField('ตำแหน่ง Inverter','inverter_location')}
    {textField('รายละเอียดอุปกรณ์','equipment_details',true)}{textField('สภาพพื้นที่ติดตั้ง','site_conditions',true)}{textField('ปัญหาหรือข้อจำกัด','problems',true)}{textField('ข้อเสนอแนะ','recommendations',true)}{textField('หมายเหตุ','notes',true)}
    <label>วันที่สำรวจ<input type="date" value={form.survey_date} onChange={(e)=>update('survey_date',e.target.value)}/></label>
    <div className="full-width workflow-actions"><button type="button" className="button button-outline" onClick={onCancel} disabled={saving}>ยกเลิก</button><button type="submit" className="button button-green" disabled={saving}>{saving?'กำลังบันทึก…':'บันทึกการแก้ไข'}</button></div>
  </form>;
}
