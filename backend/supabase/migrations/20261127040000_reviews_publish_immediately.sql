drop policy if exists "Customers can review completed purchases or installed products"
  on public.reviews;
drop policy if exists "Customers can publish reviews for completed purchases or installed products"
  on public.reviews;

create policy "Customers can publish reviews for completed purchases or installed products"
  on public.reviews for insert to authenticated
  with check (
    customer_id = (select auth.uid())
    and is_published = true
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
