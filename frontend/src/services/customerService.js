import { supabase } from '../lib/supabase.js';

function requireSupabase() {
  if (!supabase) throw new Error('กรุณาตั้งค่า Supabase ก่อนใช้งาน');
  return supabase;
}

async function getUser() {
  const client = requireSupabase();
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('กรุณาเข้าสู่ระบบ');
  return data.user;
}

export async function getMyOrders() {
  const user = await getUser();
  const { data, error } = await supabase
    .from('orders')
    .select('*,order_items(id,product_name,unit_price,quantity,line_total)')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getMyQuotes() {
  const user = await getUser();
  const { data, error } = await supabase
    .from('quotations')
    .select('*,quotation_items(id,description,quantity,unit_price,line_total)')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function respondToQuote(quoteId, accepted) {
  await getUser();
  const { error } = await supabase.rpc('respond_to_quotation', {
    p_quotation_id: quoteId,
    p_accept: accepted,
  });
  if (error) throw error;
}

export async function getMyInstallations() {
  const user = await getUser();
  const { data, error } = await supabase
    .from('installations')
    .select('*,service_bookings(id,booking_number,address,province,preferred_at)')
    .eq('customer_id', user.id)
    .order('scheduled_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getMyWarranties() {
  const user = await getUser();
  const { data, error } = await supabase
    .from('warranties')
    .select('*')
    .eq('customer_id', user.id)
    .order('warranty_end', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getMyMaintenance() {
  const user = await getUser();
  const { data, error } = await supabase
    .from('maintenance_reminders')
    .select('*')
    .eq('customer_id', user.id)
    .order('due_date', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getMyTickets() {
  const user = await getUser();
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createRepairTicket({ title, description, category, priority, warrantyId }) {
  const user = await getUser();
  const payload = {
    customer_id: user.id,
    title: title.trim(),
    description: description.trim(),
    category,
    priority,
  };
  if (warrantyId) payload.warranty_id = warrantyId;
  const { data, error } = await supabase
    .from('support_tickets')
    .insert(payload)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function getMyCompletedReviewableOrderItems() {
  const user = await getUser();
  const { data: orderItems, error: orderItemsError } = await supabase
    .from('order_items')
    .select('id,product_id,product_name,unit_price,quantity,created_at,products(name,category,description,image_url),orders!inner(id,order_number,status,customer_id)')
    .eq('orders.customer_id', user.id)
    .eq('orders.status', 'completed')
    .order('created_at', { ascending: false });
  if (orderItemsError) throw orderItemsError;
  const items = orderItems || [];
  if (!items.length) return [];

  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('order_item_id')
    .in('order_item_id', items.map((item) => item.id));
  if (error) throw error;
  const reviewed = new Set((reviews || []).map((item) => item.order_item_id));
  return items.filter((item) => !reviewed.has(item.id));
}

export async function getMyReviews() {
  const user = await getUser();
  const { data, error } = await supabase
    .from('reviews')
    .select('*,installations(id,installation_number)')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;

  const reviews = data || [];
  const orderItemIds = [...new Set(reviews.map((review) => review.order_item_id).filter(Boolean))];
  if (!orderItemIds.length) return reviews;

  const { data: orderItems, error: orderItemsError } = await supabase
    .from('order_items')
    .select('id,product_name,unit_price,quantity,products(name,category,image_url)')
    .in('id', orderItemIds);
  if (orderItemsError) throw orderItemsError;
  const orderItemsById = new Map((orderItems || []).map((item) => [item.id, item]));
  return reviews.map((review) => ({
    ...review,
    order_items: orderItemsById.get(review.order_item_id) || null,
  }));
}

export async function createReview({ orderItemId, rating, comment }) {
  const user = await getUser();
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      order_item_id: orderItemId,
      customer_id: user.id,
      rating,
      comment: comment.trim(),
      is_published: false,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function uploadPaymentSlip({ orderId, amount, file }) {
  const user = await getUser();
  if (!file) throw new Error('กรุณาเลือกไฟล์สลิป');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('รองรับเฉพาะไฟล์รูปภาพ JPG, PNG หรือ WebP');
  }
  if (file.size > 5 * 1024 * 1024) throw new Error('ไฟล์สลิปต้องมีขนาดไม่เกิน 5 MB');

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${user.id}/${orderId}/${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from('payment-slips')
    .upload(path, file, { cacheControl: '3600', upsert: false });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from('payments')
    .insert({
      order_id: orderId,
      customer_id: user.id,
      amount,
      method: 'bank_transfer',
      status: 'submitted',
      slip_url: path,
      paid_at: new Date().toISOString(),
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}
