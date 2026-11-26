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
  left join public.profiles p on p.id = r.customer_id
  where r.is_published
    and (
      exists (
        select 1
        from public.order_items oi
        where oi.id = r.order_item_id
          and oi.product_id = p_product_id
      )
      or exists (
        select 1
        from public.warranties w
        where w.installation_id = r.installation_id
          and w.product_id = p_product_id
      )
    )
  order by r.created_at desc
$$;

revoke all on function public.get_public_product_reviews(uuid) from public;
grant execute on function public.get_public_product_reviews(uuid) to anon, authenticated;
