-- Let admins review installation progress notes and technician uploaded photos.
create table if not exists public.installation_images (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.service_bookings (id) on delete cascade,
  storage_path text not null,
  uploaded_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists installation_images_booking_created_idx
  on public.installation_images (booking_id, created_at desc);

alter table public.installation_images enable row level security;
grant select, insert on public.installation_images to authenticated;

drop policy if exists "Admins read installation image records" on public.installation_images;
create policy "Admins read installation image records"
  on public.installation_images for select to authenticated
  using ((select public.current_user_role()) = 'admin');

drop policy if exists "Assigned technicians read installation image records" on public.installation_images;
create policy "Assigned technicians read installation image records"
  on public.installation_images for select to authenticated
  using (
    (select public.current_user_role()) = 'technician'
    and exists (
      select 1 from public.technician_assignments a
      where a.booking_id = installation_images.booking_id
        and a.technician_id = (select auth.uid())
        and a.assignment_type = 'installation'
        and a.status <> 'cancelled'
        and (select public.current_user_technician_type()) in ('installation','both')
    )
  );

drop policy if exists "Assigned technicians upload installation image records" on public.installation_images;
create policy "Assigned technicians upload installation image records"
  on public.installation_images for insert to authenticated
  with check (
    uploaded_by = (select auth.uid())
    and (select public.current_user_role()) = 'technician'
    and exists (
      select 1 from public.technician_assignments a
      where a.booking_id = installation_images.booking_id
        and a.technician_id = (select auth.uid())
        and a.assignment_type = 'installation'
        and a.status in ('accepted','in_progress')
        and (select public.current_user_technician_type()) in ('installation','both')
    )
  );

insert into storage.buckets (id, name, public)
values ('installation-images', 'installation-images', false)
on conflict (id) do update set public = false;

drop policy if exists "Admins read installation image files" on storage.objects;
create policy "Admins read installation image files"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'installation-images'
    and (select public.current_user_role()) = 'admin'
  );

drop policy if exists "Assigned technicians upload installation image files" on storage.objects;
create policy "Assigned technicians upload installation image files"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'installation-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select public.current_user_role()) = 'technician'
    and exists (
      select 1 from public.technician_assignments a
      where a.booking_id = ((storage.foldername(name))[2])::uuid
        and a.technician_id = (select auth.uid())
        and a.assignment_type = 'installation'
        and a.status in ('accepted','in_progress')
        and (select public.current_user_technician_type()) in ('installation','both')
    )
  );

