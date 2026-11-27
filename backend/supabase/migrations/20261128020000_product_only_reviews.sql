drop policy if exists "Customers can review completed installations or purchases"
  on public.reviews;
drop policy if exists "Customers can review completed purchases or installed products"
  on public.reviews;
drop policy if exists "Customers can publish reviews for completed purchases or installed products"
  on public.reviews;

create policy "Customers can review completed product purchases"
  on public.reviews for insert to authenticated
  with check (
    customer_id = (select auth.uid())
    and is_published = true
    and installation_id is null
    and order_item_id is not null
    and quotation_item_id is null
    and exists (
      select 1
      from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where oi.id = order_item_id
        and oi.product_id is not null
        and oi.package_id is null
        and o.customer_id = (select auth.uid())
        and o.status = 'completed'
    )
  );
