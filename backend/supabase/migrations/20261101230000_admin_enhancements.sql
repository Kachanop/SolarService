-- Migration: Admin Enhancements & After-Sales Systems
-- Adds Warranties, Maintenance Reminders, Support Tickets, CMS Banners, CMS Articles,
-- and updates Profiles role to include 'staff', plus 'is_banned' column.

-- 1. Update profiles table to support 'staff' role and 'is_banned'
alter table public.profiles add column if not exists is_banned boolean not null default false;
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('customer', 'technician', 'staff', 'admin'));

-- 2. Warranties Registry (ทะเบียนรับประกันสินค้าและงานติดตั้ง)
create table if not exists public.warranties (
  id uuid primary key default gen_random_uuid(),
  warranty_number text not null unique default ('WR-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  customer_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  package_id uuid references public.packages (id) on delete set null,
  installation_id uuid references public.installations (id) on delete set null,
  equipment_type text not null check (equipment_type in ('solar_panel', 'inverter', 'battery', 'installation_work', 'other')),
  equipment_model text not null,
  serial_number text not null,
  warranty_start date not null default current_date,
  warranty_end date not null,
  status text not null default 'active' check (status in ('active', 'expiring_soon', 'expired', 'claimed')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Maintenance Reminders (ระบบแจ้งเตือนรอบบำรุงรักษา / ล้างแผงโซลาร์)
create table if not exists public.maintenance_reminders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id) on delete cascade,
  warranty_id uuid references public.warranties (id) on delete set null,
  title text not null default 'รอบล้างแผงโซลาร์เซลล์และตรวจสอบระบบประจำปี',
  reminder_type text not null default 'panel_cleaning' check (reminder_type in ('panel_cleaning', 'inverter_check', 'annual_inspection', 'battery_health')),
  frequency_months integer not null default 6 check (frequency_months > 0),
  due_date date not null,
  status text not null default 'pending' check (status in ('pending', 'notified', 'scheduled', 'completed', 'skipped')),
  last_notified_at timestamptz,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Support Tickets (ระบบรับแจ้งซ่อมและปัญหาการใช้งาน)
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number text not null unique default ('TK-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  customer_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text not null,
  category text not null default 'repair' check (category in ('repair', 'inverter_error', 'billing', 'inquiry', 'maintenance', 'other')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'waiting_customer', 'resolved', 'closed')),
  assigned_to uuid references public.profiles (id) on delete set null,
  resolution_notes text not null default '',
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. CMS Banners (จัดการแบนเนอร์หน้าแรก)
create table if not exists public.cms_banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text not null default '',
  tag text not null default '',
  image_url text not null default '',
  link_url text not null default '/packages',
  button_text text not null default 'ดูรายละเอียด',
  display_order integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. CMS Articles (จัดการบทความและความรู้โซลาร์เซลล์)
create table if not exists public.cms_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  category text not null default 'ความรู้โซลาร์',
  summary text not null default '',
  content text not null default '',
  cover_image text not null default '',
  views_count integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Triggers for updated_at
create or replace trigger set_warranties_updated_at before update on public.warranties
  for each row execute function public.set_updated_at();
create or replace trigger set_maintenance_updated_at before update on public.maintenance_reminders
  for each row execute function public.set_updated_at();
create or replace trigger set_tickets_updated_at before update on public.support_tickets
  for each row execute function public.set_updated_at();
create or replace trigger set_cms_banners_updated_at before update on public.cms_banners
  for each row execute function public.set_updated_at();
create or replace trigger set_cms_articles_updated_at before update on public.cms_articles
  for each row execute function public.set_updated_at();

-- Indexes for performance
create index if not exists warranties_customer_idx on public.warranties (customer_id, warranty_end);
create index if not exists warranties_serial_idx on public.warranties (serial_number);
create index if not exists maintenance_due_idx on public.maintenance_reminders (due_date, status);
create index if not exists tickets_customer_idx on public.support_tickets (customer_id, created_at desc);
create index if not exists tickets_status_idx on public.support_tickets (status, priority);
create index if not exists cms_banners_active_idx on public.cms_banners (is_active, display_order);
create index if not exists cms_articles_published_idx on public.cms_articles (is_published, created_at desc);

-- RLS policies
alter table public.warranties enable row level security;
alter table public.maintenance_reminders enable row level security;
alter table public.support_tickets enable row level security;
alter table public.cms_banners enable row level security;
alter table public.cms_articles enable row level security;

-- Warranties Policies
create policy "Warranties viewable by customer and staff/admin"
  on public.warranties for select to authenticated
  using (customer_id = (select auth.uid()) or (select public.current_user_role()) in ('admin', 'staff'));

create policy "Admins and staff can manage warranties"
  on public.warranties for all to authenticated
  using ((select public.current_user_role()) in ('admin', 'staff'))
  with check ((select public.current_user_role()) in ('admin', 'staff'));

-- Maintenance Reminders Policies
create policy "Reminders viewable by customer and staff/admin"
  on public.maintenance_reminders for select to authenticated
  using (customer_id = (select auth.uid()) or (select public.current_user_role()) in ('admin', 'staff'));

create policy "Admins and staff can manage reminders"
  on public.maintenance_reminders for all to authenticated
  using ((select public.current_user_role()) in ('admin', 'staff'))
  with check ((select public.current_user_role()) in ('admin', 'staff'));

-- Support Tickets Policies
create policy "Tickets viewable by customer and staff/admin"
  on public.support_tickets for select to authenticated
  using (customer_id = (select auth.uid()) or (select public.current_user_role()) in ('admin', 'staff'));

create policy "Customers can submit tickets"
  on public.support_tickets for insert to authenticated
  with check (customer_id = (select auth.uid()));

create policy "Admins and staff can manage tickets"
  on public.support_tickets for all to authenticated
  using ((select public.current_user_role()) in ('admin', 'staff'))
  with check ((select public.current_user_role()) in ('admin', 'staff'));

-- CMS Banners Policies
create policy "Active banners are public"
  on public.cms_banners for select to anon, authenticated
  using (is_active or (select public.current_user_role()) in ('admin', 'staff'));

create policy "Admins and staff can manage banners"
  on public.cms_banners for all to authenticated
  using ((select public.current_user_role()) in ('admin', 'staff'))
  with check ((select public.current_user_role()) in ('admin', 'staff'));

-- CMS Articles Policies
create policy "Published articles are public"
  on public.cms_articles for select to anon, authenticated
  using (is_published or (select public.current_user_role()) in ('admin', 'staff'));

create policy "Admins and staff can manage articles"
  on public.cms_articles for all to authenticated
  using ((select public.current_user_role()) in ('admin', 'staff'))
  with check ((select public.current_user_role()) in ('admin', 'staff'));
