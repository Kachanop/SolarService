-- 1. Ensure existing reviews are published so they display on product cards and detail modals
update public.reviews
set is_published = true
where is_published = false;

-- 2. Ensure quotations helper columns exist defensively
alter table public.quotations
  add column if not exists system_size_kw numeric(8, 2) check (system_size_kw is null or system_size_kw > 0),
  add column if not exists customer_phone text not null default '';

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'quotations'
      and column_name = 'net_total'
  ) then
    alter table public.quotations
      add column net_total numeric(12, 2) generated always as (total - discount) stored;
  end if;
end $$;

-- 3. Do NOT create quotations inside create_order (before payment is completed)
create or replace function public.create_order(
  p_shipping_name text,
  p_shipping_phone text,
  p_shipping_address text,
  p_items jsonb,
  p_notes text default ''
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer_id uuid := (select auth.uid());
  v_order_id uuid;
  v_product_items jsonb;
  v_package_items jsonb;
  v_product_subtotal numeric(12, 2) := 0;
  v_package_subtotal numeric(12, 2) := 0;
  v_subtotal numeric(12, 2) := 0;
begin
  if v_customer_id is null then
    raise exception using errcode = '28000', message = 'Authentication is required';
  end if;
  if nullif(trim(p_shipping_name), '') is null
    or nullif(trim(p_shipping_phone), '') is null
    or nullif(trim(p_shipping_address), '') is null then
    raise exception using errcode = '22023', message = 'Shipping name, phone, and address are required';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception using errcode = '22023', message = 'At least one order item is required';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(p_items) as item(value)
    where jsonb_typeof(item.value) <> 'object'
      or coalesce(item.value ->> 'quantity', '') !~ '^[1-9][0-9]*$'
      or (
        (coalesce(item.value ->> 'product_id', '') = '' and coalesce(item.value ->> 'package_id', '') = '')
        or (coalesce(item.value ->> 'product_id', '') <> '' and coalesce(item.value ->> 'package_id', '') <> '')
      )
  ) then
    raise exception using errcode = '22023', message = 'Each item needs a product_id or package_id and positive integer quantity';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object('product_id', normalized.product_id, 'quantity', normalized.quantity)), '[]'::jsonb)
  into v_product_items
  from (
    select (item.value ->> 'product_id')::uuid as product_id,
      sum((item.value ->> 'quantity')::integer)::integer as quantity
    from jsonb_array_elements(p_items) as item(value)
    where coalesce(item.value ->> 'product_id', '') <> ''
    group by (item.value ->> 'product_id')::uuid
  ) as normalized;

  select coalesce(jsonb_agg(jsonb_build_object('package_id', normalized.package_id, 'quantity', normalized.quantity)), '[]'::jsonb)
  into v_package_items
  from (
    select (item.value ->> 'package_id')::uuid as package_id,
      sum((item.value ->> 'quantity')::integer)::integer as quantity
    from jsonb_array_elements(p_items) as item(value)
    where coalesce(item.value ->> 'package_id', '') <> ''
    group by (item.value ->> 'package_id')::uuid
  ) as normalized;

  if jsonb_array_length(v_product_items) > 0 then
    perform p.id
    from public.products as p
    join jsonb_to_recordset(v_product_items) as item(product_id uuid, quantity integer)
      on item.product_id = p.id
    where p.is_active
    order by p.id
    for update of p;

    if exists (
      select 1
      from jsonb_to_recordset(v_product_items) as item(product_id uuid, quantity integer)
      left join public.products as p on p.id = item.product_id and p.is_active
      where p.id is null
    ) then
      raise exception using errcode = '22023', message = 'One or more products are unavailable';
    end if;

    select coalesce(sum(p.price * item.quantity), 0)
    into v_product_subtotal
    from jsonb_to_recordset(v_product_items) as item(product_id uuid, quantity integer)
    join public.products as p on p.id = item.product_id;
  end if;

  if jsonb_array_length(v_package_items) > 0 then
    perform pkg.id
    from public.packages as pkg
    join jsonb_to_recordset(v_package_items) as item(package_id uuid, quantity integer)
      on item.package_id = pkg.id
    where pkg.is_active
    order by pkg.id
    for update of pkg;

    if exists (
      select 1
      from jsonb_to_recordset(v_package_items) as item(package_id uuid, quantity integer)
      left join public.packages as pkg on pkg.id = item.package_id and pkg.is_active
      where pkg.id is null
    ) then
      raise exception using errcode = '22023', message = 'One or more packages are unavailable';
    end if;

    select coalesce(sum(pkg.price * item.quantity), 0)
    into v_package_subtotal
    from jsonb_to_recordset(v_package_items) as item(package_id uuid, quantity integer)
    join public.packages as pkg on pkg.id = item.package_id;
  end if;

  v_subtotal := v_product_subtotal + v_package_subtotal;

  insert into public.orders (
    customer_id, subtotal, shipping_fee, total,
    shipping_name, shipping_phone, shipping_address, notes
  )
  values (
    v_customer_id, v_subtotal, 0, v_subtotal,
    trim(p_shipping_name), trim(p_shipping_phone), trim(p_shipping_address), coalesce(p_notes, '')
  )
  returning id into v_order_id;

  if jsonb_array_length(v_product_items) > 0 then
    insert into public.order_items (order_id, product_id, product_name, unit_price, quantity)
    select v_order_id, p.id, p.name, p.price, item.quantity
    from jsonb_to_recordset(v_product_items) as item(product_id uuid, quantity integer)
    join public.products as p on p.id = item.product_id;
  end if;

  if jsonb_array_length(v_package_items) > 0 then
    insert into public.order_items (order_id, package_id, product_name, unit_price, quantity)
    select v_order_id, pkg.id, pkg.name, pkg.price, item.quantity
    from jsonb_to_recordset(v_package_items) as item(package_id uuid, quantity integer)
    join public.packages as pkg on pkg.id = item.package_id;
  end if;

  return v_order_id;
