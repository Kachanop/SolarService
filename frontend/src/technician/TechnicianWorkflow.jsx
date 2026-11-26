import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Calendar, Check, ClipboardList, ImagePlus, MapPin, Phone, Save, Send, User, Wrench } from 'lucide-react';
import { getInstallationImages, getInstallationTechnicians, getMyWorkflowAssignments, getSurveyImageUrl, saveInstallationProgress, saveSurveyDraft, submitSurvey, uploadInstallationImages, uploadSurveyImages, updateAssignment } from '../services/technicianWorkflowService.js';
import './technicianJob.css';

const emptyForm = (booking, survey) => ({
  contact_name: survey?.contact_name || '', contact_phone: survey?.contact_phone || booking?.phone || '', installation_address: survey?.installation_address || booking?.address || '',
  roof_type: survey?.roof_type || '', roof_area_sqm: survey?.roof_area_sqm ?? '', roof_direction: survey?.roof_direction || '',
  site_conditions: survey?.site_conditions || '', recommended_system_kw: survey?.recommended_system_kw ?? '', panel_location: survey?.panel_location || '',
  inverter_location: survey?.inverter_location || '', equipment_details: survey?.equipment_details || '', problems: survey?.problems || '', recommendations: survey?.recommendations || '',
  survey_date: survey?.survey_date || new Date().toISOString().slice(0,10), notes: survey?.notes || '',
});

