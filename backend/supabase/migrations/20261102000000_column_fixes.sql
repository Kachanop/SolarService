-- Migration: Column Fixes & Missing Fields
-- Adds columns that the frontend uses but were missing from initial schema:
--   orders.tracking_number, payments.slip_url, payments.verified_at,
--   quotations.system_size_kw, quotations.customer_phone, quotations.net_total,
--   profiles.avatar_url
-- Also grants table-level permissions for the new tables added in admin_enhancements.

-- ─── 1. orders ───────────────────────────────────────────────────────────────
-- tracking_number: เลขพัสดุ (Flash, Kerry, ไปรษณีย์ ฯลฯ)
alter table public.orders
  add column if not exists tracking_number text not null default '';

-- ─── 2. payments ─────────────────────────────────────────────────────────────
-- slip_url: URL ของรูปสลิปโอนเงินที่ลูกค้าแนบมา
alter table public.payments
  add column if not exists slip_url text not null default '';

-- verified_at: เวลาที่ admin ยืนยันการชำระเงิน
alter table public.payments
  add column if not exists verified_at timestamptz;

-- ─── 3. quotations ───────────────────────────────────────────────────────────
-- system_size_kw: ขนาดระบบโซลาร์ในใบเสนอราคา (กิโลวัตต์)
alter table public.quotations
  add column if not exists system_size_kw numeric(8, 2) check (system_size_kw is null or system_size_kw > 0);

-- customer_phone: เบอร์โทรลูกค้าที่พิมพ์ในใบเสนอราคา (สำหรับ PDF/print)
alter table public.quotations
  add column if not exists customer_phone text not null default '';

-- net_total: ยอดสุทธิหลังหักส่วนลด (= total - discount) เก็บไว้เพื่อสะดวก
-- ใช้ generated column เพื่อให้ sync อัตโนมัติ
alter table public.quotations
  add column if not exists net_total numeric(12, 2)
    generated always as (total - discount) stored;

-- ─── 4. profiles ─────────────────────────────────────────────────────────────
-- avatar_url: รูป profile ของผู้ใช้ (CRM / profile page)
alter table public.profiles
  add column if not exists avatar_url text;

-- ─── 5. Grant permissions for new tables from admin_enhancements ─────────────
-- (migration 20261101230000 created these tables but forgot to grant)
grant select, insert, update, delete on
  public.warranties,
  public.maintenance_reminders,
  public.support_tickets,
  public.cms_banners,
  public.cms_articles
to authenticated;

grant select on
  public.cms_banners,
  public.cms_articles
to anon;

-- ─── 6. Index for fast tracking number lookup ─────────────────────────────────
create index if not exists orders_tracking_idx on public.orders (tracking_number)
  where tracking_number <> '';