end;
$$;

revoke all on function public.create_order(text, text, text, jsonb, text) from public;
grant execute on function public.create_order(text, text, text, jsonb, text) to authenticated;

-- 4. Create quotation ONLY after payment is confirmed (orders.status becomes confirmed/completed)
create or replace function public.approve_quotation_on_order_confirm()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_quotation_id uuid;
  v_first_package_id uuid;
  v_total_kw numeric(8, 2);
begin
  if new.status in ('confirmed', 'completed') and old.status is distinct from new.status then
    update public.quotations
    set status = 'approved',
        customer_response_at = coalesce(customer_response_at, now())
    where order_id = new.id
      and status in ('draft', 'sent');

    if not exists (select 1 from public.quotations where order_id = new.id)
       and exists (select 1 from public.order_items where order_id = new.id and package_id is not null) then
      select
        (array_agg(oi.package_id order by oi.created_at, oi.id))[1],
        coalesce(sum(pkg.system_size_kw * oi.quantity), 1.00)
      into v_first_package_id, v_total_kw
      from public.order_items oi
      join public.packages pkg on pkg.id = oi.package_id
      where oi.order_id = new.id
        and oi.package_id is not null;

      insert into public.quotations (
        order_id,
        package_id,
        customer_id,
        created_by,
        status,
        subtotal,
        discount,
        total,
        system_size_kw,
        customer_phone,
        valid_until,
        notes,
        customer_response_at
      )
      values (
        new.id,
        v_first_package_id,
        new.customer_id,
        new.customer_id,
        'approved',
        new.subtotal,
        0,
        new.total,
        v_total_kw,
        coalesce(new.shipping_phone, ''),
        (current_date + interval '15 days')::date,
        coalesce(nullif(trim(new.notes), ''), 'ใบเสนอราคาจากคำสั่งซื้อแพ็กเกจที่ชำระเงินแล้ว'),
        now()
      )
      returning id into v_quotation_id;

      insert into public.quotation_items (quotation_id, product_id, package_id, description, quantity, unit_price)
      select v_quotation_id, oi.product_id, oi.package_id, oi.product_name, oi.quantity, oi.unit_price
      from public.order_items oi
      where oi.order_id = new.id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists approve_quotation_on_order_confirm on public.orders;
