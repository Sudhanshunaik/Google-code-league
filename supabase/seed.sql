-- ============================================================
-- SEED DATA - Goan Sports Venues & Upcoming Matches
-- Run this AFTER schema.sql in your Supabase SQL Editor
-- ============================================================

-- Insert sample matches at iconic Goan sports venues
insert into public.matches (sport, format, location, match_time, capacity, status) values
  -- Futsal matches
  ('Futsal', '5v5', 'Calangute Beach Turf', now() + interval '2 days', 10, 'upcoming'),
  ('Futsal', '5v5', 'Panjim Sports Complex', now() + interval '3 days', 10, 'upcoming'),
  ('Futsal', '5v5', 'Mapusa Indoor Arena', now() + interval '5 days', 10, 'upcoming'),

  -- Football matches
  ('Football', '7v7', 'Duler Stadium, Mapusa', now() + interval '1 day', 14, 'upcoming'),
  ('Football', '11v11', 'Bambolim Athletic Ground', now() + interval '4 days', 22, 'upcoming'),
  ('Football', '7v7', 'Fatorda Sports Hub', now() + interval '6 days', 14, 'upcoming'),

  -- Cricket matches
  ('Cricket', '6v6', 'Miramar Cricket Oval', now() + interval '2 days', 12, 'upcoming'),
  ('Cricket', '11v11', 'Porvorim Cricket Ground', now() + interval '3 days', 22, 'upcoming'),

  -- Volleyball
  ('Volleyball', '6v6', 'Anjuna Beach Court', now() + interval '1 day', 12, 'upcoming'),
  ('Volleyball', '6v6', 'Baga Sports Zone', now() + interval '4 days', 12, 'upcoming'),

  -- Kabaddi
  ('Kabaddi', '7v7', 'Margao Municipal Ground', now() + interval '5 days', 14, 'upcoming'),

  -- Completed match (for testing post-match features)
  ('Futsal', '5v5', 'Vasco Sports Arena', now() - interval '1 day', 10, 'completed');