export default function TechnicianWorkflow({ authUser, route, setToast, navigate }) {
  const [assignments, setAssignments] = useState([]);
  const [selectedId, setSelectedId] = useState(() => new URLSearchParams(window.location.hash.split('?')[1] || '').get('bookingId') || '');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [files, setFiles] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [installationTechnicians, setInstallationTechnicians] = useState([]);
  const [installationTechnicianId, setInstallationTechnicianId] = useState('');
  const [form, setForm] = useState(emptyForm(null, null));
  const [installNotes, setInstallNotes] = useState('');
  const [installStatus, setInstallStatus] = useState('in_progress');

  async function reload() {
    setLoading(true); setError('');
    try {
      const data = await getMyWorkflowAssignments(); setAssignments(data);
      const surveyJobs = data.filter((a) => a.assignment_type === 'survey');
      const target = surveyJobs.find((a) => a.booking_id === selectedId) || surveyJobs[0] || null;
      setSelectedId(target?.booking_id || ''); setForm(emptyForm(target?.booking, target?.survey));
    } catch (reason) { setError(reason.message || 'โหลดงานไม่สำเร็จ'); }
    finally { setLoading(false); }
  }
  useEffect(() => { reload(); }, [authUser?.id]);
  useEffect(() => {
    if (route !== '/survey') return undefined;
    let active = true;
    getInstallationTechnicians().then((data) => { if (active) setInstallationTechnicians(data); }).catch((reason) => { if (active) setError(reason.message || 'โหลดรายชื่อช่างติดตั้งไม่สำเร็จ'); });
    return () => { active = false; };
  }, [route, authUser?.id]);

  const surveyAssignments = assignments.filter((a) => a.assignment_type === 'survey');
  const selected = surveyAssignments.find((a) => a.booking_id === selectedId) || surveyAssignments[0];
  const installationAssignments = assignments.filter((a) => a.assignment_type === 'installation');
  useEffect(() => {
    let active = true;
    async function loadPhotos() {
      const images = selected?.survey?.survey_images || [];
      try { const urls = await Promise.all(images.map(async (image) => ({ ...image, url: await getSurveyImageUrl(image.storage_path) }))); if (active) setPhotos(urls); }
      catch (reason) { if (active && images.length) setError(reason.message); }
    }
    loadPhotos(); return () => { active = false; };
  }, [selected?.survey?.id, assignments.length]);
  useEffect(() => { if (selected) setForm(emptyForm(selected.booking, selected.survey)); }, [selected?.booking_id, selected?.survey?.updated_at]);

  async function saveDraft(event) {
    event?.preventDefault();
    if (!selected) return;
    setSaving(true); setError('');
    try {
      const survey = await saveSurveyDraft(selected.booking, authUser, form);
      if (files.length) { await uploadSurveyImages(selected.booking, survey.id, authUser, files); setFiles([]); }
      setToast('บันทึกร่างและรูปภาพแล้ว'); await reload();
    } catch (reason) { setError(reason.message || 'บันทึกแบบร่างไม่สำเร็จ'); }
    finally { setSaving(false); }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const required = ['contact_name','contact_phone','installation_address','roof_type','roof_area_sqm','roof_direction','site_conditions','recommended_system_kw','panel_location','inverter_location','equipment_details','survey_date'];
    if (required.some((key) => !String(form[key] ?? '').trim())) { setError('กรุณากรอกข้อมูลสำรวจที่จำเป็นให้ครบก่อนส่งรายงาน'); return; }
    setSaving(true); setError('');
    try { const survey = await saveSurveyDraft(selected.booking, authUser, form); if (files.length) await uploadSurveyImages(selected.booking, survey.id, authUser, files); await submitSurvey(selected.booking_id, installationTechnicianId); setFiles([]); setToast(installationTechnicianId ? 'ส่งรายงานและมอบหมายช่างติดตั้งแล้ว' : 'ส่งรายงานแล้ว รอ Admin มอบหมายช่างติดตั้ง'); navigate('/jobs'); }
    catch (reason) { setError(reason.message || 'ส่งรายงานไม่สำเร็จ'); }
    finally { setSaving(false); }
  }

  async function changeAssignment(assignment, status) {
    setSaving(true); setError('');
    try { await updateAssignment(assignment,status); setToast('อัปเดตสถานะงานแล้ว'); await reload(); }
    catch (reason) { setError(reason.message || 'อัปเดตสถานะไม่สำเร็จ'); }
    finally { setSaving(false); }
  }
  async function saveInstall(assignment, selectedFiles = []) {
    setSaving(true); setError('');
    try {
      if (selectedFiles.length && installStatus === 'completed') await uploadInstallationImages(assignment.booking_id,authUser,selectedFiles);
      await saveInstallationProgress(assignment,installNotes,installStatus);
      if (selectedFiles.length && installStatus !== 'completed') await uploadInstallationImages(assignment.booking_id,authUser,selectedFiles);
      setToast('บันทึกความคืบหน้าและรูปภาพแล้ว'); await reload();
    }
    catch (reason) { setError(reason.message || 'บันทึกความคืบหน้าไม่สำเร็จ'); }
    finally { setSaving(false); }
  }

  const detailId = new URLSearchParams(window.location.hash.split('?')[1] || '').get('bookingId');
  const detail = assignments.find((a) => a.booking_id === detailId);
  const surveyLocked = selected?.survey?.status === 'submitted';
  if (loading) return <div className="workspace-wrap"><p className="technician-message">กำลังโหลดงานจาก Supabase…</p></div>;
  return <div className="workspace-wrap technician-workspace">
    <div className="workspace-heading"><div><div className="eyebrow">TECHNICIAN WORKSPACE</div><h1>{route === '/survey' ? 'รายงานสำรวจหน้างาน' : 'รายละเอียดและส่งต่องาน'}</h1><p>งานและรายงานจาก Supabase</p></div><button className="button button-outline small-button" onClick={() => navigate('/jobs')}>กลับรายการงาน</button></div>
    {error && <div className="technician-error" role="alert"><AlertCircle size={16}/>{error}</div>}
    {route === '/survey' && <>
      {!surveyAssignments.length ? <div className="technician-empty"><ClipboardList/><strong>ไม่มีงานสำรวจที่ได้รับมอบหมาย</strong></div> : <form className="job-card survey-card" onSubmit={handleSubmit}>
        <div className="field">
          <label className="field-label" htmlFor="survey-job">เลือกงาน</label>
          <select id="survey-job" value={selected?.booking_id || ''} onChange={(e) => { setSelectedId(e.target.value); const item = surveyAssignments.find((a) => a.booking_id === e.target.value); setForm(emptyForm(item?.booking, item?.survey)); }}>
            {surveyAssignments.map((a) => <option key={a.id} value={a.booking_id}>{a.booking?.booking_number} · {a.booking?.province} · {statusLabel(a.status)}</option>)}
          </select>
        </div>

        {selected && <>
          <header className="job-card-head">
            <h2>{selected.booking?.booking_number} · สำรวจหน้างาน</h2>
            <span className={`status-badge status-${selected.status}`}>{statusLabel(selected.status)}</span>
          </header>
          <ul className="job-meta">
            <li><User size={16}/>{selected.booking?.customer?.full_name || 'ลูกค้า'}</li>
            <li><MapPin size={16}/>{selected.booking?.address}, {selected.booking?.province}</li>
            <li><Phone size={16}/>{selected.booking?.phone || '—'}</li>
            <li><Calendar size={16}/>นัดหมาย {selected.booking?.preferred_at ? new Date(selected.booking.preferred_at).toLocaleString('th-TH') : '—'}</li>
          </ul>
          <div className="job-actions">
            {selected.status === 'assigned' && <button type="button" className="button button-outline" disabled={saving} onClick={() => changeAssignment(selected, 'accepted')}><Check size={15}/>ยืนยันรับงาน</button>}
            {selected.status === 'accepted' && <button type="button" className="button button-green" disabled={saving} onClick={() => changeAssignment(selected, 'in_progress')}>เริ่มสำรวจ</button>}
          </div>
        </>}

        {surveyLocked && <div className="locked-note">ส่งรายงานแล้ว หากต้องแก้ไขกรุณาติดต่อ Admin</div>}

        <section className="job-section">
          <h3>ข้อมูลผู้ติดต่อ</h3>
          <div className="field-grid">
            <Field label="ชื่อผู้ติดต่อ" name="contact_name" form={form} setForm={setForm} disabled={surveyLocked}/>
            <Field label="เบอร์โทรศัพท์" name="contact_phone" form={form} setForm={setForm} type="tel" disabled={surveyLocked}/>
            <Field label="ที่อยู่ติดตั้ง" name="installation_address" form={form} setForm={setForm} wide disabled={surveyLocked}/>
          </div>
        </section>

        <section className="job-section">
          <h3>หลังคาและพื้นที่ติดตั้ง</h3>
          <div className="field-grid">
            <label className="field"><span className="field-label">ประเภทหลังคา<em aria-hidden="true"> *</em></span>
              <select required disabled={surveyLocked} value={form.roof_type} onChange={(e) => setForm({ ...form, roof_type: e.target.value })}>
                <option value="">เลือกประเภท</option>{['กระเบื้อง', 'เมทัลชีท', 'คอนกรีต', 'อื่น ๆ'].map((x) => <option key={x}>{x}</option>)}
              </select></label>
            <Field label="พื้นที่หลังคา (ตร.ม.)" name="roof_area_sqm" form={form} setForm={setForm} type="number" disabled={surveyLocked}/>
            <label className="field"><span className="field-label">ทิศทางหลังคา<em aria-hidden="true"> *</em></span>
              <select required disabled={surveyLocked} value={form.roof_direction} onChange={(e) => setForm({ ...form, roof_direction: e.target.value })}>
                <option value="">เลือกทิศทาง</option>{['เหนือ', 'ใต้', 'ตะวันออก', 'ตะวันตก', 'หลายทิศ'].map((x) => <option key={x} value={x}>ทิศ{x}</option>)}
              </select></label>
            <Field label="สภาพพื้นที่ติดตั้ง" name="site_conditions" form={form} setForm={setForm} disabled={surveyLocked}/>
            <Field label="ระบบแนะนำ (kW)" name="recommended_system_kw" form={form} setForm={setForm} type="number" disabled={surveyLocked}/>
            <label className="field"><span className="field-label">วันที่สำรวจ<em aria-hidden="true"> *</em></span>
              <input required disabled={surveyLocked} type="date" value={form.survey_date} onChange={(e) => setForm({ ...form, survey_date: e.target.value })}/></label>
            <Field label="ตำแหน่งติดตั้งแผง Solar" name="panel_location" form={form} setForm={setForm} disabled={surveyLocked}/>
            <Field label="ตำแหน่งติดตั้ง Inverter" name="inverter_location" form={form} setForm={setForm} disabled={surveyLocked}/>
          </div>
        </section>

        <section className="job-section">
          <h3>อุปกรณ์และข้อสังเกต</h3>
          <div className="field-grid">
            <Field label="รายละเอียดอุปกรณ์" name="equipment_details" form={form} setForm={setForm} wide multiline disabled={surveyLocked}/>
            <Field label="ปัญหาหรือข้อจำกัด" name="problems" form={form} setForm={setForm} wide multiline disabled={surveyLocked}/>
            <Field label="ข้อเสนอแนะ" name="recommendations" form={form} setForm={setForm} wide multiline disabled={surveyLocked}/>
            <Field label="หมายเหตุเพิ่มเติม" name="notes" form={form} setForm={setForm} wide multiline disabled={surveyLocked}/>
          </div>
        </section>

        <section className="job-section">
          <h3>รูปภาพหน้างาน</h3>
          <label className={`dropzone${surveyLocked ? ' is-disabled' : ''}`} htmlFor="survey-files">
            <ImagePlus size={22}/>
            <span className="dropzone-title">{files.length ? `เลือกรูปใหม่ ${files.length} รูป` : 'แตะเพื่อเลือกรูปภาพ'}</span>
            <span className="dropzone-hint">JPG / PNG / WebP · ไม่เกิน 10MB ต่อรูป · เลือกได้หลายรูป</span>
            <input id="survey-files" disabled={surveyLocked} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => setFiles([...e.target.files])}/>
          </label>
          {files.length > 0 && <ul className="file-list">{files.map((f) => <li key={f.name + f.size}>{f.name}</li>)}</ul>}
          {photos.length > 0 && <div className="survey-photo-grid">{photos.map((photo) => <a href={photo.url} target="_blank" rel="noreferrer" key={photo.id}><img src={photo.url} alt={photo.caption}/><small>{photo.caption}</small></a>)}</div>}
        </section>

        {!surveyLocked && <section className="job-section">
          <h3>ส่งรายงาน</h3>
          <div className="field">
            <label className="field-label" htmlFor="install-tech">มอบหมายช่างติดตั้งตอนนี้ (ไม่บังคับ)</label>
            <select id="install-tech" value={installationTechnicianId} onChange={(e) => setInstallationTechnicianId(e.target.value)}>
              <option value="">ให้ Admin มอบหมายภายหลัง</option>
              {installationTechnicians.map((technician) => <option key={technician.id} value={technician.id}>{technician.full_name}</option>)}
            </select>
          </div>
          <div className="survey-actions">
            <button type="button" className="button button-outline" disabled={saving} onClick={() => saveDraft()}><Save size={15}/>บันทึกร่าง</button>
            <button className="button button-green" disabled={saving || selected?.status !== 'in_progress'}><Send size={15}/>{saving ? 'กำลังบันทึก…' : 'ส่งรายงานและส่งต่องาน'}</button>
          </div>
          {selected?.status !== 'in_progress' && <p className="hint">รับงานและเริ่มสำรวจก่อนส่งรายงาน</p>}
        </section>}
      </form>}
    </>}
    {route !== '/survey' && (detail ? <JobDetail assignment={detail} authUser={authUser} onChange={changeAssignment} installNotes={installNotes} setInstallNotes={setInstallNotes} installStatus={installStatus} setInstallStatus={setInstallStatus} onSave={saveInstall} saving={saving}/> : <div className="technician-empty"><Wrench/><strong>ไม่พบงานนี้หรือไม่มีสิทธิ์เข้าถึง</strong></div>)}
    {route !== '/survey' && !detail && installationAssignments.map((assignment)=><div className="technician-job-card" key={assignment.id}>{assignment.booking?.booking_number} · {assignment.status}</div>)}
  </div>;
}

