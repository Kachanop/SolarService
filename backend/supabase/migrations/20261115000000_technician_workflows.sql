-- Extends the existing booking, assignment, survey, and installation schema.
-- Apply in Supabase SQL Editor or with the project's migration runner.
alter table public.profiles add column if not exists technician_type text not null default 'both';
alter table public.profiles drop constraint if exists profiles_technician_type_check;
alter table public.profiles add constraint profiles_technician_type_check check (technician_type in ('survey','installation','both'));
create or replace function public.current_user_technician_type()
returns text language sql stable security definer set search_path = '' as $$
  select technician_type from public.profiles where id = (select auth.uid())
$$;
revoke all on function public.current_user_technician_type() from public;
grant execute on function public.current_user_technician_type() to authenticated;
alter table public.service_bookings drop constraint if exists service_bookings_status_check;
alter table public.service_bookings add constraint service_bookings_status_check check (status in ('pending','assigned','confirmed','surveying','survey_completed','quoted','approved','installing','completed','cancelled'));
alter table public.installations add column if not exists stages jsonb not null default '{"site_ready":true,"equipment_delivered":false,"panels_mounted":false,"inverter_wired":false,"grid_tested":false}'::jsonb;
alter table public.technician_assignments
  add column if not exists assignment_type text not null default 'survey',
  add column if not exists status text not null default 'assigned',
  add column if not exists accepted_at timestamptz,
  add column if not exists completed_at timestamptz;

alter table public.technician_assignments drop constraint if exists technician_assignments_type_check;
alter table public.technician_assignments add constraint technician_assignments_type_check
  check (assignment_type in ('survey', 'installation'));
alter table public.technician_assignments drop constraint if exists technician_assignments_status_check;
alter table public.technician_assignments add constraint technician_assignments_status_check
  check (status in ('assigned', 'accepted', 'in_progress', 'completed', 'cancelled'));
-- Keep legacy assignment rows and statuses intact. Only infer the new type where the
-- existing booking already records an unambiguous installation service type.
alter table public.technician_assignments drop constraint if exists technician_assignments_booking_id_technician_id_key;
update public.technician_assignments a set assignment_type = 'installation'
from public.service_bookings b where b.id = a.booking_id and b.notes like '[service_type:installation]%';
-- Refuse to continue when legacy data already has multiple active assignments
-- for one workflow. Do not cancel or delete rows automatically to force the index.
do $$
declare v_duplicates text; v_closed_assignments text;
begin
  select string_agg(format('%s/%s (%s)', booking_id, assignment_type, status), '; ')
    into v_closed_assignments
  from (
    select a.booking_id, a.assignment_type, a.status
    from public.technician_assignments a
    join public.service_bookings b on b.id = a.booking_id
    where a.status in ('assigned','accepted','in_progress')
      and b.status in ('completed','cancelled')
    order by a.booking_id, a.assignment_type, a.id
    limit 20
  ) closed_assignments;

  if v_closed_assignments is not null then
    raise exception 'Cannot migrate active assignments attached to completed/cancelled bookings; review and reconcile these rows without deleting history: %', v_closed_assignments
      using errcode = '23514';
  end if;

  select string_agg(format('%s/%s (%s rows)', booking_id, assignment_type, active_count), '; ')
    into v_duplicates
  from (
    select booking_id, assignment_type, count(*) as active_count
    from public.technician_assignments
    where status in ('assigned', 'accepted', 'in_progress')
    group by booking_id, assignment_type
    having count(*) > 1
    order by booking_id, assignment_type
    limit 20
  ) duplicates;

  if v_duplicates is not null then
    raise exception 'Cannot create active-assignment unique index; resolve duplicate groups without deleting assignment history: %', v_duplicates
      using errcode = '23505';
  end if;
end $$;
create unique index if not exists technician_assignments_one_active_per_booking_type_idx
  on public.technician_assignments (booking_id, assignment_type)
  where status in ('assigned', 'accepted', 'in_progress');
-- Backfill only missing canonical installation rows; preserve all existing records.
insert into public.installations(booking_id, customer_id, status, scheduled_at)
select distinct on (b.id) b.id, b.customer_id, 'scheduled', b.preferred_at
from public.technician_assignments a
join public.service_bookings b on b.id = a.booking_id
where a.assignment_type = 'installation'
  and a.status in ('assigned','accepted','in_progress')
  and b.status not in ('completed','cancelled')
