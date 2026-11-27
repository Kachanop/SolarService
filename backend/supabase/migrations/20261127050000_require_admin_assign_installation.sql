-- Ensure completing a site survey never creates an installation assignment or
-- installation record; only an admin can assign an installation technician.
create or replace function public.submit_site_survey(p_booking_id uuid, p_installation_technician_id uuid default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_survey public.site_surveys%rowtype;
  v_assignment public.technician_assignments%rowtype;
begin
  if (select public.current_user_role()) is distinct from 'technician'
    or coalesce((select public.current_user_technician_type()), '') not in ('survey', 'both') then
    raise exception using errcode = '42501', message = 'Survey technician access required';
  end if;

  if p_installation_technician_id is not null then
    raise exception using errcode = '42501', message = 'Only admins can assign installation technicians';
  end if;

  perform 1 from public.service_bookings where id = p_booking_id and status not in ('completed', 'cancelled') for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Booking not found';
  end if;

  select * into v_assignment from public.technician_assignments
    where booking_id = p_booking_id
      and technician_id = (select auth.uid())
      and assignment_type = 'survey'
      and status in ('assigned', 'accepted', 'in_progress')
    order by assigned_at desc, id desc
    limit 1
    for update;
  if not found or v_assignment.status <> 'in_progress' then
    raise exception using errcode = '42501', message = 'Survey assignment required';
  end if;

  select * into v_survey from public.site_surveys where booking_id = p_booking_id for update;
  if not found or v_survey.technician_id <> (select auth.uid()) or v_survey.status <> 'draft' then
    raise exception using errcode = '42501', message = 'Survey draft not found';
  end if;

  if nullif(trim(v_survey.contact_name), '') is null or nullif(trim(v_survey.contact_phone), '') is null
    or nullif(trim(v_survey.installation_address), '') is null or nullif(trim(v_survey.roof_type), '') is null
    or v_survey.roof_area_sqm is null or nullif(trim(v_survey.roof_direction), '') is null
    or nullif(trim(v_survey.site_conditions), '') is null or v_survey.recommended_system_kw is null
    or nullif(trim(v_survey.panel_location), '') is null or nullif(trim(v_survey.inverter_location), '') is null
    or nullif(trim(v_survey.equipment_details), '') is null or v_survey.survey_date is null then
    raise exception using errcode = '22023', message = 'Required survey fields are incomplete';
  end if;

  update public.site_surveys set status = 'submitted', submitted_at = now() where id = v_survey.id;
  update public.technician_assignments set status = 'completed', completed_at = now()
    where id = v_assignment.id and status in ('assigned', 'accepted', 'in_progress');
  update public.service_bookings set status = 'survey_completed' where id = p_booking_id;
end $$;

revoke all on function public.submit_site_survey(uuid, uuid) from public;
grant execute on function public.submit_site_survey(uuid, uuid) to authenticated;

-- Prevent survey technicians from querying installation technician lists directly.
revoke all on function public.list_installation_technicians() from public, authenticated;
