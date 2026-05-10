-- 1. Add missing columns to the matches table
alter table public.matches 
add column if not exists flyer_url text,
add column if not exists is_verified boolean default true;

-- 2. Allow authenticated users to insert matches (needed when uploading a flyer)
create policy "Users can create matches"
  on public.matches for insert 
  with check (auth.role() = 'authenticated');

-- 3. Storage Policies for tournament-flyers bucket
-- Allow anyone to read the flyers
create policy "Public Access" 
  on storage.objects for select 
  using ( bucket_id = 'tournament-flyers' );

-- Allow authenticated users to upload flyers
create policy "Users can upload" 
  on storage.objects for insert 
  with check ( bucket_id = 'tournament-flyers' and auth.role() = 'authenticated' );
