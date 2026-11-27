create table if not exists public.installment_reminder_deliveries (
  id uuid primary key default gen_random_uuid(),
  order_installment_id uuid not null
    references public.order_installments (id) on delete cascade,
  reminder_type text not null
    check (reminder_type in ('three_days_before', 'due_date')),
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'sent', 'failed')),
  attempts integer not null default 0 check (attempts >= 0),
  next_attempt_at timestamptz not null default now(),
  last_attempt_at timestamptz,
  sent_at timestamptz,
  provider_id text,
  last_error text,
  created_at timestamptz not null default now(),
  unique (order_installment_id, reminder_type)
);

alter table public.installment_reminder_deliveries enable row level security;
revoke all on public.installment_reminder_deliveries from anon, authenticated;
grant all on public.installment_reminder_deliveries to service_role;

drop policy if exists "Staff can view orders for customer follow-up" on public.orders;
create policy "Staff can view orders for customer follow-up"
  on public.orders for select to authenticated
  using ((select public.current_user_role()) = 'staff');

create or replace function public.claim_installment_reminder(
  p_installment_id uuid,
  p_reminder_type text
)
returns table (delivery_id uuid, attempt_count integer)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_reminder_type not in ('three_days_before', 'due_date') then
    raise exception using errcode = '22023', message = 'Unsupported installment reminder type';
  end if;

  insert into public.installment_reminder_deliveries (
    order_installment_id, reminder_type
  )
  values (p_installment_id, p_reminder_type)
  on conflict (order_installment_id, reminder_type) do nothing;

  return query
    update public.installment_reminder_deliveries as delivery
    set status = 'processing',
        attempts = delivery.attempts + 1,
        last_attempt_at = now(),
        last_error = null
    where delivery.order_installment_id = p_installment_id
      and delivery.reminder_type = p_reminder_type
      and delivery.attempts < 6
      and (
        (delivery.status in ('pending', 'failed') and delivery.next_attempt_at <= now())
        or (
          delivery.status = 'processing'
          and delivery.last_attempt_at < now() - interval '20 minutes'
        )
      )
    returning delivery.id, delivery.attempts;
end;
$$;

revoke all on function public.claim_installment_reminder(uuid, text) from public, anon, authenticated;
grant execute on function public.claim_installment_reminder(uuid, text) to service_role;
