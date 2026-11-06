-- =====================================================================
-- Nail Studio: core schema, constraints, triggers
-- =====================================================================
create extension if not exists pgcrypto;
create extension if not exists btree_gist;

create type public.user_role as enum ('admin', 'professional');
create type public.booking_status as enum ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');

-- ---------- profiles (1:1 with auth.users) ----------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null check (char_length(full_name) between 2 and 120),
  email       text not null,
  phone       text check (phone is null or phone ~ '^\+[1-9][0-9]{9,14}$'),
  role        public.user_role not null default 'professional',
  created_at  timestamptz not null default now()
);

-- New auth users ALWAYS become 'professional'. Role is never read from client metadata.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (new.id, coalesce(nullif(new.raw_user_meta_data->>'full_name',''), 'New user'), new.email, 'professional');
  return new;
end; $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- helper functions used by RLS ----------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Block privilege escalation: only an admin (or the service role / SQL editor) can change roles.
create or replace function public.prevent_role_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null and not public.is_admin() then
    raise exception 'role change not allowed';
  end if;
  return new;
end; $$;

create trigger profiles_prevent_role_change before update on public.profiles
  for each row execute function public.prevent_role_change();

-- ---------- services ----------
create table public.services (
  id               uuid primary key default gen_random_uuid(),
  name             text not null check (char_length(name) between 2 and 120),
  description      text check (char_length(description) <= 1000),
  category         text not null default 'manicure' check (category in ('manicure','pedicure','combo','design')),
  price            numeric(10,2) not null check (price >= 0),          -- USD
  duration_minutes integer not null check (duration_minutes between 5 and 480),
  image_url        text,
  active           boolean not null default true,
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ---------- professionals ----------
create table public.professionals (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid unique references public.profiles(id) on delete set null,
  display_name text not null check (char_length(display_name) between 2 and 120),
  description text check (char_length(description) <= 1000),
  photo_url   text,
  active      boolean not null default true
);

create table public.professional_services (
  id              uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  service_id      uuid not null references public.services(id) on delete cascade,
  unique (professional_id, service_id)
);

-- ---------- business config ----------
create table public.business_settings (
  id                  integer primary key default 1 check (id = 1),   -- single-row table
  business_name       text not null default 'Nude Atelier',
  address             text,
  phone               text,
  email               text,
  instagram           text,
  timezone            text not null default 'America/New_York',
  min_notice_hours    integer not null default 2  check (min_notice_hours >= 0),
  max_advance_days    integer not null default 60 check (max_advance_days between 1 and 365),
  buffer_minutes      integer not null default 10 check (buffer_minutes between 0 and 120),
  slot_interval_min   integer not null default 15 check (slot_interval_min in (5,10,15,20,30,60)),
  allow_multi_service boolean not null default true
);
insert into public.business_settings (id) values (1);

create table public.business_hours (
  id            uuid primary key default gen_random_uuid(),
  day_of_week   smallint not null check (day_of_week between 0 and 6),   -- 0 = Sunday
  opening_time  time not null,
  closing_time  time not null,
  is_open       boolean not null default true,
  break_start   time,
  break_end     time,
  unique (day_of_week),
  check (closing_time > opening_time),
  check ((break_start is null and break_end is null) or (break_start < break_end))
);

create table public.blocked_dates (
  id              uuid primary key default gen_random_uuid(),
  professional_id uuid references public.professionals(id) on delete cascade, -- null = whole studio
  date            date not null,
  start_time      time,
  end_time        time,
  reason          text check (char_length(reason) <= 200),
  check ((start_time is null and end_time is null) or (start_time < end_time))
);
create index blocked_dates_date_idx on public.blocked_dates (date);

-- ---------- bookings ----------
create table public.bookings (
  id                    uuid primary key default gen_random_uuid(),
  customer_name         text not null check (char_length(customer_name) between 2 and 120),
  customer_email        text not null check (customer_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  customer_phone        text not null check (customer_phone ~ '^\+[1-9][0-9]{9,14}$'),
  professional_id       uuid not null references public.professionals(id) on delete restrict,
  booking_date          date not null,
  start_time            time not null,
  end_time              time not null,
  total_price           numeric(10,2) not null check (total_price >= 0),
  status                public.booking_status not null default 'pending',
  notes                 text check (char_length(notes) <= 500),
  cancel_token_hash     text,                    -- SHA-256 of the one-time token (never the token itself)
  cancel_token_expires  timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  check (end_time > start_time),
  -- DB-level guarantee: a professional can't have two overlapping active bookings (race-condition proof)
  constraint bookings_no_overlap exclude using gist (
    professional_id with =,
    tsrange(booking_date + start_time, booking_date + end_time) with &&
  ) where (status in ('pending','confirmed'))
);
create index bookings_date_idx on public.bookings (booking_date, status);
create index bookings_professional_idx on public.bookings (professional_id, booking_date);
create index bookings_email_idx on public.bookings (lower(customer_email));
create index bookings_phone_idx on public.bookings (customer_phone);

-- Multi-service support (snapshot of price/duration at booking time)
create table public.booking_services (
  id               uuid primary key default gen_random_uuid(),
  booking_id       uuid not null references public.bookings(id) on delete cascade,
  service_id       uuid not null references public.services(id) on delete restrict,
  price            numeric(10,2) not null check (price >= 0),
  duration_minutes integer not null check (duration_minutes > 0),
  unique (booking_id, service_id)
);

-- ---------- reviews ----------
create table public.reviews (
  id            uuid primary key default gen_random_uuid(),
  customer_name text not null check (char_length(customer_name) between 2 and 80),
  rating        smallint not null check (rating between 1 and 5),
  comment       text check (char_length(comment) <= 600),
  approved      boolean not null default false,
  created_at    timestamptz not null default now()
);

-- ---------- audit logs (append-only) ----------
create table public.audit_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete set null,
  action     text not null,
  entity     text not null,
  entity_id  text,
  details    jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_created_idx on public.audit_logs (created_at desc);

create or replace function public.audit_logs_immutable()
returns trigger language plpgsql as $$
begin raise exception 'audit_logs is append-only'; end; $$;
create trigger audit_logs_no_update before update or delete on public.audit_logs
  for each row execute function public.audit_logs_immutable();

-- ---------- updated_at ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
create trigger services_touch before update on public.services for each row execute function public.touch_updated_at();
create trigger bookings_touch before update on public.bookings for each row execute function public.touch_updated_at();

-- =====================================================================
-- create_booking(): the ONLY way public bookings are written.
-- Re-validates everything server-side inside one transaction.
-- Callable by service_role only (invoked from a Server Action after Zod + rate limit).
-- =====================================================================
create or replace function public.create_booking(
  p_name text, p_email text, p_phone text,
  p_professional_id uuid, p_service_ids uuid[],
  p_date date, p_start time, p_notes text, p_token_hash text
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  s public.business_settings;
  v_duration int; v_price numeric(10,2); v_count int;
  v_end time; v_id uuid; v_hours public.business_hours;
  v_local_now timestamp;
begin
  select * into s from public.business_settings where id = 1;
  v_local_now := now() at time zone s.timezone;

  select count(*), coalesce(sum(duration_minutes),0), coalesce(sum(price),0)
    into v_count, v_duration, v_price
  from public.services
  where id = any(p_service_ids) and active;

  if v_count = 0 or v_count <> cardinality(p_service_ids) then raise exception 'invalid_services'; end if;
  if v_count > 1 and not s.allow_multi_service then raise exception 'multi_service_disabled'; end if;

  if not exists (
    select 1 from public.professionals p
    where p.id = p_professional_id and p.active
      and not exists (
        select 1 from unnest(p_service_ids) sid
        where not exists (select 1 from public.professional_services ps
                          where ps.professional_id = p.id and ps.service_id = sid))
  ) then raise exception 'invalid_professional'; end if;

  v_end := p_start + make_interval(mins => v_duration);
  if v_end <= p_start then raise exception 'invalid_time'; end if;   -- crossed midnight

  -- notice window
  if (p_date + p_start) < v_local_now + make_interval(hours => s.min_notice_hours) then raise exception 'too_soon'; end if;
  if p_date > (v_local_now::date + s.max_advance_days) then raise exception 'too_far'; end if;

  -- business hours + break
  select * into v_hours from public.business_hours where day_of_week = extract(dow from p_date)::int;
  if not found or not v_hours.is_open or p_start < v_hours.opening_time or v_end > v_hours.closing_time then
    raise exception 'outside_hours';
  end if;
  if v_hours.break_start is not null and p_start < v_hours.break_end and v_end > v_hours.break_start then
    raise exception 'during_break';
  end if;

  -- blocked dates (studio-wide or professional-specific)
  if exists (
    select 1 from public.blocked_dates b
    where b.date = p_date
      and (b.professional_id is null or b.professional_id = p_professional_id)
      and (b.start_time is null or (p_start < b.end_time and v_end > b.start_time))
  ) then raise exception 'blocked'; end if;

  insert into public.bookings (customer_name, customer_email, customer_phone, professional_id,
    booking_date, start_time, end_time, total_price, notes, cancel_token_hash, cancel_token_expires)
  values (p_name, lower(p_email), p_phone, p_professional_id, p_date, p_start, v_end, v_price,
    p_notes, p_token_hash, (p_date + p_start) at time zone s.timezone - interval '2 hours')
  returning id into v_id;

  insert into public.booking_services (booking_id, service_id, price, duration_minutes)
  select v_id, id, price, duration_minutes from public.services where id = any(p_service_ids);

  return v_id;
exception
  when exclusion_violation then raise exception 'slot_unavailable';
end; $$;

revoke all on function public.create_booking(text,text,text,uuid,uuid[],date,time,text,text) from public, anon, authenticated;
grant execute on function public.create_booking(text,text,text,uuid,uuid[],date,time,text,text) to service_role;
