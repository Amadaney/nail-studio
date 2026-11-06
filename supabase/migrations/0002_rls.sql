-- =====================================================================
-- Row Level Security. Default = deny. Every policy is role-specific.
-- Public bookings go through create_booking() (service role), so anon has NO write access to bookings.
-- =====================================================================
alter table public.profiles              enable row level security;
alter table public.services              enable row level security;
alter table public.professionals         enable row level security;
alter table public.professional_services enable row level security;
alter table public.bookings              enable row level security;
alter table public.booking_services      enable row level security;
alter table public.business_hours        enable row level security;
alter table public.blocked_dates         enable row level security;
alter table public.reviews               enable row level security;
alter table public.business_settings     enable row level security;
alter table public.audit_logs            enable row level security;

-- profiles: self-read, admin-all. Self-update allowed (role change blocked by trigger).
create policy profiles_select_self  on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
create policy profiles_update_self  on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_admin_all    on public.profiles for all    to authenticated using (public.is_admin()) with check (public.is_admin());

-- services: public sees active only; admin manages all
create policy services_public_read on public.services for select to anon, authenticated using (active);
create policy services_admin_all   on public.services for all    to authenticated using (public.is_admin()) with check (public.is_admin());

-- professionals
create policy pros_public_read on public.professionals for select to anon, authenticated using (active);
create policy pros_admin_all   on public.professionals for all    to authenticated using (public.is_admin()) with check (public.is_admin());

create policy pro_services_public_read on public.professional_services for select to anon, authenticated using (true);
create policy pro_services_admin_all   on public.professional_services for all    to authenticated using (public.is_admin()) with check (public.is_admin());

-- bookings: admin all; professional sees/updates only their own. No public access at all.
create policy bookings_admin_all on public.bookings for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy bookings_pro_read on public.bookings for select to authenticated using (
  professional_id in (select id from public.professionals where profile_id = auth.uid()));
create policy bookings_pro_update on public.bookings for update to authenticated
  using (professional_id in (select id from public.professionals where profile_id = auth.uid()))
  with check (professional_id in (select id from public.professionals where profile_id = auth.uid()));

create policy booking_services_admin_all on public.booking_services for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy booking_services_pro_read on public.booking_services for select to authenticated using (
  booking_id in (select b.id from public.bookings b join public.professionals p on p.id = b.professional_id where p.profile_id = auth.uid()));

-- schedule config: public read (needed to render availability), admin write
create policy hours_public_read   on public.business_hours for select to anon, authenticated using (true);
create policy hours_admin_all     on public.business_hours for all    to authenticated using (public.is_admin()) with check (public.is_admin());
create policy blocked_admin_all   on public.blocked_dates  for all    to authenticated using (public.is_admin()) with check (public.is_admin());
create policy blocked_pro_own     on public.blocked_dates  for all    to authenticated
  using (professional_id in (select id from public.professionals where profile_id = auth.uid()))
  with check (professional_id in (select id from public.professionals where profile_id = auth.uid()));

-- settings: public read of the row (contains only public business info), admin write
create policy settings_public_read on public.business_settings for select to anon, authenticated using (true);
create policy settings_admin_write on public.business_settings for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- reviews: only approved are public
create policy reviews_public_read on public.reviews for select to anon, authenticated using (approved);
create policy reviews_admin_all   on public.reviews for all    to authenticated using (public.is_admin()) with check (public.is_admin());

-- audit logs: admin read only. Writes come from the service role (bypasses RLS). Table is also append-only via trigger.
create policy audit_admin_read on public.audit_logs for select to authenticated using (public.is_admin());

-- Table privileges: remove anything RLS doesn't explicitly need for anon
revoke all on public.bookings, public.booking_services, public.profiles, public.audit_logs, public.blocked_dates from anon;

-- =====================================================================
-- Storage: public-read bucket, admin-only write, image types and 5 MB limit enforced by the bucket
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy media_admin_insert on storage.objects for insert to authenticated with check (bucket_id = 'media' and public.is_admin());
create policy media_admin_update on storage.objects for update to authenticated using (bucket_id = 'media' and public.is_admin());
create policy media_admin_delete on storage.objects for delete to authenticated using (bucket_id = 'media' and public.is_admin());
