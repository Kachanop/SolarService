alter table public.orders
  add column if not exists payment_plan text not null default 'full'
    check (payment_plan in ('full', 'three_installments'));

alter table public.products
  add column if not exists warranty_months integer not null default 12
    check (warranty_months > 0);

alter table public.warranties
  alter column serial_number drop not null,
  add column if not exists order_item_id uuid references public.order_items (id) on delete set null,
  add column if not exists unit_number integer;

create unique index if not exists warranties_order_item_unit_uidx
  on public.warranties (order_item_id, unit_number)
  where order_item_id is not null and unit_number is not null;

alter table public.payments
  add column if not exists installment_id uuid;

create table if not exists public.order_installments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  installment_number integer not null check (installment_number between 1 and 3),
  amount numeric(12, 2) not null check (amount >= 10),
  due_date date not null,
  status text not null default 'pending' check (status in ('pending', 'paid')),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique (order_id, installment_number)
);

alter table public.payments
  drop constraint if exists payments_installment_id_fkey;
alter table public.payments
  add constraint payments_installment_id_fkey
  foreign key (installment_id) references public.order_installments (id) on delete restrict;

create index if not exists order_installments_order_idx
  on public.order_installments (order_id, installment_number);

alter table public.order_installments enable row level security;

drop policy if exists "Customers and admins can view order installments" on public.order_installments;
create policy "Customers and admins can view order installments"
  on public.order_installments for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.customer_id = (select auth.uid()) or (select public.current_user_role()) in ('admin', 'staff'))
    )
  );

grant select on public.order_installments to authenticated;

create or replace function public.set_order_payment_plan(p_order_id uuid, p_plan text)
returns setof public.order_installments
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_total_cents bigint;
  v_installment_cents bigint;
begin
  if p_plan not in ('full', 'three_installments') then
    raise exception using errcode = '22023', message = 'Payment plan is not supported';
  end if;

  select * into v_order
  from public.orders
  where id = p_order_id and customer_id = (select auth.uid())
  for update;
  if not found or v_order.status <> 'pending' then
    raise exception using errcode = '42501', message = 'Pending order owned by the current user is required';
  end if;

  if exists (select 1 from public.payments where order_id = p_order_id) then
    if v_order.payment_plan <> p_plan then
      raise exception using errcode = '23514', message = 'Payment plan cannot be changed after payment has started';
    end if;
  else
    update public.orders set payment_plan = p_plan where id = p_order_id;
    delete from public.order_installments where order_id = p_order_id;

    if p_plan = 'three_installments' then
      v_total_cents := round(v_order.total * 100)::bigint;
      v_installment_cents := floor(v_total_cents / 3.0)::bigint;
      if v_installment_cents < 1000 then
        raise exception using errcode = '22023', message = 'Each PromptPay installment must be at least 10 baht';
      end if;

      insert into public.order_installments (order_id, installment_number, amount, due_date)
      values
        (p_order_id, 1, v_installment_cents / 100.0, current_date),
        (p_order_id, 2, v_installment_cents / 100.0, (current_date + interval '1 month')::date),
        (p_order_id, 3, (v_total_cents - (v_installment_cents * 2)) / 100.0, (current_date + interval '2 months')::date);
    end if;
  end if;

  return query
    select * from public.order_installments
    where order_id = p_order_id
    order by installment_number;
end;
$$;

revoke all on function public.set_order_payment_plan(uuid, text) from public;
grant execute on function public.set_order_payment_plan(uuid, text) to authenticated;

create or replace function public.reject_package_order_items()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.package_id is not null then
    raise exception using errcode = '22023', message = 'Packages require an onsite assessment before purchase';
  end if;
  return new;
end;
$$;

drop trigger if exists require_assessment_for_package_order on public.order_items;
create trigger require_assessment_for_package_order
  before insert or update of package_id on public.order_items
  for each row execute function public.reject_package_order_items();

