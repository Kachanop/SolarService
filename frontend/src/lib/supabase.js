import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabaseConfigError = !supabaseUrl || !supabaseKey
  ? 'ตั้งค่า VITE_SUPABASE_URL และ VITE_SUPABASE_PUBLISHABLE_KEY ใน .env.local ก่อนใช้งานระบบสมาชิก'
  : null;

export const supabase = supabaseConfigError
  ? null
  : createClient(supabaseUrl, supabaseKey);
