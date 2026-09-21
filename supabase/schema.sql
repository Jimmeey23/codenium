-- Advanced 3D QR Generator — Supabase / Postgres schema
-- Run in Supabase Dashboard → SQL Editor → New query → Run.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- qr_codes
create table if not exists public.qr_codes (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  name           text not null default 'Untitled code',
  content_type   text not null default 'url',
  content        jsonb not null default '{}'::jsonb,
  static_payload text not null default '',
  dynamic        boolean not null default true,
  mode           text not null default 'redirect',
  target_url     text not null default '',
  landing        jsonb,
  routing        jsonb,
  design         jsonb not null,
  password       text,
  expires_at     timestamptz,
  active_from    timestamptz,
  max_scans      integer,
  scan_count     integer not null default 0,
  active         boolean not null default true,
  expired_url    text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists qr_codes_created_idx on public.qr_codes (created_at);
create index if not exists qr_codes_slug_idx    on public.qr_codes (slug);

-- ---------------------------------------------------------------- qr_scans
create table if not exists public.qr_scans (
  id         serial primary key,
  code_id    uuid not null references public.qr_codes (id) on delete cascade,
  scanned_at timestamptz not null default now(),
  device     text not null default 'unknown',
  os         text not null default 'unknown',
  browser    text not null default 'unknown',
  referrer   text,
  outcome    text not null default 'ok'
);

create index if not exists qr_scans_code_idx    on public.qr_scans (code_id);
create index if not exists qr_scans_time_idx    on public.qr_scans (scanned_at);

-- ------------------------------------------------- updated_at auto-touch
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists qr_codes_touch_updated_at on public.qr_codes;
create trigger qr_codes_touch_updated_at
  before update on public.qr_codes
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------- RLS
-- The app connects with the Postgres superuser/pooler connection string
-- (DATABASE_URL), which bypasses RLS. Enabling RLS with no policies blocks
-- the public anon/authenticated PostgREST API from reading these tables.
alter table public.qr_codes enable row level security;
alter table public.qr_scans enable row level security;
