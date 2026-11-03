import { supabase } from '../lib/supabase.js';

const SLOT_START_HOURS = [9, 10, 11, 12, 13, 14, 15, 16];
const SERVICE_TYPE_PREFIX = /^\[service_type:(survey|installation|maintenance)\]\s*/;

export const SERVICE_TYPES = [
  { value: 'survey', label: 'สำรวจหน้างาน', description: 'ประเมินพื้นที่และการใช้ไฟก่อนติดตั้ง' },
  { value: 'installation', label: 'ติดตั้งระบบ', description: 'นัดหมายติดตั้งระบบโซลาร์เซลล์' },
  { value: 'maintenance', label: 'บำรุงรักษา', description: 'ตรวจสอบและดูแลระบบที่ติดตั้งแล้ว' },
];

const serviceTypeLabels = Object.fromEntries(SERVICE_TYPES.map(({ value, label }) => [value, label]));

function requireSupabase() {
  if (!supabase) {
    throw new Error('กรุณาตั้งค่า Supabase ก่อนใช้งานระบบจองบริการ');
  }
  return supabase;
}

function parseLocalDate(dateValue) {
  const [year, month, day] = dateValue.split('-').map(Number);
  if (!year || !month || !day) throw new Error('รูปแบบวันที่ไม่ถูกต้อง');
  return new Date(year, month - 1, day);
}

