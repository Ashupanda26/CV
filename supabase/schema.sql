-- =====================================================================
-- BlueStone Pools — Supabase schema
-- Run once in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- Re-runnable: drops nothing, uses IF NOT EXISTS where possible.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- users: staff profiles, 1:1 with auth.users
-- ---------------------------------------------------------------------
create table if not exists public.users (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null default '',
  email       text not null,
  role        text not null default 'staff' check (role in ('admin', 'staff')),
  created_at  timestamptz not null default now()
);

-- Every new auth user (invited from the dashboard) gets a staff profile.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- True when the caller is a signed-in staff member.
create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.users where id = auth.uid());
$$;

-- ---------------------------------------------------------------------
-- customers
-- ---------------------------------------------------------------------
create table if not exists public.customers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null default '',
  phone       text not null default '',
  address     text not null default '',
  postcode    text not null default '',
  status      text not null default 'prospect' check (status in ('prospect', 'active', 'completed')),
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- leads: website / WhatsApp enquiries, optionally converted to a customer
-- ---------------------------------------------------------------------
create table if not exists public.leads (
  id               uuid primary key default gen_random_uuid(),
  customer_id      uuid references public.customers (id) on delete set null,
  name             text not null,
  email            text not null,
  phone            text not null,
  postcode         text not null,
  enquiry_type     text not null,
  budget           text not null default '',
  message          text not null default '',
  status           text not null default 'new'
                   check (status in ('new', 'contacted', 'site_visit', 'quote_sent', 'won', 'lost')),
  estimated_value  numeric(12, 2) not null default 0,
  source           text not null default 'Website',
  created_at       timestamptz not null default now()
);
create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_status_idx on public.leads (status);

-- ---------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------
create table if not exists public.projects (
  id                   uuid primary key default gen_random_uuid(),
  customer_id          uuid not null references public.customers (id) on delete cascade,
  name                 text not null,
  location             text not null default '',
  pool_type            text not null default '',
  description          text not null default '',
  value                numeric(12, 2) not null default 0,
  start_date           date,
  expected_completion  date,
  status               text not null default 'planning'
                       check (status in ('planning', 'design', 'approved', 'construction', 'completed')),
  progress             int not null default 0 check (progress between 0 and 100),
  images               text[] not null default '{}',
  created_at           timestamptz not null default now()
);
create index if not exists projects_customer_idx on public.projects (customer_id);

