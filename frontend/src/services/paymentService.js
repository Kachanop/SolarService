import { supabase } from '../lib/supabase.js';

async function getAccessToken() {
  if (!supabase) throw new Error('กรุณาตั้งค่า Supabase ก่อนทำรายการชำระเงิน');
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!session?.access_token) throw new Error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
  return session.access_token;
}

async function apiRequest(path, options = {}) {
  const accessToken = await getAccessToken();
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  const response = await fetch(`${apiBaseUrl.replace(/\/$/, '')}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'เชื่อมต่อระบบชำระเงินไม่สำเร็จ');
  return result;
}

export function createPromptPayQr(orderId) {
  return apiRequest('/create-promptpay-qr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId }),
  });
}

export function getPromptPayPaymentStatus(orderId) {
  return apiRequest(`/orders/${encodeURIComponent(orderId)}/payment-status`);
}
