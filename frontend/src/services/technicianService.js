import { supabase } from '../lib/supabase.js';
import { getMyWorkflowAssignments } from './technicianWorkflowService.js';

export async function getMyAssignments() {
  if (!supabase) {
    throw new Error('กรุณาตั้งค่า Supabase ก่อนใช้งานระบบช่าง');
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) return [];

  const rows = await getMyWorkflowAssignments();
  return rows.map((assignment) => ({
    assignmentId: assignment.id,
    assignment_type: assignment.assignment_type,
    assignment_status: assignment.status,
    id: assignment.booking?.id,
    booking_number: assignment.booking?.booking_number,
    status: assignment.booking?.status,
    preferred_at: assignment.booking?.preferred_at,
    address: assignment.booking?.address,
    province: assignment.booking?.province,
    phone: assignment.booking?.phone,
    customer_name: assignment.booking?.customer?.full_name || '',
    notes: assignment.booking?.notes || '',
    customer_id: assignment.booking?.customer_id,
    created_at: assignment.booking?.created_at,
    assigned_at: assignment.assigned_at,
    survey: assignment.survey,
    installation: assignment.installation,
  }));
}