order by b.id, a.assigned_at desc, a.id desc
on conflict (booking_id) do nothing;
create index if not exists technician_assignments_technician_type_idx
  on public.technician_assignments (technician_id, assignment_type, assigned_at desc);

alter table public.site_surveys
  add column if not exists contact_name text not null default '',
  add column if not exists contact_phone text not null default '',
  add column if not exists installation_address text not null default '',
  add column if not exists panel_location text not null default '',
  add column if not exists inverter_location text not null default '',
  add column if not exists equipment_details text not null default '',
  add column if not exists site_conditions text not null default '',
  add column if not exists problems text not null default '',
  add column if not exists recommendations text not null default '',
  add column if not exists survey_date date;

alter table public.technician_assignments enable row level security;
alter table public.site_surveys enable row level security;
alter table public.survey_images enable row level security;
alter table public.profiles enable row level security;
alter table public.service_bookings enable row level security;
alter table public.installations enable row level security;

drop policy if exists "Admins and assigned technicians can view assignments" on public.technician_assignments;
drop policy if exists "Admins can manage assignments" on public.technician_assignments;
drop policy if exists "Admin and assignee can read assignments" on public.technician_assignments;
drop policy if exists "Admins manage assignments" on public.technician_assignments;
create policy "Admin and assignee can read assignments" on public.technician_assignments for select to authenticated
  using (((select public.current_user_role()) = 'technician' and technician_id = (select auth.uid()) and (select public.current_user_technician_type()) in (assignment_type,'both')) or (select public.current_user_role()) = 'admin');
drop policy if exists "Assigned technicians can view booking customer profiles" on public.profiles;
create policy "Assigned technicians can view booking customer profiles" on public.profiles for select to authenticated using (
  (select public.current_user_role()) = 'technician' and exists(select 1 from public.service_bookings b join public.technician_assignments a on a.booking_id = b.id where b.customer_id = profiles.id and a.technician_id = (select auth.uid()) and a.status <> 'cancelled' and (select public.current_user_technician_type()) in (a.assignment_type,'both'))
);
create policy "Admins manage assignments" on public.technician_assignments for all to authenticated
  using ((select public.current_user_role()) = 'admin') with check ((select public.current_user_role()) = 'admin');
drop policy if exists "Customers, assigned technicians, and admins can view bookings" on public.service_bookings;
drop policy if exists "Customers assigned technicians and admins view bookings" on public.service_bookings;
create policy "Customers assigned technicians and admins view bookings" on public.service_bookings for select to authenticated using (
  customer_id = (select auth.uid()) or (select public.current_user_role()) = 'admin' or exists(
    select 1 from public.technician_assignments a where (select public.current_user_role()) = 'technician' and a.booking_id = service_bookings.id and a.technician_id = (select auth.uid()) and a.status <> 'cancelled' and (select public.current_user_technician_type()) in (a.assignment_type,'both')
  )
);

drop policy if exists "Customers, assigned technicians, and admins can view installations" on public.installations;
drop policy if exists "Customers assigned installation technicians and admins view installations" on public.installations;
create policy "Customers assigned installation technicians and admins view installations" on public.installations for select to authenticated using (
  customer_id = (select auth.uid())
  or (select public.current_user_role()) = 'admin'
  or exists(
    select 1 from public.technician_assignments a
    where (select public.current_user_role()) = 'technician'
      and a.booking_id = installations.booking_id
      and a.technician_id = (select auth.uid())
      and a.assignment_type = 'installation'
      and a.status <> 'cancelled'
      and (select public.current_user_technician_type()) in ('installation','both')
  )
);