-- ---------------------------------------------------------------------
-- project_updates: the build timeline (one row per stage)
-- ---------------------------------------------------------------------
create table if not exists public.project_updates (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects (id) on delete cascade,
  stage         text not null,
  note          text not null default '',
  sort_order    int not null default 0,
  completed     boolean not null default false,
  completed_at  timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists project_updates_project_idx on public.project_updates (project_id, sort_order);

-- ---------------------------------------------------------------------
-- quotes + quote_items
-- ---------------------------------------------------------------------
create table if not exists public.quotes (
  id            uuid primary key default gen_random_uuid(),
  quote_number  text not null unique,
  customer_id   uuid not null references public.customers (id) on delete cascade,
  project_id    uuid references public.projects (id) on delete set null,
  status        text not null default 'draft' check (status in ('draft', 'sent', 'approved', 'declined')),
  notes         text not null default '',
  valid_until   date,
  total         numeric(12, 2) not null default 0,
  created_at    timestamptz not null default now()
);
create index if not exists quotes_customer_idx on public.quotes (customer_id);

create table if not exists public.quote_items (
  id           uuid primary key default gen_random_uuid(),
  quote_id     uuid not null references public.quotes (id) on delete cascade,
  category     text not null,
  description  text not null default '',
  amount       numeric(12, 2) not null default 0,
  sort_order   int not null default 0
);
create index if not exists quote_items_quote_idx on public.quote_items (quote_id);

-- ---------------------------------------------------------------------
-- maintenance_tickets
-- ---------------------------------------------------------------------
create table if not exists public.maintenance_tickets (
  id             uuid primary key default gen_random_uuid(),
  ticket_number  int not null unique,
  customer_id    uuid not null references public.customers (id) on delete cascade,
  project_id     uuid references public.projects (id) on delete set null,
  issue          text not null,
  description    text not null default '',
  priority       text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  status         text not null default 'open'
                 check (status in ('open', 'assigned', 'in_progress', 'resolved', 'closed')),
  assigned_to    text not null default '',
  created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- feedback: author_name / author_location are the public display fields,
-- so the public site never needs to read the customers table.
-- ---------------------------------------------------------------------
create table if not exists public.feedback (
  id               uuid primary key default gen_random_uuid(),
  customer_id      uuid not null references public.customers (id) on delete cascade,
  project_id       uuid references public.projects (id) on delete set null,
  author_name      text not null,
  author_location  text not null default '',
  rating           int not null check (rating between 1 and 5),
  comment          text not null,
  published        boolean not null default false,
  created_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- messages (WhatsApp / email / SMS conversation log)
-- ---------------------------------------------------------------------
create table if not exists public.messages (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid not null references public.customers (id) on delete cascade,
  project_id   uuid references public.projects (id) on delete set null,
  direction    text not null check (direction in ('inbound', 'outbound')),
  body         text not null,
  status       text not null default 'unread' check (status in ('unread', 'read', 'replied')),
  channel      text not null default 'whatsapp' check (channel in ('whatsapp', 'email', 'sms')),
  created_at   timestamptz not null default now()
);
create index if not exists messages_customer_idx on public.messages (customer_id, created_at);

-- ---------------------------------------------------------------------
-- gallery_items (public website gallery)
-- ---------------------------------------------------------------------
create table if not exists public.gallery_items (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  category     text not null check (category in ('New Pools', 'Luxury Pools', 'Renovations', 'Residential')),
  location     text not null default '',
  pool_type    text not null default '',
  description  text not null default '',
  image_url    text not null,
  published    boolean not null default true,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- business_settings: single row (id = 1)
-- ---------------------------------------------------------------------
create table if not exists public.business_settings (
  id               int primary key default 1 check (id = 1),
  company_name     text not null default 'BlueStone Pools',
  phone            text not null default '',
  email            text not null default '',
  whatsapp_number  text not null default '',
  address          text not null default '',
  business_hours   text not null default '',
  instagram_url    text not null default '',
  facebook_url     text not null default '',
  linkedin_url     text not null default '',
  youtube_url      text not null default ''
);
insert into public.business_settings (id) values (1) on conflict (id) do nothing;

-- =====================================================================
-- Row Level Security
--   * Staff (rows in public.users) have full access to business tables.
--   * Anonymous visitors can: submit leads, read published gallery items,
--     read published feedback, and read business settings. Nothing else.
-- =====================================================================
do $$
declare t text;
begin
  foreach t in array array['customers','leads','projects','project_updates','quotes','quote_items',
                           'maintenance_tickets','feedback','messages','gallery_items','business_settings']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "staff full access" on public.%I', t);
    execute format('create policy "staff full access" on public.%I for all to authenticated using (public.is_staff()) with check (public.is_staff())', t);
  end loop;
end $$;

alter table public.users enable row level security;
drop policy if exists "staff read users" on public.users;
create policy "staff read users" on public.users for select to authenticated using (public.is_staff());

drop policy if exists "public submit leads" on public.leads;
create policy "public submit leads" on public.leads for insert to anon
  with check (status = 'new' and customer_id is null);

drop policy if exists "public read published gallery" on public.gallery_items;
create policy "public read published gallery" on public.gallery_items for select to anon using (published);

drop policy if exists "public read published feedback" on public.feedback;
create policy "public read published feedback" on public.feedback for select to anon using (published);

drop policy if exists "public read settings" on public.business_settings;
create policy "public read settings" on public.business_settings for select to anon using (true);

-- =====================================================================
-- Storage: public bucket for gallery / project photos
-- =====================================================================
insert into storage.buckets (id, name, public) values ('gallery', 'gallery', true)
on conflict (id) do nothing;

drop policy if exists "staff upload gallery" on storage.objects;
create policy "staff upload gallery" on storage.objects for insert to authenticated
  with check (bucket_id = 'gallery' and public.is_staff());

drop policy if exists "staff manage gallery" on storage.objects;
create policy "staff manage gallery" on storage.objects for delete to authenticated
  using (bucket_id = 'gallery' and public.is_staff());
