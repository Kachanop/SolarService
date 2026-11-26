create or replace function public.assign_booking_technician(p_booking_id uuid, p_technician_id uuid, p_assignment_type text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if (select public.current_user_role()) is distinct from 'admin' then raise exception using errcode = '42501', message = 'Admin role required'; end if;
  if p_assignment_type not in ('survey','installation') then raise exception using errcode = '22023', message = 'Invalid assignment type'; end if;
  perform 1 from public.service_bookings where id = p_booking_id and status not in ('completed','cancelled') for update;
  if not found then raise exception using errcode = 'P0002', message = 'Booking not found'; end if;
  if p_assignment_type = 'installation' and not exists(
    select 1 from public.technician_assignments
    where booking_id = p_booking_id and assignment_type = 'survey' and status = 'completed'
  ) then
    raise exception using errcode = '22023', message = 'Survey must be completed before assigning an installation technician';
  end if;
  if not exists(select 1 from public.profiles where id = p_technician_id and role = 'technician' and technician_type in (p_assignment_type,'both')) then raise exception using errcode = '22023', message = 'Invalid technician'; end if;
  if exists(select 1 from public.technician_assignments where booking_id = p_booking_id and assignment_type = p_assignment_type and technician_id = p_technician_id and status in ('assigned','accepted','in_progress')) then
    if p_assignment_type = 'installation' then
      insert into public.installations(booking_id, customer_id, status)
        select b.id, b.customer_id, 'scheduled' from public.service_bookings b where b.id = p_booking_id
        on conflict (booking_id) do update
          set status = case when public.installations.status = 'cancelled' then 'scheduled' else public.installations.status end,
              updated_at = now();
    end if;
    if p_assignment_type = 'survey' then
      update public.service_bookings set status = 'assigned' where id = p_booking_id and status = 'pending';
    end if;
    return;
  end if;
  update public.technician_assignments set status = 'cancelled'
    where booking_id = p_booking_id and assignment_type = p_assignment_type
      and status in ('assigned','accepted','in_progress');
  insert into public.technician_assignments(booking_id,technician_id,assignment_type,assigned_by,status,assigned_at)
    values(p_booking_id,p_technician_id,p_assignment_type,(select auth.uid()),'assigned',now());
  if p_assignment_type = 'installation' then
    insert into public.installations(booking_id,customer_id,status)
      select p.id,p.customer_id,'scheduled' from public.service_bookings p where p.id = p_booking_id
      on conflict(booking_id) do update set status = case when public.installations.status = 'cancelled' then 'scheduled' else public.installations.status end, updated_at = now();
  end if;
  if p_assignment_type = 'survey' then update public.service_bookings set status = 'assigned' where id = p_booking_id and status in ('pending','assigned','surveying'); end if;
end $$;
revoke all on function public.assign_booking_technician(uuid,uuid,text) from public;
grant execute on function public.assign_booking_technician(uuid,uuid,text) to authenticated;

create or replace function public.require_completed_survey_for_installation()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.assignment_type = 'installation' and not exists(
    select 1 from public.technician_assignments
    where booking_id = new.booking_id and assignment_type = 'survey' and status = 'completed'
  ) then
    raise exception using errcode = '22023', message = 'Survey must be completed before assigning an installation technician';
  end if;
  return new;
end $$;
revoke all on function public.require_completed_survey_for_installation() from public;

create trigger require_completed_survey_for_installation
before insert or update of booking_id, assignment_type, technician_id on public.technician_assignments
for each row execute function public.require_completed_survey_for_installation();