drop policy if exists "Assigned technicians can create surveys" on public.site_surveys;
drop policy if exists "Assigned technicians can update draft surveys" on public.site_surveys;
drop policy if exists "Customers, assigned technicians, and admins can view surveys" on public.site_surveys;
drop policy if exists "Admins can manage surveys" on public.site_surveys;
drop policy if exists "Survey participants can read surveys" on public.site_surveys;
drop policy if exists "Survey assignee edits drafts" on public.site_surveys;
drop policy if exists "Survey assignee updates drafts" on public.site_surveys;
drop policy if exists "Admins manage surveys" on public.site_surveys;
create policy "Survey participants can read surveys" on public.site_surveys for select to authenticated using (
  (select public.current_user_role()) = 'admin'
  or exists(select 1 from public.service_bookings b where b.id = booking_id and b.customer_id = (select auth.uid()))
  or exists(select 1 from public.technician_assignments a where (select public.current_user_role()) = 'technician' and a.booking_id = site_surveys.booking_id and a.technician_id = (select auth.uid()) and a.assignment_type in ('survey','installation') and a.status <> 'cancelled' and (select public.current_user_technician_type()) in (a.assignment_type,'both'))
);
create policy "Survey assignee edits drafts" on public.site_surveys for insert to authenticated with check (
  technician_id = (select auth.uid()) and status = 'draft'
  and (select public.current_user_role()) = 'technician'
  and (select public.current_user_technician_type()) in ('survey','both')
  and exists(select 1 from public.technician_assignments a where a.booking_id = site_surveys.booking_id and a.technician_id = (select auth.uid()) and a.assignment_type = 'survey' and a.status in ('assigned','accepted','in_progress'))
);
create policy "Survey assignee updates drafts" on public.site_surveys for update to authenticated using (
  status = 'draft'
  and (select public.current_user_role()) = 'technician'
  and (select public.current_user_technician_type()) in ('survey','both')
  and exists(select 1 from public.technician_assignments a where a.booking_id = site_surveys.booking_id and a.technician_id = (select auth.uid()) and a.assignment_type = 'survey' and a.status in ('assigned','accepted','in_progress'))
) with check (
  technician_id = (select auth.uid()) and status = 'draft'
  and (select public.current_user_role()) = 'technician'
  and (select public.current_user_technician_type()) in ('survey','both')
  and exists(select 1 from public.technician_assignments a where a.booking_id = site_surveys.booking_id and a.technician_id = (select auth.uid()) and a.assignment_type = 'survey' and a.status in ('assigned','accepted','in_progress'))
);
create policy "Admins manage surveys" on public.site_surveys for all to authenticated using ((select public.current_user_role()) = 'admin') with check ((select public.current_user_role()) = 'admin');

drop policy if exists "Survey images are visible to survey participants" on public.survey_images;
drop policy if exists "Assigned technicians can add survey images" on public.survey_images;
drop policy if exists "Admins can manage survey images" on public.survey_images;
drop policy if exists "Assigned technicians can delete own survey image records" on public.survey_images;
drop policy if exists "Assigned technicians can view survey image records" on public.survey_images;
drop policy if exists "Survey participants read images" on public.survey_images;
drop policy if exists "Survey technicians add images" on public.survey_images;
drop policy if exists "Admins manage survey images" on public.survey_images;
create policy "Survey participants read images" on public.survey_images for select to authenticated using (
  (select public.current_user_role()) = 'admin' or exists (
    select 1 from public.site_surveys s where s.id = survey_id and (
      exists(select 1 from public.technician_assignments a where (select public.current_user_role()) = 'technician' and a.booking_id = s.booking_id and a.technician_id = (select auth.uid()) and a.assignment_type = 'survey' and a.status <> 'cancelled' and (select public.current_user_technician_type()) in ('survey','both'))
      or exists(select 1 from public.service_bookings b where b.id = s.booking_id and b.customer_id = (select auth.uid()))
      or exists(select 1 from public.technician_assignments a where (select public.current_user_role()) = 'technician' and a.booking_id = s.booking_id and a.technician_id = (select auth.uid()) and a.assignment_type = 'installation' and a.status <> 'cancelled' and (select public.current_user_technician_type()) in ('installation','both'))
    )
  )
);
create policy "Survey technicians add images" on public.survey_images for insert to authenticated with check (
  uploaded_by = (select auth.uid()) and (select public.current_user_role()) = 'technician' and (select public.current_user_technician_type()) in ('survey','both') and exists(select 1 from public.site_surveys s join public.technician_assignments a on a.booking_id = s.booking_id where s.id = survey_id and s.status = 'draft' and a.technician_id = (select auth.uid()) and a.assignment_type = 'survey' and a.status in ('accepted','in_progress'))
);
create policy "Admins manage survey images" on public.survey_images for all to authenticated using ((select public.current_user_role()) = 'admin') with check ((select public.current_user_role()) = 'admin');

grant select, insert, update, delete on public.technician_assignments, public.site_surveys, public.survey_images to authenticated;

