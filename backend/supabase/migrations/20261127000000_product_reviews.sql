alter table public.reviews
  alter column installation_id drop not null,
  add column order_item_id uuid references public.order_items (id) on delete restrict,
  drop constraint reviews_installation_id_customer_id_key,
  add constraint reviews_exactly_one_target check (
    (installation_id is not null and order_item_id is null)
    or (installation_id is null and order_item_id is not null)
  );

create unique index reviews_installation_customer_uidx
  on public.reviews (installation_id, customer_id)
  where installation_id is not null;

create unique index reviews_order_item_customer_uidx
  on public.reviews (order_item_id, customer_id)
  where order_item_id is not null;

create policy "Customers can view products they purchased"
  on public.products for select to authenticated
  using (
    exists (
      select 1
      from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where oi.product_id = products.id
        and o.customer_id = (select auth.uid())
    )
  );

drop policy "Customers can review their completed installations" on public.reviews;

create policy "Customers can review completed installations or purchases"
  on public.reviews for insert to authenticated
  with check (
    customer_id = (select auth.uid())
    and is_published = false
    and (
      (
        installation_id is not null
        and order_item_id is null
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
        and exists (
          select 1
          from public.order_items oi
          join public.orders o on o.id = oi.order_id
          where oi.id = order_item_id
            and o.customer_id = (select auth.uid())
            and o.status = 'completed'
        )
      )
    )
  );
