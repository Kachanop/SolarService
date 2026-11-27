-- 1. Update any existing 1-baht test package named "เทส" to 10 baht (Stripe PromptPay minimum)
update public.packages
set price = 10.00,
    updated_at = now()
where name = 'เทส'
  and price < 10.00;

-- Seed 10-baht test package (and standard packages if absent) into public.packages
insert into public.packages (
  name,
  slug,
  system_size_kw,
  description,
  price,
  features,
  is_active
)
values (
  'แพ็กเกจทดสอบการชำระเงิน 10 บาท',
  'package-test-10-baht',
  1.00,
  'แพ็กเกจทดลองสำหรับตรวจสอบขั้นตอนสั่งซื้อ สร้างใบเสนอราคา และชำระเงิน PromptPay ยอดขั้นต่ำตาม Stripe',
  10.00,
  '["แพ็กเกจทดลองระบบ 1 kW","ออกใบเสนอราคาอัตโนมัติ","รองรับชำระเงิน PromptPay 10 บาท"]'::jsonb,
  true
)
on conflict (slug) do update set
  name = excluded.name,
  system_size_kw = excluded.system_size_kw,
  description = excluded.description,
  price = excluded.price,
  features = excluded.features,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.packages (
  name,
  slug,
  system_size_kw,
  description,
  price,
  features,
  is_active
)
values
  (
    'แพ็กเกจ 3 kW สำหรับบ้านขนาดเล็ก',
    'package-3kw',
    3.00,
    'ชุดโซลาร์รูฟท็อปครบชุด เหมาะกับบ้านที่ใช้ไฟเดือนละ 1,500–2,500 บาท',
    89000.00,
    '["แผงโซลาร์ 6 แผ่น","อินเวอร์เตอร์ 3 kW","โครงสร้างยึดหลังคา","ค่าติดตั้งและเดินสาย","รับประกันงานติดตั้ง 5 ปี"]'::jsonb,
    true
  ),
  (
    'แพ็กเกจ 5 kW สำหรับบ้านทั่วไป',
    'package-5kw',
    5.00,
    'คุ้มค่าที่สุดสำหรับครอบครัวที่ใช้แอร์หลายเครื่อง ลดค่าไฟได้ต่อเนื่อง',
    139000.00,
    '["แผงโซลาร์ 10 แผ่น","อินเวอร์เตอร์ 5 kW","ระบบมอนิเตอร์ผ่านแอป","ค่าติดตั้งและเดินสาย","รับประกันงานติดตั้ง 5 ปี"]'::jsonb,
    true
  ),
  (
    'แพ็กเกจ 10 kW สำหรับร้านค้า/โรงงานเล็ก',
    'package-10kw',
    10.00,
    'รองรับการใช้ไฟช่วงกลางวันสูง ช่วยลดต้นทุนพลังงานของธุรกิจ',
    259000.00,
    '["แผงโซลาร์ 20 แผ่น","อินเวอร์เตอร์ 10 kW","ระบบมอนิเตอร์ผ่านแอป","ค่าติดตั้งและเดินสาย","รับประกันงานติดตั้ง 5 ปี"]'::jsonb,
    true
  )
on conflict (slug) do nothing;

-- 2. Allow order_items and quotations to reference packages directly
alter table public.order_items
  add column if not exists package_id uuid references public.packages (id) on delete set null;

alter table public.quotations
  alter column booking_id drop not null;

alter table public.quotations
  add column if not exists order_id uuid references public.orders (id) on delete set null,
  add column if not exists package_id uuid references public.packages (id) on delete set null;

alter table public.quotation_items
  add column if not exists package_id uuid references public.packages (id) on delete set null;

create index if not exists quotations_order_idx on public.quotations (order_id) where order_id is not null;

-- 3. Update create_order to support both products and packages, and auto-create a quotation for package orders
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
  v_quotation_id uuid;
  v_first_package_id uuid;
  v_total_kw numeric(8, 2);
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

    select
      (array_agg(pkg.id order by pkg.id))[1],
      coalesce(sum(pkg.system_size_kw * item.quantity), 1.00)
    into v_first_package_id, v_total_kw
    from jsonb_to_recordset(v_package_items) as item(package_id uuid, quantity integer)
    join public.packages as pkg on pkg.id = item.package_id;

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
      notes
    )
    values (
      v_order_id,
      v_first_package_id,
      v_customer_id,
      v_customer_id,
      'sent',
      v_subtotal,
      0,
      v_subtotal,
      v_total_kw,
      trim(p_shipping_phone),
      (current_date + interval '15 days')::date,
      coalesce(nullif(trim(p_notes), ''), 'ใบเสนอราคาจากคำสั่งซื้อแพ็กเกจติดตั้ง')
    )
    returning id into v_quotation_id;

    if jsonb_array_length(v_product_items) > 0 then
      insert into public.quotation_items (quotation_id, product_id, description, quantity, unit_price)
      select v_quotation_id, p.id, p.name, item.quantity, p.price
      from jsonb_to_recordset(v_product_items) as item(product_id uuid, quantity integer)
      join public.products as p on p.id = item.product_id;
    end if;

    insert into public.quotation_items (quotation_id, package_id, description, quantity, unit_price)
    select v_quotation_id, pkg.id, pkg.name, item.quantity, pkg.price
    from jsonb_to_recordset(v_package_items) as item(package_id uuid, quantity integer)
    join public.packages as pkg on pkg.id = item.package_id;
  end if;

  return v_order_id;