create or replace function public.issue_product_warranties_for_completed_order()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'completed' and old.status is distinct from new.status then
    insert into public.warranties (
      customer_id, product_id, equipment_type, equipment_model, serial_number,
      warranty_start, warranty_end, order_item_id, unit_number, notes
    )
    select
      new.customer_id,
      p.id,
      case
        when lower(coalesce(p.category, '') || ' ' || coalesce(p.name, oi.product_name)) like '%inverter%'
          or coalesce(p.category, '') like '%อินเวอร์เตอร์%' then 'inverter'
        when lower(coalesce(p.category, '') || ' ' || coalesce(p.name, oi.product_name)) like '%battery%'
          or coalesce(p.category, '') like '%แบตเตอรี่%' then 'battery'
        when lower(coalesce(p.category, '') || ' ' || coalesce(p.name, oi.product_name)) like '%panel%'
          or coalesce(p.category, '') like '%แผง%' then 'solar_panel'
        else 'other'
      end,
      coalesce(p.name, oi.product_name),
      null,
      current_date,
      (current_date + make_interval(months => coalesce(p.warranty_months, 12)))::date,
      oi.id,
      unit.unit_number,
      'ออกใบรับประกันอัตโนมัติจากคำสั่งซื้อ ' || new.order_number
    from public.order_items oi
    left join public.products p on p.id = oi.product_id
    cross join lateral generate_series(1, oi.quantity) as unit(unit_number)
    where oi.order_id = new.id
      and oi.package_id is null
    on conflict (order_item_id, unit_number)
      where order_item_id is not null and unit_number is not null
      do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists issue_product_warranties_after_order_completion on public.orders;
create trigger issue_product_warranties_after_order_completion
  after update of status on public.orders
  for each row execute function public.issue_product_warranties_for_completed_order();

insert into public.warranties (
  customer_id, product_id, equipment_type, equipment_model, serial_number,
  warranty_start, warranty_end, status, order_item_id, unit_number, notes
)
select
  o.customer_id,
  p.id,
  case
    when lower(coalesce(p.category, '') || ' ' || coalesce(p.name, oi.product_name)) like '%inverter%'
      or coalesce(p.category, '') like '%อินเวอร์เตอร์%' then 'inverter'
    when lower(coalesce(p.category, '') || ' ' || coalesce(p.name, oi.product_name)) like '%battery%'
      or coalesce(p.category, '') like '%แบตเตอรี่%' then 'battery'
    when lower(coalesce(p.category, '') || ' ' || coalesce(p.name, oi.product_name)) like '%panel%'
      or coalesce(p.category, '') like '%แผง%' then 'solar_panel'
    else 'other'
  end,
  coalesce(p.name, oi.product_name),
  null,
  o.updated_at::date,
  (o.updated_at::date + make_interval(months => coalesce(p.warranty_months, 12)))::date,
  case
    when (o.updated_at::date + make_interval(months => coalesce(p.warranty_months, 12)))::date < current_date then 'expired'
    else 'active'
  end,
  oi.id,
  unit.unit_number,
  'ออกใบรับประกันจากคำสั่งซื้อ ' || o.order_number
from public.orders o
join public.order_items oi on oi.order_id = o.id and oi.package_id is null
left join public.products p on p.id = oi.product_id
cross join lateral generate_series(1, oi.quantity) as unit(unit_number)
where o.status = 'completed'
on conflict (order_item_id, unit_number)
  where order_item_id is not null and unit_number is not null
  do nothing;

create table if not exists public.support_ticket_events (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets (id) on delete cascade,
  changed_by uuid references public.profiles (id) on delete set null,
  old_status text,
  new_status text not null,
  note text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists support_ticket_events_ticket_idx
  on public.support_ticket_events (ticket_id, created_at);

alter table public.support_ticket_events enable row level security;

drop policy if exists "Customers and staff can view ticket history" on public.support_ticket_events;
create policy "Customers and staff can view ticket history"
  on public.support_ticket_events for select to authenticated
  using (
    exists (
      select 1 from public.support_tickets t
      where t.id = ticket_id
        and (t.customer_id = (select auth.uid()) or (select public.current_user_role()) in ('admin', 'staff'))
    )
  );

grant select on public.support_ticket_events to authenticated;

insert into public.support_ticket_events (ticket_id, old_status, new_status, note, created_at)
select t.id, null, t.status, 'สถานะปัจจุบันก่อนเริ่มบันทึกประวัติ', t.updated_at
from public.support_tickets t
where not exists (
  select 1 from public.support_ticket_events e where e.ticket_id = t.id
);

create or replace function public.record_support_ticket_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.support_ticket_events (ticket_id, changed_by, new_status, note)
    values (new.id, (select auth.uid()), new.status, 'รับเรื่องแจ้งซ่อมแล้ว');
  elsif old.status is distinct from new.status
     or old.resolution_notes is distinct from new.resolution_notes then
    insert into public.support_ticket_events (ticket_id, changed_by, old_status, new_status, note)
    values (
      new.id,
      (select auth.uid()),
      old.status,
      new.status,
      coalesce(nullif(new.resolution_notes, ''), 'อัปเดตสถานะคำขอ')
    );
  end if;
  return new;
end;
$$;

drop trigger if exists record_support_ticket_history on public.support_tickets;
create trigger record_support_ticket_history
  after insert or update on public.support_tickets
  for each row execute function public.record_support_ticket_event();
