-- Restore the canonical installation row for an active installation assignment
-- before applying technician progress updates. Older assignments may predate the
-- installation backfill migration.
create or replace function public.update_technician_assignment(p_assignment_id uuid, p_status text, p_notes text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_assignment public.technician_assignments%rowtype;
  v_booking_id uuid;
  v_booking_status text;
  v_installation_status text;
begin
  if (select public.current_user_role()) is distinct from 'technician' then
    raise exception using errcode = '42501', message = 'Technician role required';
  end if;

  select booking_id into v_booking_id
  from public.technician_assignments
  where id = p_assignment_id and technician_id = (select auth.uid());
  if not found then
    raise exception using errcode = '42501', message = 'Assignment access denied';
  end if;

  select status into v_booking_status
  from public.service_bookings where id = v_booking_id for update;
  if not found then
    raise exception using errcode = '42501', message = 'Booking not found';
  end if;
  if v_booking_status in ('completed','cancelled') then
    raise exception using errcode = '22023', message = 'Closed booking cannot be changed';
  end if;

  select * into v_assignment
  from public.technician_assignments where id = p_assignment_id for update;
  if not found
     or v_assignment.technician_id <> (select auth.uid())
     or (select public.current_user_technician_type()) not in (v_assignment.assignment_type,'both') then
    raise exception using errcode = '42501', message = 'Assignment access denied';
  end if;
  if p_status is null or p_status not in ('accepted','in_progress','completed','cancelled') then
    raise exception using errcode = '22023', message = 'Invalid assignment status';
  end if;
  if v_assignment.status in ('completed','cancelled') then
    raise exception using errcode = '22023', message = 'Assignment is already closed';
  end if;
  if p_status = 'accepted' and v_assignment.status not in ('assigned','accepted') then
    raise exception using errcode = '22023', message = 'Invalid assignment transition';
  end if;
  if p_status = 'in_progress' and v_assignment.status not in ('accepted','in_progress') then
    raise exception using errcode = '22023', message = 'Accept the assignment before starting';
  end if;
  if p_status = 'completed' and v_assignment.assignment_type = 'survey' then
    raise exception using errcode = '22023', message = 'Submit the required survey report to complete this assignment';
  end if;
  if p_status = 'completed' and v_assignment.assignment_type = 'installation' and v_assignment.status <> 'in_progress' then
    raise exception using errcode = '22023', message = 'Start installation before completing';
  end if;

  if v_assignment.assignment_type = 'installation' then
    -- Insert is limited to this verified assignment's booking and is safe when
    -- another request creates the row concurrently.
    insert into public.installations(booking_id, customer_id, status)
    select b.id, b.customer_id, 'scheduled'
    from public.service_bookings b
    where b.id = v_assignment.booking_id
    on conflict (booking_id) do nothing;

    select status into v_installation_status
    from public.installations where booking_id = v_assignment.booking_id for update;
    if not found or v_installation_status in ('completed','cancelled') then
      raise exception using errcode = '22023', message = 'Installation record is closed';
    end if;
  end if;

  update public.technician_assignments set status = p_status,
    accepted_at = case when p_status = 'accepted' then coalesce(accepted_at,now()) else accepted_at end,
    completed_at = case when p_status = 'completed' then now() else completed_at end
  where id = p_assignment_id;

  if v_assignment.assignment_type = 'installation' then
    update public.installations set
      status = case
        when p_status = 'accepted' and status = 'scheduled' then 'preparing'
        when p_status = 'in_progress' and status in ('scheduled','preparing') then 'installing'
        when p_status = 'completed' then 'completed'
        when p_status = 'cancelled' then 'cancelled'
        else status
      end,
      notes = coalesce(p_notes,notes),
      started_at = case when p_status = 'in_progress' then coalesce(started_at,now()) else started_at end,
      completed_at = case when p_status = 'completed' then now() else completed_at end,
      updated_at = now()
    where booking_id = v_assignment.booking_id;
    if p_status = 'in_progress' then
      update public.service_bookings set status = 'installing' where id = v_assignment.booking_id;
    end if;
    if p_status = 'completed' then
      update public.service_bookings set status = 'completed' where id = v_assignment.booking_id;
    end if;
    if p_status = 'cancelled' then
      update public.service_bookings set status = 'approved'
      where id = v_assignment.booking_id and status = 'installing';
    end if;
  end if;
  if v_assignment.assignment_type = 'survey' and p_status = 'in_progress' then
    update public.service_bookings set status = 'surveying' where id = v_assignment.booking_id;
  end if;
  if v_assignment.assignment_type = 'survey' and p_status = 'cancelled' then
    update public.service_bookings set status = 'pending'
    where id = v_assignment.booking_id and status in ('assigned','surveying');
  end if;
end $$;

revoke all on function public.update_technician_assignment(uuid,text,text) from public;
grant execute on function public.update_technician_assignment(uuid,text,text) to authenticated;
