create or replace function public.get_public_product_reviews(p_product_id uuid)
returns table (
  id uuid,
  rating integer,
  comment text,
  created_at timestamptz,
  customer_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    r.id,
    r.rating,
    r.comment,
    r.created_at,
    coalesce(nullif(split_part(trim(p.full_name), ' ', 1), ''), 'ผู้ซื้อสินค้า') as customer_name
  from public.reviews r
  join public.order_items oi on oi.id = r.order_item_id
  left join public.profiles p on p.id = r.customer_id
  where r.is_published
    and oi.product_id = p_product_id
  order by r.created_at desc
$$;

revoke all on function public.get_public_product_reviews(uuid) from public;
grant execute on function public.get_public_product_reviews(uuid) to anon, authenticated;