create trigger approve_quotation_on_order_confirm
  after update of status on public.orders
  for each row execute function public.approve_quotation_on_order_confirm();

-- Revoke pre-payment direct quotation RPC so quotations are only generated after payment
revoke all on function public.create_package_quotation(uuid, integer, text) from public, authenticated;

-- 5. Update get_public_product_reviews to also match warranties by equipment_model/SKU
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
        join public.products prod on prod.id = p_product_id
        where w.installation_id = r.installation_id
          and (
            w.product_id = p_product_id
            or lower(trim(w.equipment_model)) = lower(trim(prod.name))
            or (nullif(trim(prod.sku), '') is not null and lower(trim(w.equipment_model)) = lower(trim(prod.sku)))
          )
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

-- 6. Update get_public_reviews so installation warranty reviews resolve product_id and target_label
create or replace function public.get_public_reviews(p_limit integer default 20)
returns table (
  id uuid,
  rating integer,
  comment text,
  created_at timestamptz,
  customer_name text,
  target_label text,
  target_type text,
  product_id uuid,
  package_id uuid
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
    coalesce(nullif(split_part(trim(p.full_name), ' ', 1), ''), 'ผู้ใช้งานจริง') as customer_name,
    coalesce(
      oi.product_name,
      qi.description,
      w_prod.name,
      w.equipment_model,
      pkg.name,
      case when i.installation_number is not null then 'งานติดตั้ง ' || i.installation_number else null end,
      'บริการติดตั้งโซลาร์เซลล์'
    ) as target_label,
    case
      when r.order_item_id is not null and oi.package_id is not null then 'package'
      when r.order_item_id is not null then 'product'
      when r.quotation_item_id is not null and qi.package_id is not null then 'package'
      when r.quotation_item_id is not null then 'installation_product'
      when coalesce(w.product_id, w_prod.id) is not null then 'installation_product'
      else 'installation'
    end as target_type,
    coalesce(oi.product_id, qi.product_id, w.product_id, w_prod.id) as product_id,
    coalesce(oi.package_id, qi.package_id, q.package_id) as package_id
  from public.reviews r
  left join public.profiles p on p.id = r.customer_id
  left join public.order_items oi on oi.id = r.order_item_id
  left join public.quotation_items qi on qi.id = r.quotation_item_id
  left join public.installations i on i.id = r.installation_id
  left join public.quotations q on q.id = coalesce(qi.quotation_id, i.quotation_id)
  left join public.packages pkg on pkg.id = coalesce(oi.package_id, qi.package_id, q.package_id)
  left join lateral (
    select w1.product_id, w1.equipment_model
    from public.warranties w1
    where w1.installation_id = r.installation_id
    order by w1.created_at desc
    limit 1
  ) w on r.installation_id is not null
  left join lateral (
    select prod.id, prod.name
    from public.products prod
    where prod.id = w.product_id
       or lower(trim(prod.name)) = lower(trim(coalesce(w.equipment_model, '')))
       or (nullif(trim(prod.sku), '') is not null and lower(trim(prod.sku)) = lower(trim(coalesce(w.equipment_model, ''))))
    limit 1
  ) w_prod on w.equipment_model is not null or w.product_id is not null
  where r.is_published
  order by r.created_at desc
  limit greatest(1, least(coalesce(p_limit, 20), 50))
$$;

revoke all on function public.get_public_reviews(integer) from public;
grant execute on function public.get_public_reviews(integer) to anon, authenticated;
