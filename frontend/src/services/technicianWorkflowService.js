import { supabase } from '../lib/supabase.js';

function client() {
  if (!supabase) throw new Error('ตั้งค่า Supabase ก่อนใช้งานระบบงานช่าง');
  return supabase;
}

export async function getMyWorkflowAssignments() {
  const db = client();
  const { data: { user }, error: authError } = await db.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error('กรุณาเข้าสู่ระบบ');
  const { data, error } = await db.from('technician_assignments').select(`
    id, booking_id, technician_id, assignment_type, status, assigned_at, accepted_at,
    service_bookings!inner(id,booking_number,status,preferred_at,address,province,phone,notes,customer_id,customer:profiles!service_bookings_customer_id_fkey(full_name),installations(status,notes,completed_at,started_at),site_surveys(id,status,contact_name,contact_phone,installation_address,roof_type,roof_area_sqm,roof_direction,recommended_system_kw,panel_location,inverter_location,equipment_details,site_conditions,problems,recommendations,survey_date,notes,submitted_at,survey_images(id,storage_path,caption)))
  `).eq('technician_id', user.id).neq('status', 'cancelled').order('assigned_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((row) => {
    const booking = Array.isArray(row.service_bookings) ? row.service_bookings[0] : row.service_bookings;
    const installation = Array.isArray(booking?.installations) ? booking.installations[0] : booking?.installations;
    const survey = Array.isArray(booking?.site_surveys) ? booking.site_surveys[0] : booking?.site_surveys;
    return { ...row, booking, installation: installation ? { ...installation, installation_notes: installation.notes } : null, survey };
  });
}

export async function updateTechnicianType(technicianId, technicianType) {
  const { error } = await client().from('profiles').update({ technician_type: technicianType }).eq('id',technicianId);
  if (error) throw error;
}

export async function saveSurveyDraft(booking, user, form) {
  const db = client();
  const payload = {
    booking_id: booking.id, technician_id: user.id,
    contact_name: form.contact_name.trim(), contact_phone: form.contact_phone.trim(), installation_address: form.installation_address.trim(),
    roof_type: form.roof_type || null, roof_area_sqm: form.roof_area_sqm === '' ? null : Number(form.roof_area_sqm), roof_direction: form.roof_direction || null,
    recommended_system_kw: form.recommended_system_kw === '' ? null : Number(form.recommended_system_kw), panel_location: form.panel_location.trim(),
    inverter_location: form.inverter_location.trim(), equipment_details: form.equipment_details.trim(), site_conditions: form.site_conditions.trim(),
    problems: form.problems.trim(), recommendations: form.recommendations.trim(), survey_date: form.survey_date || null, notes: form.notes.trim(), status: 'draft',
  };
  const { data, error } = await db.from('site_surveys').upsert(payload, { onConflict: 'booking_id' }).select('id').single();
  if (error) throw error;
  return data;
}

export async function uploadSurveyImages(booking, surveyId, user, files) {
  const db = client();
  for (const file of files) {
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('รองรับไฟล์ JPG, PNG หรือ WebP เท่านั้น');
    if (file.size > 10 * 1024 * 1024) throw new Error('รูปภาพต้องมีขนาดไม่เกิน 10 MB');
    const ext = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1];
    const path = `${user.id}/${booking.id}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await db.storage.from('site-survey-images').upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) throw uploadError;
    const { error } = await db.from('survey_images').insert({ survey_id: surveyId, storage_path: path, uploaded_by: user.id, caption: file.name });
    if (error) throw error;
  }
}

export async function getSurveyImageUrl(path) {
  const { data, error } = await client().storage.from('site-survey-images').createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}

export async function uploadInstallationImages(bookingId, user, files) {
  const db = client();
  for (const file of files) {
    if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) throw new Error('รูปภาพต้องเป็น JPG, PNG หรือ WebP และไม่เกิน 10 MB');
    const ext = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1];
    const path = `${user.id}/${bookingId}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await db.storage.from('installation-images').upload(path,file,{contentType:file.type});
    if (uploadError) throw uploadError;
    const { error } = await db.from('installation_images').insert({booking_id:bookingId,storage_path:path,uploaded_by:user.id});
    if (error) throw error;
  }
}

export async function getInstallationImages(bookingId) {
  const { data, error } = await client().from('installation_images').select('id,storage_path,created_at').eq('booking_id',bookingId).order('created_at');
  if (error) throw error;
  return Promise.all((data || []).map(async (image) => {
    const { data: signed, error: signedError } = await client().storage.from('installation-images').createSignedUrl(image.storage_path,3600);
    if (signedError) throw signedError;
    return {...image,url:signed.signedUrl};
  }));
}

export async function submitSurvey(bookingId) {
  const { error } = await client().rpc('submit_site_survey', { p_booking_id: bookingId });
  if (error) throw error;
}

export async function updateAssignment(assignment, status) {
  const { error } = await client().rpc('update_technician_assignment', { p_assignment_id: assignment.id, p_status: status, p_notes: null });
  if (error) throw error;
}