create or replace function public.submit_site_survey(p_booking_id uuid, p_installation_technician_id uuid default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v_survey public.site_surveys%rowtype; v_assignment public.technician_assignments%rowtype;
begin
  if (select public.current_user_role()) is distinct from 'technician'
    or coalesce((select public.current_user_technician_type()),'') not in ('survey','both') then
    raise exception using errcode = '42501', message = 'Survey technician access required';
  end if;
  perform 1 from public.service_bookings where id = p_booking_id and status not in ('completed','cancelled') for update;
  if not found then raise exception using errcode = 'P0002', message = 'Booking not found'; end if;
  select * into v_assignment from public.technician_assignments
    where booking_id = p_booking_id
      and technician_id = (select auth.uid())
      and assignment_type = 'survey'
      and status in ('assigned','accepted','in_progress')
    order by assigned_at desc, id desc
    limit 1
    for update;
  if not found or v_assignment.status <> 'in_progress' then
    raise exception using errcode = '42501', message = 'Survey assignment required';
  end if;
  select * into v_survey from public.site_surveys where booking_id = p_booking_id for update;
  if not found or v_survey.technician_id <> (select auth.uid()) or v_survey.status <> 'draft' then raise exception using errcode = '42501', message = 'Survey draft not found'; end if;
  if nullif(trim(v_survey.contact_name),'') is null or nullif(trim(v_survey.contact_phone),'') is null
    or nullif(trim(v_survey.installation_address),'') is null or nullif(trim(v_survey.roof_type),'') is null
    or v_survey.roof_area_sqm is null or nullif(trim(v_survey.roof_direction),'') is null
    or nullif(trim(v_survey.site_conditions),'') is null or v_survey.recommended_system_kw is null
    or nullif(trim(v_survey.panel_location),'') is null or nullif(trim(v_survey.inverter_location),'') is null
    or nullif(trim(v_survey.equipment_details),'') is null or v_survey.survey_date is null then
    raise exception using errcode = '22023', message = 'Required survey fields are incomplete';
  end if;
  update public.site_surveys set status = 'submitted', submitted_at = now() where id = v_survey.id;
  update public.technician_assignments set status = 'completed', completed_at = now()
    where id = v_assignment.id and status in ('assigned','accepted','in_progress');
  update public.service_bookings set status = 'survey_completed' where id = p_booking_id;
  if p_installation_technician_id is not null then
    if not exists(select 1 from public.profiles where id = p_installation_technician_id and role = 'technician' and technician_type in ('installation','both')) then raise exception using errcode = '22023', message = 'Invalid installation technician'; end if;
    if not exists(
      select 1 from public.technician_assignments
      where booking_id = p_booking_id and assignment_type = 'installation'
        and technician_id = p_installation_technician_id
        and status in ('assigned','accepted','in_progress')
    ) then
      update public.technician_assignments set status = 'cancelled'
        where booking_id = p_booking_id and assignment_type = 'installation'
          and status in ('assigned','accepted','in_progress');
      insert into public.technician_assignments(booking_id, technician_id, assignment_type, assigned_by)
        values(p_booking_id, p_installation_technician_id, 'installation', (select auth.uid()));
    end if;
    insert into public.installations(booking_id, customer_id, status)
      select p.id, p.customer_id, 'scheduled' from public.service_bookings p where p.id = p_booking_id
      on conflict(booking_id) do update set status = case when public.installations.status = 'cancelled' then 'scheduled' else public.installations.status end, updated_at = now();
  end if;
end $$;
revoke all on function public.submit_site_survey(uuid, uuid) from public;
grant execute on function public.submit_site_survey(uuid, uuid) to authenticated;

-- The table return type changed from a three-column result; PostgreSQL cannot
-- replace a function's OUT-column shape with CREATE OR REPLACE FUNCTION.
do $$
declare
  v_function_oid oid;
  v_dependencies text;
begin
  v_function_oid := to_regprocedure('public.list_installation_technicians()')::oid;
  if v_function_oid is null then return; end if;

  select string_agg(pg_describe_object(d.classid, d.objid, d.objsubid), '; ')
    into v_dependencies
  from pg_depend d
  where d.refclassid = 'pg_proc'::regclass
    and d.refobjid = v_function_oid
    and d.deptype in ('n','a','i','e');

  if v_dependencies is not null then
    raise exception 'Cannot change list_installation_technicians() return columns because dependent database objects exist: %', v_dependencies
      using errcode = '2BP01';
  end if;
end $$;
drop function if exists public.list_installation_technicians();
create function public.list_installation_technicians()
returns table(id uuid, full_name text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if (select public.current_user_role()) is distinct from 'technician'
    or coalesce((select public.current_user_technician_type()),'') not in ('survey','both') then
    raise exception using errcode = '42501', message = 'Survey technician access required';
  end if;
  return query select p.id,p.full_name from public.profiles p
    where p.role = 'technician' and p.technician_type in ('installation','both') order by p.full_name;
end $$;
revoke all on function public.list_installation_technicians() from public;
grant execute on function public.list_installation_technicians() to authenticated;

create or replace function public.assign_booking_technician(p_booking_id uuid, p_technician_id uuid, p_assignment_type text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if (select public.current_user_role()) is distinct from 'admin' then raise exception using errcode = '42501', message = 'Admin role required'; end if;
  if p_assignment_type not in ('survey','installation') then raise exception using errcode = '22023', message = 'Invalid assignment type'; end if;
  perform 1 from public.service_bookings where id = p_booking_id and status not in ('completed','cancelled') for update;
  if not found then raise exception using errcode = 'P0002', message = 'Booking not found'; end if;
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

create or replace function public.update_technician_assignment(p_assignment_id uuid, p_status text, p_notes text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v_assignment public.technician_assignments%rowtype; v_booking_id uuid; v_booking_status text; v_installation_status text;
begin
  if (select public.current_user_role()) is distinct from 'technician' then raise exception using errcode = '42501', message = 'Technician role required'; end if;
  select booking_id into v_booking_id from public.technician_assignments
    where id = p_assignment_id and technician_id = (select auth.uid());
  if not found then raise exception using errcode = '42501', message = 'Assignment access denied'; end if;
  select status into v_booking_status from public.service_bookings where id = v_booking_id for update;
  if not found then raise exception using errcode = '42501', message = 'Booking not found'; end if;
  if v_booking_status in ('completed','cancelled') then
    raise exception using errcode = '22023', message = 'Closed booking cannot be changed';
  end if;
  select * into v_assignment from public.technician_assignments where id = p_assignment_id for update;
  if not found or v_assignment.technician_id <> (select auth.uid()) or (select public.current_user_technician_type()) not in (v_assignment.assignment_type,'both') then raise exception using errcode = '42501', message = 'Assignment access denied'; end if;
  if p_status is null or p_status not in ('accepted','in_progress','completed','cancelled') then raise exception using errcode = '22023', message = 'Invalid assignment status'; end if;
  if v_assignment.status = 'completed' or v_assignment.status = 'cancelled' then raise exception using errcode = '22023', message = 'Assignment is already closed'; end if;
  if p_status = 'accepted' and v_assignment.status not in ('assigned','accepted') then raise exception using errcode = '22023', message = 'Invalid assignment transition'; end if;
  if p_status = 'in_progress' and v_assignment.status not in ('accepted','in_progress') then raise exception using errcode = '22023', message = 'Accept the assignment before starting'; end if;
  if p_status = 'completed' and v_assignment.assignment_type = 'survey' then raise exception using errcode = '22023', message = 'Submit the required survey report to complete this assignment'; end if;
  if p_status = 'completed' and v_assignment.assignment_type = 'installation' and v_assignment.status <> 'in_progress' then raise exception using errcode = '22023', message = 'Start installation before completing'; end if;
  if v_assignment.assignment_type = 'installation' then
    select status into v_installation_status from public.installations where booking_id = v_assignment.booking_id for update;
    if not found or v_installation_status in ('completed','cancelled') then
      raise exception using errcode = '22023', message = 'Installation record is closed or missing';
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
      updated_at = now() where booking_id = v_assignment.booking_id;
    if p_status = 'in_progress' then update public.service_bookings set status = 'installing' where id = v_assignment.booking_id; end if;
    if p_status = 'completed' then update public.service_bookings set status = 'completed' where id = v_assignment.booking_id; end if;
    if p_status = 'cancelled' then update public.service_bookings set status = 'approved' where id = v_assignment.booking_id and status = 'installing'; end if;
  end if;
  if v_assignment.assignment_type = 'survey' and p_status = 'in_progress' then update public.service_bookings set status = 'surveying' where id = v_assignment.booking_id; end if;
  if v_assignment.assignment_type = 'survey' and p_status = 'cancelled' then update public.service_bookings set status = 'pending' where id = v_assignment.booking_id and status in ('assigned','surveying'); end if;
end $$;
revoke all on function public.update_technician_assignment(uuid,text,text) from public;
grant execute on function public.update_technician_assignment(uuid,text,text) to authenticated;
