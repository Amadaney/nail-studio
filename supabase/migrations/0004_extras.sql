-- =====================================================================
-- v2: Spanish content, WhatsApp, gallery, hero image, default artist.
-- Safe to run once after 0001-0003.
-- =====================================================================
alter table public.services
  add column if not exists name_es text check (char_length(name_es) <= 120),
  add column if not exists description_es text check (char_length(description_es) <= 1000);

alter table public.business_settings
  add column if not exists whatsapp text check (whatsapp is null or whatsapp ~ '^[0-9]{10,15}$'),
  add column if not exists hero_image_url text,
  add column if not exists maps_url text check (maps_url is null or maps_url ~ '^https://'),
  add column if not exists about_en text check (char_length(about_en) <= 1500),
  add column if not exists about_es text check (char_length(about_es) <= 1500);

-- Gallery of your work (public read, admin manages)
create table if not exists public.gallery_images (
  id           uuid primary key default gen_random_uuid(),
  image_url    text not null,
  storage_path text,
  caption      text check (char_length(caption) <= 200),
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);
alter table public.gallery_images enable row level security;
create policy gallery_public_read on public.gallery_images for select to anon, authenticated using (true);
create policy gallery_admin_all   on public.gallery_images for all    to authenticated using (public.is_admin()) with check (public.is_admin());

-- One default artist (personal business). New services get linked to it automatically from the admin panel.
insert into public.professionals (display_name)
select 'Studio Artist' where not exists (select 1 from public.professionals);

insert into public.professional_services (professional_id, service_id)
select p.id, s.id from public.professionals p cross join public.services s
on conflict (professional_id, service_id) do nothing;

-- Spanish names for the starter services
update public.services set name_es = 'Manicure clásico',       description_es = 'Forma, cutículas y esmalte.'                       where name = 'Classic Manicure'  and name_es is null;
update public.services set name_es = 'Manicure en gel',        description_es = 'Color en gel de larga duración con preparación.'   where name = 'Gel Manicure'      and name_es is null;
update public.services set name_es = 'Pedicure clásico',       description_es = 'Remojo, exfoliación, masaje y esmalte.'            where name = 'Classic Pedicure'  and name_es is null;
update public.services set name_es = 'Combo manicure + pedicure', description_es = 'Nuestro manicure y pedicure juntos.'           where name = 'Mani + Pedi Combo' and name_es is null;
update public.services set name_es = 'Diseño de uñas',         description_es = 'Diseños pintados a mano, precio por set.'          where name = 'Custom Nail Art'   and name_es is null;