export async function saveInstallationProgress(assignment, notes, status) {
  const { error } = await client().rpc('update_technician_assignment', { p_assignment_id: assignment.id, p_status: status, p_notes: notes });
  if (error) throw error;
}

export async function getAdminTechnicianWorkflow() {
  const db = client();
  const fetchAll = async (buildQuery) => {
    const rows = [];
    const pageSize = 1000;
    for (let start = 0; ; start += pageSize) {
      const { data, error } = await buildQuery().range(start, start + pageSize - 1);
      if (error) throw error;
      rows.push(...(data || []));
      if (!data || data.length < pageSize) return rows;
    }
  };
  const [bookingResult, techResult, assignmentResult] = await Promise.all([
    fetchAll(() => db.from('service_bookings').select('id,booking_number,customer_id,preferred_at,address,province,phone,notes,status,created_at').order('preferred_at', { ascending: true })),
    fetchAll(() => db.from('profiles').select('id,full_name,phone,role,technician_type').eq('role','technician').order('full_name')),
    fetchAll(() => db.from('technician_assignments').select('id,booking_id,technician_id,assignment_type,status,assigned_at,assigned_by')),
  ]);
  const getProfilesByIds = async (ids) => {
    const uniqueIds = [...new Set(ids.filter(Boolean))];
    const profiles = [];
    for (let start = 0; start < uniqueIds.length; start += 500) {
      const { data, error } = await db.from('profiles').select('id,full_name').in('id', uniqueIds.slice(start, start + 500));
      if (error) throw error;
      profiles.push(...(data || []));
    }
    return profiles;
  };
  const [customers, assigners] = await Promise.all([
    getProfilesByIds(bookingResult.map((b) => b.customer_id)),
    getProfilesByIds(assignmentResult.map((a) => a.assigned_by)),
  ]);
  const customerNames = new Map(customers.map((p) => [p.id,p.full_name]));
  const technicianById = new Map(techResult.map((technician) => [technician.id, technician]));
  const assignerById = new Map(assigners.map((profile) => [profile.id, profile]));
  const assignments = assignmentResult.map((assignment) => ({ ...assignment, profiles: technicianById.get(assignment.technician_id), assigned_by_name: assignerById.get(assignment.assigned_by)?.full_name || '' }));
  const bookings = bookingResult.map((booking) => {
    const history = assignments.filter((a) => a.booking_id === booking.id).sort((a,b)=>new Date(b.assigned_at)-new Date(a.assigned_at));
    const assigned = history.filter((a) => a.status !== 'cancelled');
    return { ...booking, customer_name: customerNames.get(booking.customer_id) || '', assignments: assigned, assignment_history: history,
      survey_assignment: assigned.find((a) => a.assignment_type === 'survey'), installation_assignment: assigned.find((a) => a.assignment_type === 'installation') };
  });
  return { bookings, technicians: techResult, assignments };
}

export async function getAdminSurveyReport(bookingId) {
  const db=client();
  const {data,error}=await db.from('site_surveys').select('*,survey_images(id,storage_path,caption,created_at)').eq('booking_id',bookingId).maybeSingle();
  if(error)throw error;
  if(!data)return null;
  const images=await Promise.all((data.survey_images||[]).map(async(image)=>{
    const {data:signed,error:signedError}=await db.storage.from('site-survey-images').createSignedUrl(image.storage_path,3600);
    if(signedError)throw signedError;
    return {...image,url:signed.signedUrl};
  }));
  const {data:technician}=await db.from('profiles').select('full_name').eq('id',data.technician_id).maybeSingle();
  return {...data,technician_name:technician?.full_name||'',survey_images:images};
}

export async function updateAdminSurvey(surveyId, form) {
  const payload = {
    contact_name: form.contact_name.trim(), contact_phone: form.contact_phone.trim(), installation_address: form.installation_address.trim(),
    roof_type: form.roof_type || null, roof_area_sqm: form.roof_area_sqm === '' ? null : Number(form.roof_area_sqm), roof_direction: form.roof_direction || null,
    recommended_system_kw: form.recommended_system_kw === '' ? null : Number(form.recommended_system_kw), panel_location: form.panel_location.trim(),
    inverter_location: form.inverter_location.trim(), equipment_details: form.equipment_details.trim(), site_conditions: form.site_conditions.trim(),
    problems: form.problems.trim(), recommendations: form.recommendations.trim(), survey_date: form.survey_date || null, notes: form.notes.trim(),
  };
  const { error } = await client().from('site_surveys').update(payload).eq('id', surveyId);
  if (error) throw error;
}

export async function assignTechnician(bookingId, technicianId, assignmentType, adminId) {
  const db = client();
  const { error } = await db.rpc('assign_booking_technician', { p_booking_id: bookingId, p_technician_id: technicianId, p_assignment_type: assignmentType });
  if (error) throw error;
}
