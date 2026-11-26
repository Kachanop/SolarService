alter table public.reviews
  add column if not exists quotation_item_id uuid
    references public.quotation_items (id) on delete restrict;

alter table public.reviews
  drop constraint if exists reviews_exactly_one_target;

alter table public.reviews
  add constraint reviews_exactly_one_target check (
    num_nonnulls(installation_id, order_item_id, quotation_item_id) = 1
  );

create unique index if not exists reviews_quotation_item_customer_uidx
  on public.reviews (quotation_item_id, customer_id)
  where quotation_item_id is not null;

drop policy if exists "Customers can review completed installations or purchases"
  on public.reviews;
drop policy if exists "Customers can review completed purchases or installed products"
  on public.reviews;

create policy "Customers can review completed purchases or installed products"
  on public.reviews for insert to authenticated
  with check (
    customer_id = (select auth.uid())
    and is_published = false
    and (
      (
        installation_id is not null
        and order_item_id is null
        and quotation_item_id is null
        and exists (
          select 1
          from public.installations i
          where i.id = installation_id
            and i.customer_id = (select auth.uid())
            and i.status = 'completed'
        )
      )
      or
      (
        installation_id is null
        and order_item_id is not null
        and quotation_item_id is null
        and exists (
          select 1
          from public.order_items oi
          join public.orders o on o.id = oi.order_id
          where oi.id = order_item_id
            and o.customer_id = (select auth.uid())
            and o.status = 'completed'
        )
      )
      or
      (
        installation_id is null
        and order_item_id is null
        and quotation_item_id is not null
        and exists (
          select 1
          from public.quotation_items qi
          join public.quotations q on q.id = qi.quotation_id
          join public.installations i
            on i.quotation_id = q.id
            or (
              i.quotation_id is null
              and i.booking_id = q.booking_id
              and q.status = 'approved'
            )
          where qi.id = quotation_item_id
            and qi.product_id is not null
            and q.customer_id = (select auth.uid())
            and i.customer_id = (select auth.uid())
            and i.status = 'completed'
        )
      )
    )
  );

drop policy if exists "Customers can view products from completed installations"
  on public.products;

create policy "Customers can view products from completed installations"
  on public.products for select to authenticated
  using (
    exists (
      select 1
      from public.quotation_items qi
      join public.quotations q on q.id = qi.quotation_id
      join public.installations i
        on i.quotation_id = q.id
        or (
          i.quotation_id is null
          and i.booking_id = q.booking_id
          and q.status = 'approved'
        )
      where qi.product_id = products.id
        and q.customer_id = (select auth.uid())
        and i.customer_id = (select auth.uid())
        and i.status = 'completed'
    )
    or exists (
      select 1
      from public.warranties w
      join public.installations i on i.id = w.installation_id
      where w.product_id = products.id
        and i.customer_id = (select auth.uid())
        and i.status = 'completed'
    )
  );

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
        from public.quotation_items qi
        where qi.id = r.quotation_item_id
          and qi.product_id = p_product_id
      )
      or exists (
        select 1
        from public.warranties w
        where w.installation_id = r.installation_id
          and w.product_id = p_product_id
      )
      or exists (
        select 1
        from public.installations i
        join public.quotations q
          on i.quotation_id = q.id
          or (
            i.quotation_id is null
            and i.booking_id = q.booking_id
            and q.status = 'approved'
          )
        join public.quotation_items qi on qi.quotation_id = q.id
        where i.id = r.installation_id
          and qi.product_id = p_product_id
      )
    )
  order by r.created_at desc
$$;

revoke all on function public.get_public_product_reviews(uuid) from public;
grant execute on function public.get_public_product_reviews(uuid) to anon, authenticated;
