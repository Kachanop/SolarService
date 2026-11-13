alter table public.payments
  add column if not exists expires_at timestamptz;

update public.payments
set expires_at = created_at + interval '5 minutes'
where method = 'gateway'
  and status = 'submitted'
  and expires_at is null;

create index if not exists payments_gateway_expiry_idx
  on public.payments (expires_at)
  where method = 'gateway' and status = 'submitted';