end;
$$;

revoke all on function public.create_order(text, text, text, jsonb, text) from public;
grant execute on function public.create_order(text, text, text, jsonb, text) to authenticated;

-- 4. Approve linked package quotation automatically when order payment is confirmed
create or replace function public.approve_quotation_on_order_confirm()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status in ('confirmed', 'completed') and old.status is distinct from new.status then
    update public.quotations
    set status = 'approved',
        customer_response_at = coalesce(customer_response_at, now())
    where order_id = new.id
      and status in ('draft', 'sent');
  end if;
  return new;
end;
$$;

drop trigger if exists approve_quotation_on_order_confirm on public.orders;
create trigger approve_quotation_on_order_confirm
  after update of status on public.orders
  for each row execute function public.approve_quotation_on_order_confirm();

-- 5. Direct package quotation RPC for authenticated customers
create or replace function public.create_package_quotation(
  p_package_id uuid,
  p_quantity integer default 1,
  p_notes text default ''
)
returns table (
  id uuid,
  quote_number text,
  package_id uuid,
  package_name text,
  system_size_kw numeric,
  quantity integer,
  unit_price numeric,
  subtotal numeric,
  discount numeric,
  total numeric,
  net_total numeric,
  status text,
  valid_until date,
  notes text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer_id uuid := (select auth.uid());
  v_package public.packages%rowtype;
  v_profile public.profiles%rowtype;
  v_quote public.quotations%rowtype;
  v_qty integer := greatest(1, coalesce(p_quantity, 1));
  v_subtotal numeric(12, 2);
begin
  if v_customer_id is null then
    raise exception using errcode = '28000', message = 'กรุณาเข้าสู่ระบบก่อนสร้างใบเสนอราคา';
  end if;

  select * into v_package
  from public.packages
  where public.packages.id = p_package_id
    and public.packages.is_active = true;
  if not found then
    raise exception using errcode = 'P0002', message = 'ไม่พบแพ็กเกจติดตั้งที่ต้องการ';
  end if;

  select * into v_profile
  from public.profiles
  where public.profiles.id = v_customer_id;

  v_subtotal := v_package.price * v_qty;

  insert into public.quotations (
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
    notes
  )
  values (
    v_package.id,
    v_customer_id,
    v_customer_id,
    'sent',
    v_subtotal,
    0,
    v_subtotal,
    v_package.system_size_kw * v_qty,
    coalesce(v_profile.phone, ''),
    (current_date + interval '15 days')::date,
    coalesce(nullif(trim(p_notes), ''), nullif(trim(v_package.description), ''), 'ใบเสนอราคาแพ็กเกจติดตั้งโซลาร์เซลล์')
  )
  returning * into v_quote;

  insert into public.quotation_items (quotation_id, package_id, description, quantity, unit_price)
  values (v_quote.id, v_package.id, v_package.name, v_qty, v_package.price);

  return query
  select
    v_quote.id,
    v_quote.quote_number,
    v_package.id,
    v_package.name,
    v_quote.system_size_kw,
    v_qty,
    v_package.price,
    v_quote.subtotal,
    v_quote.discount,
    v_quote.total,
    v_quote.net_total,
    v_quote.status,
    v_quote.valid_until,
    v_quote.notes,
    v_quote.created_at;
end;
$$;

revoke all on function public.create_package_quotation(uuid, integer, text) from public;
grant execute on function public.create_package_quotation(uuid, integer, text) to authenticated;

-- 6. Public published reviews feed for Products & Packages pages
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
      pkg.name,
      case when i.installation_number is not null then 'งานติดตั้ง ' || i.installation_number else null end,
      'บริการติดตั้งโซลาร์เซลล์'
    ) as target_label,
    case
      when r.order_item_id is not null and oi.package_id is not null then 'package'
      when r.order_item_id is not null then 'product'
      when r.quotation_item_id is not null and qi.package_id is not null then 'package'
      when r.quotation_item_id is not null then 'installation_product'
      else 'installation'
    end as target_type,
    coalesce(oi.product_id, qi.product_id) as product_id,
    coalesce(oi.package_id, qi.package_id, q.package_id) as package_id
  from public.reviews r
  left join public.profiles p on p.id = r.customer_id
  left join public.order_items oi on oi.id = r.order_item_id
  left join public.quotation_items qi on qi.id = r.quotation_item_id
  left join public.installations i on i.id = r.installation_id
  left join public.quotations q on q.id = coalesce(qi.quotation_id, i.quotation_id)
  left join public.packages pkg on pkg.id = coalesce(oi.package_id, qi.package_id, q.package_id)
  where r.is_published
  order by r.created_at desc
  limit greatest(1, least(coalesce(p_limit, 20), 50))
$$;

revoke all on function public.get_public_reviews(integer) from public;
grant execute on function public.get_public_reviews(integer) to anon, authenticated;
