-- ============================================================
-- ELO SYSTEM MIGRATION SCRIPT
-- Run this in your Supabase SQL Editor to update the database
-- ============================================================

-- 1. Update Profiles Table
-- Drop the existing constraint if it exists
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_skill_rating_check;

-- Add matches_played column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS matches_played integer not null default 0;

-- Change the default value for skill_rating
ALTER TABLE public.profiles ALTER COLUMN skill_rating SET DEFAULT 1200;

-- Migrate existing 1-10 skill ratings to the 1200 ELO baseline
-- Only updates if the rating is <= 10 (the old scale)
UPDATE public.profiles
SET skill_rating = 1200
WHERE skill_rating <= 10;

-- 2. Update Matches Table
-- Add team scores and match_status
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS match_status text not null default 'scheduled';
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS team_a_score integer;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS team_b_score integer;
