-- ============================================================
-- AUTONOMOUS TOURNAMENT INGESTION — Database & Storage Setup
-- Run this in your Supabase SQL Editor AFTER the base schema.sql
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. CREATE STORAGE BUCKET for tournament flyer uploads
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('tournament-flyers', 'tournament-flyers', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload flyers
create policy "Authenticated users can upload flyers"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'tournament-flyers' );

-- Allow public read access to all flyers
create policy "Public read access for flyers"
  on storage.objects for select
  to public
  using (bucket_id = 'tournament-flyers');


-- ─────────────────────────────────────────────────────────────
-- 2. ADD NEW COLUMNS to the matches table
-- ─────────────────────────────────────────────────────────────
alter table public.matches
  add column if not exists flyer_url text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists is_verified boolean not null default false;

-- Allow authenticated users to insert matches (for flyer-based creation)
create policy "Authenticated users can insert matches"
  on public.matches for insert
  to authenticated
  with check (true);

-- Allow updates to matches (for n8n webhook verification)
create policy "Service role can update matches"
  on public.matches for update
  using (true)
  with check (true);
