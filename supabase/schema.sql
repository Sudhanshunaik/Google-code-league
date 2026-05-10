-- ============================================================
-- GOAN SPORTS MATCHMAKING PLATFORM - Supabase PostgreSQL Schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ============================================================

-- 1. PROFILES TABLE
-- Stores user profile data, linked to Supabase Auth
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text,
  skill_rating integer not null default 1200,
  matches_played integer not null default 0,
  avatar_url text,
  preferred_sports text[] default '{}',
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Policies: Users can read all profiles, but only update their own
create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);


-- 2. MATCHES TABLE
-- Stores upcoming and past sports matches at local Goan venues
create table if not exists public.matches (
  id uuid default gen_random_uuid() primary key,
  sport text not null,           -- e.g., 'Futsal', 'Cricket', 'Football'
  format text not null,          -- e.g., '5v5', '7v7', '11v11'
  location text not null,        -- e.g., 'Calangute Beach Turf'
  match_time timestamptz not null,
  capacity integer not null default 10,
  status text not null default 'upcoming' check (status in ('upcoming', 'live', 'completed', 'cancelled')),
  match_status text not null default 'scheduled',
  team_a_score integer,
  team_b_score integer,
  created_at timestamptz default now()
);

alter table public.matches enable row level security;

-- Everyone can view matches
create policy "Matches are viewable by everyone"
  on public.matches for select using (true);


-- 3. BOOKINGS TABLE
-- Tracks which user booked which match, with status
create table if not exists public.bookings (
  id uuid default gen_random_uuid() primary key,
  match_id uuid references public.matches(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'waitlisted', 'cancelled')),
  created_at timestamptz default now(),
  -- Prevent duplicate active bookings for the same match
  unique (match_id, user_id)
);

alter table public.bookings enable row level security;

-- Everyone can see bookings (needed for player lists & team display)
create policy "Bookings are viewable by everyone"
  on public.bookings for select using (true);

-- Authenticated users can insert bookings
create policy "Authenticated users can book"
  on public.bookings for insert with check (auth.uid() = user_id);

-- Users can update (cancel) their own bookings
create policy "Users can update own bookings"
  on public.bookings for update using (auth.uid() = user_id);


-- 4. ENABLE REALTIME on bookings table
-- This powers the live UI updates when someone joins or leaves a match
alter publication supabase_realtime add table public.bookings;


-- 5. AUTO-CREATE PROFILE ON SIGNUP (Trigger)
-- Automatically creates a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if it exists, then recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
