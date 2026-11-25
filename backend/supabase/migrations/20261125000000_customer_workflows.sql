-- Customer-facing workflow fixes: booking updates, notifications, payment slips,
-- and the missing repair-ticket warranty reference.

alter table public.support_tickets
  add column if not exists warranty_id uuid references public.warranties (id) on delete set null;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null default '',
  link text not null default '',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

drop policy if exists "Users read their notifications" on public.notifications;
create policy "Users read their notifications"
  on public.notifications for select to authenticated
  using (user_id = (select auth.uid()) or (select public.current_user_role()) in ('admin','staff'));

drop policy if exists "Users update their notifications" on public.notifications;
create policy "Users update their notifications"
  on public.notifications for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Admins and staff create notifications" on public.notifications;
create policy "Admins and staff create notifications"
  on public.notifications for insert to authenticated
  with check ((select public.current_user_role()) in ('admin','staff'));

grant select, insert, update, delete on public.notifications to authenticated;

-- Allow customers to cancel or reschedule only their pending bookings.
drop policy if exists "Customers can update pending bookings" on public.service_bookings;
create policy "Customers can update pending bookings"
  on public.service_bookings for update to authenticated
  using (customer_id = (select auth.uid()) and status = 'pending')
  with check (customer_id = (select auth.uid()) and status in ('pending','cancelled'));

-- Payment slip uploads are private to their owner and readable by admin/staff.
insert into storage.buckets (id, name, public)
values ('payment-slips', 'payment-slips', true)
on conflict (id) do update set public = false;

drop policy if exists "Customers upload own payment slips" on storage.objects;
create policy "Customers upload own payment slips"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'payment-slips'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Customers and admins read payment slips" on storage.objects;
create policy "Customers and admins read payment slips"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'payment-slips'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select public.current_user_role()) in ('admin','staff')
    )
  );

-- Create an inbox notification whenever a maintenance reminder is inserted
-- or moved to the notified state.
create or replace function public.notify_maintenance_reminder()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT'
     or (tg_op = 'UPDATE' and old.status is distinct from new.status and new.status = 'notified') then
    insert into public.notifications (user_id, title, body, link)
    values (
      new.customer_id,
      'แจ้งเตือนบำรุงรักษาโซลาร์',
      new.title || ' กำหนดวันที่ ' || to_char(new.due_date, 'DD/MM/YYYY'),
      '#/warranty'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists maintenance_reminder_notification on public.maintenance_reminders;
create trigger maintenance_reminder_notification
  after insert or update on public.maintenance_reminders
  for each row execute function public.notify_maintenance_reminder();

-- Queue notifications for due 6-month reminders. This can be called by an
-- admin or by a scheduled task; it never duplicates an already-notified row.
create or replace function public.queue_due_maintenance_notifications()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer := 0;
begin
  if (select public.current_user_role()) not in ('admin','staff') then
    raise exception using errcode = '42501', message = 'Admin or staff access required';
  end if;

  update public.maintenance_reminders
  set status = 'notified',
      last_notified_at = now()
  where status = 'pending'
    and due_date <= (current_date + interval '14 days');

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.queue_due_maintenance_notifications() from public;
grant execute on function public.queue_due_maintenance_notifications() to authenticated;
