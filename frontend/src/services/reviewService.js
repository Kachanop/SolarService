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

export async function getPublishedReviews(limit = 20) {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('get_public_reviews', {
    p_limit: limit,
  });
  if (!error) {
    return Array.isArray(data)
      ? data.filter((review) => review.product_id && ['product', 'installation_product'].includes(review.target_type))
      : [];
  }

  const message = [error?.message, error?.details, error?.hint].filter(Boolean).join(' ');
  if (error?.code === 'PGRST202' || /get_public_reviews|schema cache/i.test(message)) {
    const { data: fallbackRows, error: fallbackError } = await supabase
      .from('reviews')
      .select('id,rating,comment,created_at,order_item_id,order_items!inner(id,product_id,product_name,package_id)')
      .eq('is_published', true)
      .not('order_item_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (fallbackError) throw fallbackError;
    return (fallbackRows || [])
      .filter((row) => row.order_items?.product_id && !row.order_items.package_id)
      .map((row) => ({
        ...row,
        customer_name: 'ผู้ใช้งานจริง',
        target_label: row.order_items.product_name,
        target_type: 'product',
        product_id: row.order_items.product_id,
        package_id: null,
      }));
  }

  throw error;
}