function localDateTimeToIso(dateValue, hour) {
  const date = parseLocalDate(dateValue);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

function getLocalDateWindow(dateValue) {
  const start = parseLocalDate(dateValue);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

function makeBookingNotes(serviceType, notes) {
  return `[service_type:${serviceType}]${notes ? ` ${notes.trim()}` : ''}`;
}

function parseBooking(row) {
  const noteText = row.notes || '';
  const serviceTypeMatch = noteText.match(SERVICE_TYPE_PREFIX);
  return {
    ...row,
    service_type: serviceTypeMatch?.[1] || null,
    service_type_label: serviceTypeLabels[serviceTypeMatch?.[1]] || null,
    notes: noteText.replace(SERVICE_TYPE_PREFIX, ''),
  };
}

function assertBookingEditableResult(error) {
  if (!error) return;
  if (error.code === '42501' || error.code === 'PGRST116') {
    throw new Error('ไม่สามารถแก้ไขการจองได้ เนื่องจาก RLS ของ Supabase ยังไม่อนุญาตให้ลูกค้าแก้ไขรายการ');
  }
  throw error;
}

export async function getMyProfile() {
  const client = requireSupabase();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError) throw authError;
  if (!user) return null;

  const { data, error } = await client
    .from('profiles')
    .select('id,full_name,phone')
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getMyBookings() {
  const client = requireSupabase();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error('กรุณาเข้าสู่ระบบเพื่อดูรายการจอง');

  const { data, error } = await client
    .from('service_bookings')
    .select('id,booking_number,customer_id,preferred_at,address,province,phone,notes,status,created_at,updated_at')
    .eq('customer_id', user.id)
    .order('preferred_at', { ascending: true });

  if (error) throw error;
  return (data || []).map(parseBooking);
}

export async function getSlotAvailability(dateValue, excludeBookingId = null) {
  if (!dateValue) return [];
  const client = requireSupabase();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error('กรุณาเข้าสู่ระบบเพื่อตรวจสอบเวลานัดหมาย');

  const { start, end } = getLocalDateWindow(dateValue);
  const { data, error } = await client
    .from('service_bookings')
    .select('id,preferred_at,status')
    .gte('preferred_at', start)
    .lt('preferred_at', end)
    .neq('status', 'cancelled');

  if (error) throw error;

  const bookedHours = new Set((data || [])
    .filter((booking) => booking.id !== excludeBookingId)
    .map(({ preferred_at }) => new Date(preferred_at).getHours()));

  return SLOT_START_HOURS.map((hour) => {
    const slotDate = new Date(localDateTimeToIso(dateValue, hour));
    const endDate = new Date(slotDate.getTime() + 60 * 60 * 1000);
    const isInPast = slotDate <= new Date();
    const slotLabel = (date) => date.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    return {
      slot_start: slotDate.toISOString(),
      slot_label: `${slotLabel(slotDate)} - ${slotLabel(endDate)}`,
      booked: bookedHours.has(hour) ? 1 : 0,
      is_available: !bookedHours.has(hour) && !isInPast,
      unavailable_reason: bookedHours.has(hour) ? 'booked' : isInPast ? 'past' : null,
      availability_scope: 'customer_visible_bookings_only',
    };
  });
}

export async function createBooking({ serviceType, preferredAt, phone, address, province, notes }) {
  const client = requireSupabase();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error('กรุณาเข้าสู่ระบบก่อนจองบริการ');
  if (!SERVICE_TYPES.some(({ value }) => value === serviceType)) throw new Error('ประเภทบริการไม่ถูกต้อง');
  if (!preferredAt || !phone || !address?.trim() || !province) {
    throw new Error('กรุณากรอกข้อมูลการจองให้ครบถ้วน');
  }

  const selectedDate = new Date(preferredAt);
  if (Number.isNaN(selectedDate.getTime()) || selectedDate <= new Date()) {
    const error = new Error('วันและเวลานัดหมายต้องเป็นเวลาในอนาคต');
    error.code = 'SLOT_IN_PAST';
    throw error;
  }

  const availability = await getSlotAvailability(
    `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`,
  );
  const selectedSlot = availability.find((slot) => slot.slot_start === selectedDate.toISOString());
  if (!selectedSlot) {
    const error = new Error('ช่วงเวลาที่เลือกไม่อยู่ในตารางนัดหมาย กรุณาเลือกเวลาใหม่');
    error.code = 'INVALID_SLOT';
    throw error;
  }
  if (!selectedSlot.is_available) {
    const error = new Error('คุณมีรายการจองในช่วงเวลานี้แล้ว กรุณาเลือกเวลาอื่น');
    error.code = 'SLOT_FULL';
    throw error;
  }

  const payload = {
    customer_id: user.id,
    preferred_at: selectedDate.toISOString(),
    address: address.trim(),
    province,
    phone,
    notes: makeBookingNotes(serviceType, notes),
    status: 'pending',
  };

  const { data, error } = await client
    .from('service_bookings')
    .insert(payload)
    .select('id,booking_number,customer_id,preferred_at,address,province,phone,notes,status,created_at,updated_at')
    .single();

  if (error) throw error;
  return parseBooking(data);
}

export async function cancelBooking(bookingId) {
  const client = requireSupabase();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error('กรุณาเข้าสู่ระบบก่อนยกเลิกการจอง');

  const { data, error } = await client
    .from('service_bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId)
    .eq('customer_id', user.id)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle();

  assertBookingEditableResult(error);
  if (!data) {
    throw new Error('ยกเลิกการจองไม่ได้: สิทธิ์ RLS ไม่อนุญาต หรือรายการไม่ได้อยู่ในสถานะรอดำเนินการ');
  }
  return data;
}

export async function rescheduleBooking(bookingId, preferredAt) {
  const client = requireSupabase();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error('กรุณาเข้าสู่ระบบก่อนเลื่อนนัดหมาย');

  const selectedDate = new Date(preferredAt);
  if (Number.isNaN(selectedDate.getTime()) || selectedDate <= new Date()) {
    const error = new Error('วันและเวลานัดหมายต้องเป็นเวลาในอนาคต');
    error.code = 'SLOT_IN_PAST';
    throw error;
  }

  const dateValue = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
  const slots = await getSlotAvailability(dateValue, bookingId);
  const selectedSlot = slots.find((slot) => slot.slot_start === selectedDate.toISOString());
  if (!selectedSlot) throw new Error('ช่วงเวลาที่เลือกไม่อยู่ในตารางนัดหมาย');
  if (!selectedSlot.is_available) throw new Error('ช่วงเวลานี้มีการจองแล้ว กรุณาเลือกช่วงเวลาอื่น');

  const { data, error } = await client
    .from('service_bookings')
    .update({ preferred_at: selectedDate.toISOString() })
    .eq('id', bookingId)
    .eq('customer_id', user.id)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle();

  assertBookingEditableResult(error);
  if (!data) {
    throw new Error('เลื่อนนัดหมายไม่ได้: สิทธิ์ RLS ไม่อนุญาต หรือรายการไม่ได้อยู่ในสถานะรอดำเนินการ');
  }
  return data;
}
