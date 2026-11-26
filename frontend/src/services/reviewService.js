import { supabase, supabaseConfigError } from '../lib/supabase.js';

export async function getPublishedProductReviews(productId) {
  if (!supabase) throw new Error(supabaseConfigError || 'Supabase is not configured');
  const { data, error } = await supabase.rpc('get_public_product_reviews', {
    p_product_id: productId,
  });
  if (error) throw error;
  if (!Array.isArray(data)) throw new Error('รีวิวสินค้าที่ได้รับมีรูปแบบไม่ถูกต้อง');
  return data;
}
