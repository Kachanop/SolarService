create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  phone text,
  role text not null default 'customer'
    check (role in ('customer', 'technician', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = (select auth.uid())
$$;

revoke all on function public.current_user_role() from public;
grant execute on function public.current_user_role() to anon, authenticated;

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category text not null,
  description text not null default '',
  price numeric(12, 2) not null check (price >= 0),
  compare_at_price numeric(12, 2) check (compare_at_price is null or compare_at_price >= price),
  sku text unique,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  system_size_kw numeric(8, 2) not null check (system_size_kw > 0),
  description text not null default '',
  price numeric(12, 2) not null check (price >= 0),
  features jsonb not null default '[]'::jsonb check (jsonb_typeof(features) = 'array'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('SS-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  customer_id uuid not null references public.profiles (id) on delete restrict,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'processing', 'shipped', 'completed', 'cancelled')),
  subtotal numeric(12, 2) not null default 0 check (subtotal >= 0),
  shipping_fee numeric(12, 2) not null default 0 check (shipping_fee >= 0),
  total numeric(12, 2) not null default 0 check (total >= 0),
  shipping_name text not null,
  shipping_phone text not null,
  shipping_address text not null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_name text not null,
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  line_total numeric(12, 2) generated always as (unit_price * quantity) stored,
  created_at timestamptz not null default now()
);

create table public.service_bookings (
  id uuid primary key default gen_random_uuid(),
  booking_number text not null unique default ('BK-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  customer_id uuid not null references public.profiles (id) on delete restrict,
  package_id uuid references public.packages (id) on delete set null,
  preferred_at timestamptz not null,
  address text not null,
  province text not null,
  phone text not null,
  notes text not null default '',
  status text not null default 'pending'
    check (status in ('pending', 'assigned', 'confirmed', 'surveying', 'quoted', 'approved', 'installing', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.technician_assignments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.service_bookings (id) on delete cascade,
  technician_id uuid not null references public.profiles (id) on delete restrict,
  assigned_by uuid references public.profiles (id) on delete set null,
  assigned_at timestamptz not null default now(),
  notes text not null default '',
  unique (booking_id, technician_id)
);

create table public.site_surveys (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.service_bookings (id) on delete cascade,
  technician_id uuid not null references public.profiles (id) on delete restrict,
  roof_area_sqm numeric(10, 2) check (roof_area_sqm is null or roof_area_sqm >= 0),
  roof_type text,
  roof_direction text,
  recommended_system_kw numeric(8, 2) check (recommended_system_kw is null or recommended_system_kw > 0),
  notes text not null default '',
  status text not null default 'draft' check (status in ('draft', 'submitted', 'reviewed')),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.survey_images (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.site_surveys (id) on delete cascade,
  storage_path text not null unique,
  caption text not null default '',
  uploaded_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.quotations (
  id uuid primary key default gen_random_uuid(),
  quote_number text not null unique default ('QT-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  booking_id uuid not null references public.service_bookings (id) on delete restrict,
  customer_id uuid not null references public.profiles (id) on delete restrict,
  created_by uuid references public.profiles (id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'sent', 'approved', 'rejected', 'expired')),
  subtotal numeric(12, 2) not null default 0 check (subtotal >= 0),
  discount numeric(12, 2) not null default 0 check (discount >= 0),
  total numeric(12, 2) not null default 0 check (total >= 0),
  valid_until date,
  notes text not null default '',
  customer_response_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quotation_items (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.quotations (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  description text not null,
  quantity numeric(10, 2) not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  line_total numeric(12, 2) generated always as (quantity * unit_price) stored,
  created_at timestamptz not null default now()
);

create table public.installations (
  id uuid primary key default gen_random_uuid(),
  installation_number text not null unique default ('IN-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  booking_id uuid not null unique references public.service_bookings (id) on delete restrict,
  quotation_id uuid references public.quotations (id) on delete set null,
  customer_id uuid not null references public.profiles (id) on delete restrict,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'preparing', 'installing', 'testing', 'completed', 'cancelled')),
  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders (id) on delete restrict,
  quotation_id uuid references public.quotations (id) on delete restrict,
  customer_id uuid not null references public.profiles (id) on delete restrict,
  amount numeric(12, 2) not null check (amount > 0),
  method text not null default 'manual' check (method in ('manual', 'bank_transfer', 'cash', 'gateway')),
  status text not null default 'pending' check (status in ('pending', 'submitted', 'verified', 'rejected', 'refunded')),
  reference text,
  paid_at timestamptz,
  verified_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint payments_order_or_quote check (
    (order_id is not null and quotation_id is null)
    or (order_id is null and quotation_id is not null)
  )
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  installation_id uuid not null references public.installations (id) on delete restrict,
  customer_id uuid not null references public.profiles (id) on delete restrict,
  rating integer not null check (rating between 1 and 5),
  comment text not null default '',
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  unique (installation_id, customer_id)
);

create index orders_customer_created_idx on public.orders (customer_id, created_at desc);
create index order_items_order_idx on public.order_items (order_id);
create index bookings_customer_created_idx on public.service_bookings (customer_id, created_at desc);
create index bookings_status_preferred_idx on public.service_bookings (status, preferred_at);
create index assignments_technician_idx on public.technician_assignments (technician_id, assigned_at desc);
create index surveys_technician_idx on public.site_surveys (technician_id, created_at desc);
create index quotations_customer_created_idx on public.quotations (customer_id, created_at desc);
create index installations_customer_idx on public.installations (customer_id, scheduled_at desc);
create index payments_customer_idx on public.payments (customer_id, created_at desc);
create index reviews_published_created_idx on public.reviews (created_at desc) where is_published;

create function public.create_order(
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
  v_items jsonb;
  v_subtotal numeric(12, 2);
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
      or coalesce(item.value ->> 'product_id', '') = ''
      or coalesce(item.value ->> 'quantity', '') !~ '^[1-9][0-9]*$'
  ) then
    raise exception using errcode = '22023', message = 'Each item needs a product_id and positive integer quantity';
  end if;

  select jsonb_agg(jsonb_build_object('product_id', normalized.product_id, 'quantity', normalized.quantity))
  into v_items
  from (
    select (item.value ->> 'product_id')::uuid as product_id,
      sum((item.value ->> 'quantity')::integer)::integer as quantity
    from jsonb_array_elements(p_items) as item(value)
    group by (item.value ->> 'product_id')::uuid
  ) as normalized;

  perform p.id
  from public.products as p
  join jsonb_to_recordset(v_items) as item(product_id uuid, quantity integer)
    on item.product_id = p.id
  where p.is_active
  order by p.id
  for update of p;

  if exists (
    select 1
    from jsonb_to_recordset(v_items) as item(product_id uuid, quantity integer)
    left join public.products as p on p.id = item.product_id and p.is_active
    where p.id is null
  ) then
    raise exception using errcode = '22023', message = 'One or more products are unavailable';
  end if;

  select sum(p.price * item.quantity)
  into v_subtotal
  from jsonb_to_recordset(v_items) as item(product_id uuid, quantity integer)
  join public.products as p on p.id = item.product_id;

  insert into public.orders (
    customer_id, subtotal, shipping_fee, total,
    shipping_name, shipping_phone, shipping_address, notes
  )
  values (
    v_customer_id, v_subtotal, 0, v_subtotal,
    trim(p_shipping_name), trim(p_shipping_phone), trim(p_shipping_address), coalesce(p_notes, '')
  )
  returning id into v_order_id;

  insert into public.order_items (order_id, product_id, product_name, unit_price, quantity)
  select v_order_id, p.id, p.name, p.price, item.quantity
  from jsonb_to_recordset(v_items) as item(product_id uuid, quantity integer)
  join public.products as p on p.id = item.product_id;

  return v_order_id;
end;
$$;

create function public.respond_to_quotation(p_quotation_id uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception using errcode = '28000', message = 'Authentication is required';
  end if;
  update public.quotations
  set status = case when p_accept then 'approved' else 'rejected' end,
    customer_response_at = now()
  where id = p_quotation_id
    and customer_id = (select auth.uid())
    and status = 'sent';
  if not found then
    raise exception using errcode = 'P0002', message = 'Quotation not found or no longer awaiting a response';
  end if;
end;
$$;

revoke all on function public.create_order(text, text, text, jsonb, text) from public;
revoke all on function public.respond_to_quotation(uuid, boolean) from public;
grant execute on function public.create_order(text, text, text, jsonb, text) to authenticated;
grant execute on function public.respond_to_quotation(uuid, boolean) to authenticated;

create trigger set_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_products_updated_at before update on public.products
  for each row execute function public.set_updated_at();
create trigger set_packages_updated_at before update on public.packages
  for each row execute function public.set_updated_at();
create trigger set_orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();
create trigger set_bookings_updated_at before update on public.service_bookings
  for each row execute function public.set_updated_at();
create trigger set_surveys_updated_at before update on public.site_surveys
  for each row execute function public.set_updated_at();
create trigger set_quotations_updated_at before update on public.quotations
  for each row execute function public.set_updated_at();
create trigger set_installations_updated_at before update on public.installations
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.packages enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.service_bookings enable row level security;
alter table public.technician_assignments enable row level security;
alter table public.site_surveys enable row level security;
alter table public.survey_images enable row level security;
alter table public.quotations enable row level security;
alter table public.quotation_items enable row level security;
alter table public.installations enable row level security;
alter table public.payments enable row level security;
alter table public.reviews enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.products, public.packages to anon, authenticated;
grant insert, update, delete on public.products, public.packages to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on
  public.orders,
  public.order_items,
  public.service_bookings,
  public.technician_assignments,
  public.site_surveys,
  public.survey_images,
  public.quotations,
  public.quotation_items,
  public.installations,
  public.payments,
  public.reviews
to authenticated;
grant select on public.reviews to anon;

create policy "Profiles are visible to their owner and admins"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.current_user_role()) = 'admin');
create policy "Users can update their own customer profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()) and role = 'customer')
  with check (id = (select auth.uid()) and role = 'customer');
create policy "Admins can manage profiles"
  on public.profiles for all to authenticated
  using ((select public.current_user_role()) = 'admin')
  with check ((select public.current_user_role()) = 'admin');

create policy "Active products are public"
  on public.products for select to anon, authenticated using (is_active);
create policy "Admins can manage products"
  on public.products for all to authenticated
  using ((select public.current_user_role()) = 'admin')
  with check ((select public.current_user_role()) = 'admin');

create policy "Active packages are public"
  on public.packages for select to anon, authenticated using (is_active);
create policy "Admins can manage packages"
  on public.packages for all to authenticated
  using ((select public.current_user_role()) = 'admin')
  with check ((select public.current_user_role()) = 'admin');

create policy "Customers and admins can view orders"
  on public.orders for select to authenticated
  using (customer_id = (select auth.uid()) or (select public.current_user_role()) = 'admin');
create policy "Admins can manage orders"
  on public.orders for all to authenticated
  using ((select public.current_user_role()) = 'admin')
  with check ((select public.current_user_role()) = 'admin');

create policy "Order items are visible to order owners and admins"
  on public.order_items for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.customer_id = (select auth.uid()) or (select public.current_user_role()) = 'admin')
    )
  );
create policy "Admins can manage order items"
  on public.order_items for all to authenticated
  using ((select public.current_user_role()) = 'admin')
  with check ((select public.current_user_role()) = 'admin');

create policy "Customers, assigned technicians, and admins can view bookings"
  on public.service_bookings for select to authenticated
  using (
    customer_id = (select auth.uid())
    or (select public.current_user_role()) = 'admin'
    or exists (
      select 1 from public.technician_assignments ta
      where ta.booking_id = id and ta.technician_id = (select auth.uid())
    )
  );
create policy "Customers can create bookings for themselves"
  on public.service_bookings for insert to authenticated
  with check (customer_id = (select auth.uid()) and status = 'pending');
create policy "Admins can manage bookings"
  on public.service_bookings for all to authenticated
  using ((select public.current_user_role()) = 'admin')
  with check ((select public.current_user_role()) = 'admin');

create policy "Admins and assigned technicians can view assignments"
  on public.technician_assignments for select to authenticated
  using (
    technician_id = (select auth.uid())
    or (select public.current_user_role()) = 'admin'
  );
create policy "Admins can manage assignments"
  on public.technician_assignments for all to authenticated
  using ((select public.current_user_role()) = 'admin')
  with check ((select public.current_user_role()) = 'admin');

create policy "Customers, assigned technicians, and admins can view surveys"
  on public.site_surveys for select to authenticated
  using (
    (select public.current_user_role()) = 'admin'
    or technician_id = (select auth.uid())
    or exists (
      select 1 from public.service_bookings b
      where b.id = booking_id and b.customer_id = (select auth.uid())
    )
  );
create policy "Assigned technicians can create surveys"
  on public.site_surveys for insert to authenticated
  with check (
    technician_id = (select auth.uid())
    and exists (
      select 1 from public.technician_assignments ta
      where ta.booking_id = public.site_surveys.booking_id and ta.technician_id = (select auth.uid())
    )
  );
create policy "Assigned technicians can update draft surveys"
  on public.site_surveys for update to authenticated
  using (
    technician_id = (select auth.uid())
    and status = 'draft'
    and exists (
      select 1 from public.technician_assignments ta
      where ta.booking_id = public.site_surveys.booking_id and ta.technician_id = (select auth.uid())
    )
  )
  with check (
    technician_id = (select auth.uid())
    and status in ('draft', 'submitted')
    and exists (
      select 1 from public.technician_assignments ta
      where ta.booking_id = public.site_surveys.booking_id and ta.technician_id = (select auth.uid())
    )
  );
create policy "Admins can manage surveys"
  on public.site_surveys for all to authenticated
  using ((select public.current_user_role()) = 'admin')
  with check ((select public.current_user_role()) = 'admin');

create policy "Survey images are visible to survey participants"
  on public.survey_images for select to authenticated
  using (
    (select public.current_user_role()) = 'admin'
    or uploaded_by = (select auth.uid())
    or exists (
      select 1
      from public.site_surveys s
      join public.service_bookings b on b.id = s.booking_id
      where s.id = survey_id
        and (b.customer_id = (select auth.uid()) or s.technician_id = (select auth.uid()))
    )
  );
create policy "Assigned technicians can add survey images"
  on public.survey_images for insert to authenticated
  with check (
    uploaded_by = (select auth.uid())
    and exists (
      select 1
      from public.site_surveys s
      join public.technician_assignments ta
        on ta.booking_id = s.booking_id and ta.technician_id = (select auth.uid())
      where s.id = survey_id
    )
  );
create policy "Admins can manage survey images"
  on public.survey_images for all to authenticated
  using ((select public.current_user_role()) = 'admin')
  with check ((select public.current_user_role()) = 'admin');

create policy "Customers and admins can view quotations"
  on public.quotations for select to authenticated
  using (customer_id = (select auth.uid()) or (select public.current_user_role()) = 'admin');
create policy "Admins can create quotations"
  on public.quotations for insert to authenticated
  with check ((select public.current_user_role()) = 'admin');
create policy "Admins can manage quotations"
  on public.quotations for all to authenticated
  using ((select public.current_user_role()) = 'admin')
  with check ((select public.current_user_role()) = 'admin');

create policy "Quotation items are visible to quotation owners and admins"
  on public.quotation_items for select to authenticated
  using (
    exists (
      select 1 from public.quotations q
      where q.id = quotation_id
        and (q.customer_id = (select auth.uid()) or (select public.current_user_role()) = 'admin')
    )
  );
create policy "Admins can manage quotation items"
  on public.quotation_items for all to authenticated
  using ((select public.current_user_role()) = 'admin')
  with check ((select public.current_user_role()) = 'admin');

create policy "Customers, assigned technicians, and admins can view installations"
  on public.installations for select to authenticated
  using (
    customer_id = (select auth.uid())
    or (select public.current_user_role()) = 'admin'
    or exists (
      select 1 from public.technician_assignments ta
      where ta.booking_id = public.installations.booking_id and ta.technician_id = (select auth.uid())
    )
  );
create policy "Admins can manage installations"
  on public.installations for all to authenticated
  using ((select public.current_user_role()) = 'admin')
  with check ((select public.current_user_role()) = 'admin');

create policy "Customers and admins can view payments"
  on public.payments for select to authenticated
  using (customer_id = (select auth.uid()) or (select public.current_user_role()) = 'admin');
create policy "Customers can submit payment records for themselves"
  on public.payments for insert to authenticated
  with check (
    customer_id = (select auth.uid())
    and status = 'submitted'
    and verified_by is null
    and (
      (order_id is not null and exists (
        select 1 from public.orders o
        where o.id = order_id and o.customer_id = (select auth.uid())
      ))
      or
      (quotation_id is not null and exists (
        select 1 from public.quotations q
        where q.id = quotation_id and q.customer_id = (select auth.uid())
      ))
    )
  );
create policy "Admins can manage payments"
  on public.payments for all to authenticated
  using ((select public.current_user_role()) = 'admin')
  with check ((select public.current_user_role()) = 'admin');

create policy "Published reviews are public"
  on public.reviews for select to anon, authenticated
  using (is_published or customer_id = (select auth.uid()) or (select public.current_user_role()) = 'admin');
create policy "Customers can review their completed installations"
  on public.reviews for insert to authenticated
  with check (
    customer_id = (select auth.uid())
    and is_published = false
    and exists (
      select 1 from public.installations i
      where i.id = installation_id
        and i.customer_id = (select auth.uid())
        and i.status = 'completed'
    )
  );
create policy "Admins can manage reviews"
  on public.reviews for all to authenticated
  using ((select public.current_user_role()) = 'admin')
  with check ((select public.current_user_role()) = 'admin');
