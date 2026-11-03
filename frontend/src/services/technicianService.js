import { supabase } from '../lib/supabase.js';

export async function getMyAssignments() {
  if (!supabase) {
    throw new Error('กรุณาตั้งค่า Supabase ก่อนใช้งานระบบช่าง');
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) return [];

  const { data, error } = await supabase
    .from('technician_assignments')
    .select(`
      id,
      assigned_at,
      service_bookings!inner(
        id,
        booking_number,
        status,
        preferred_at,
        address,
        province,
        phone,
        notes,
        customer_id,
        created_at
      )
    `)
    .eq('technician_id', user.id)
    .order('assigned_at', { ascending: false });

  if (error) throw error;

  return (data || [])
    .map((assignment) => {
      const booking = Array.isArray(assignment.service_bookings)
        ? assignment.service_bookings[0]
        : assignment.service_bookings;

      if (!booking) return null;

      return {
        assignmentId: assignment.id,
        id: booking.id,
        booking_number: booking.booking_number,
        status: booking.status,
        preferred_at: booking.preferred_at,
        address: booking.address,
        province: booking.province,
        phone: booking.phone,
        notes: booking.notes || '',
        customer_id: booking.customer_id,
        created_at: booking.created_at,
        assigned_at: assignment.assigned_at,
      };
    })
    .filter(Boolean);
}