const REQUIRED_FIELDS = ['contact_name', 'contact_phone', 'installation_address', 'roof_area_sqm', 'site_conditions', 'recommended_system_kw', 'panel_location', 'inverter_location', 'equipment_details'];

function Field({ label, name, form, setForm, type = 'text', wide = false, multiline = false, disabled = false }) {
  const required = REQUIRED_FIELDS.includes(name);
  const common = { disabled, required, value: form[name], onChange: (e) => setForm({ ...form, [name]: e.target.value }) };
  return <label className={`field${wide ? ' wide' : ''}`}>
    <span className="field-label">{label}{required && <em aria-hidden="true"> *</em>}</span>
    {multiline
      ? <textarea rows="3" {...common}/>
      : <input type={type} min={type === 'number' ? '0' : undefined} step={type === 'number' ? '0.1' : undefined} {...common}/>}
  </label>;
}

const STATUS_LABELS = {
  assigned: 'รอรับงาน',
  accepted: 'รับงานแล้ว',
  in_progress: 'กำลังดำเนินการ',
  completed: 'เสร็จสิ้น',
  cancelled: 'ยกเลิก',
};
const statusLabel = (s) => STATUS_LABELS[s] || s;

function JobDetail({ assignment, authUser, onChange, installNotes, setInstallNotes, installStatus, setInstallStatus, onSave, saving }) {
  const b = assignment.booking, s = assignment.survey;
  const [installationPhotos, setInstallationPhotos] = useState([]);
  const [surveyPhotos, setSurveyPhotos] = useState([]);
  const [newFiles, setNewFiles] = useState([]);

  useEffect(() => { let active = true; if (assignment.assignment_type !== 'installation') return undefined; getInstallationImages(assignment.booking_id).then((data) => { if (active) setInstallationPhotos(data); }).catch(() => {}); return () => { active = false; }; }, [assignment.booking_id, assignment.assignment_type]);
  useEffect(() => { let active = true; const images = s?.survey_images || []; Promise.all(images.map(async (image) => ({ ...image, url: await getSurveyImageUrl(image.storage_path) }))).then((data) => { if (active) setSurveyPhotos(data); }).catch(() => {}); return () => { active = false; }; }, [s?.id]);

  const isInstall = assignment.assignment_type === 'installation';
  const appointment = b?.preferred_at ? new Date(b.preferred_at).toLocaleString('th-TH') : '—';

  return (
    <article className="job-card">
      <header className="job-card-head">
        <h2>{b?.booking_number} · {isInstall ? 'งานติดตั้ง' : 'สำรวจหน้างาน'}</h2>
        <span className={`status-badge status-${assignment.status}`}>{statusLabel(assignment.status)}</span>
      </header>

      <ul className="job-meta">
        <li><MapPin size={16} />{b?.address}, {b?.province}</li>
        <li><Phone size={16} />{b?.phone || '—'}</li>
        <li><Calendar size={16} />นัดหมาย {appointment}</li>
      </ul>

      <div className="job-actions">
        {assignment.status === 'assigned' && <button className="button button-green" disabled={saving} onClick={() => onChange(assignment, 'accepted')}><Check size={15} />ยืนยันรับงาน</button>}
        {assignment.assignment_type === 'survey' && assignment.status === 'accepted' && <button className="button button-green" disabled={saving} onClick={() => onChange(assignment, 'in_progress')}>เริ่มสำรวจ</button>}
        {isInstall && assignment.status === 'accepted' && <button className="button button-green" disabled={saving} onClick={() => { setInstallStatus('in_progress'); onSave(assignment, []); }}>เริ่มติดตั้ง</button>}
        {assignment.assignment_type === 'survey' && <a className="button button-outline" href="#/survey">เปิดแบบฟอร์มสำรวจ</a>}
      </div>

      {s && <section className="job-section">
        <h3>รายงานสำรวจ</h3>
        <div className="info-grid">
          {[['ผู้ติดต่อ', s.contact_name], ['เบอร์โทร', s.contact_phone], ['ที่อยู่', s.installation_address], ['หลังคา', `${s.roof_type || '—'} · ${s.roof_area_sqm || '—'} ตร.ม. · ${s.roof_direction || '—'}`], ['ระบบแนะนำ', `${s.recommended_system_kw || '—'} kW`], ['สภาพพื้นที่', s.site_conditions], ['ตำแหน่งแผง', s.panel_location], ['ตำแหน่ง Inverter', s.inverter_location], ['อุปกรณ์', s.equipment_details], ['ข้อจำกัด', s.problems], ['ข้อเสนอแนะ', s.recommendations]].map(([label, value]) => <div className="info-item" key={label}><small>{label}</small><p>{value || '—'}</p></div>)}
        </div>
        {surveyPhotos.length > 0 && <div className="survey-photo-grid">{surveyPhotos.map((photo) => <a key={photo.id} href={photo.url} target="_blank" rel="noreferrer"><img src={photo.url} alt={photo.caption} /></a>)}</div>}
      </section>}

      {isInstall && <section className="job-section">
        <h3>อัปเดตงานติดตั้ง</h3>
        <div className="job-form">
          <div className="field">
            <label htmlFor="install-notes">บันทึกความคืบหน้า</label>
            <textarea id="install-notes" rows="4" placeholder="เช่น ติดตั้งแผงเสร็จแล้ว 8 จาก 12 แผง" value={installNotes || assignment.installation?.installation_notes || ''} onChange={(e) => setInstallNotes(e.target.value)} />
          </div>

          <div className="field">
            <label htmlFor="install-status">สถานะติดตั้ง</label>
            <select id="install-status" value={installStatus} onChange={(e) => setInstallStatus(e.target.value)}>
              {['accepted', 'in_progress', 'completed', 'cancelled'].map((x) => <option key={x} value={x}>{statusLabel(x)}</option>)}
            </select>
          </div>

          <div className="field">
            <span className="field-label">รูปภาพงานติดตั้ง</span>
            <label className="dropzone" htmlFor="install-files">
              <ImagePlus size={22} />
              <span className="dropzone-title">{newFiles.length ? `เลือกแล้ว ${newFiles.length} รูป` : 'แตะเพื่อเลือกรูปภาพ'}</span>
              <span className="dropzone-hint">JPG / PNG / WebP · เลือกได้หลายรูป</span>
              <input id="install-files" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => setNewFiles([...e.target.files])} />
            </label>
            {newFiles.length > 0 && <ul className="file-list">{newFiles.map((f) => <li key={f.name + f.size}>{f.name}</li>)}</ul>}
          </div>

          <button className="button button-green job-submit" disabled={saving} onClick={() => onSave(assignment, newFiles)}>
            <Wrench size={15} />{saving ? 'กำลังบันทึก…' : 'บันทึกสถานะ ความคืบหน้า และรูปภาพ'}
          </button>
        </div>

        {installationPhotos.length > 0 && <div className="survey-photo-grid">{installationPhotos.map((photo) => <a key={photo.id} href={photo.url} target="_blank" rel="noreferrer"><img src={photo.url} alt="ภาพงานติดตั้ง" /></a>)}</div>}
      </section>}
    </article>
  );
}
//