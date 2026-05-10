-- ============================================================
-- SEED DATA — Major Official Tournaments & Leagues in Goa
-- Run this in your Supabase SQL Editor to populate the map
-- with prestigious tournaments across Goa.
-- ============================================================

-- ─── FOOTBALL ──────────────────────────────────────────────

-- 1. Goa Professional League (GPL)
INSERT INTO public.matches (sport, format, location, match_time, capacity, status, latitude, longitude, is_verified, price)
VALUES ('Football', '11v11', 'Duler Stadium, Mapusa (GPL)', now() + interval '8 days' + interval '16 hours', 22, 'upcoming', 15.5985, 73.8161, true, 500);

-- 2. Super Cup
INSERT INTO public.matches (sport, format, location, match_time, capacity, status, latitude, longitude, is_verified, price)
VALUES ('Football', '11v11', 'Fatorda Stadium (Super Cup)', now() + interval '12 days' + interval '19 hours', 22, 'upcoming', 15.2892, 73.9622, true, 1000);

-- 3. Vedanta Women's League
INSERT INTO public.matches (sport, format, location, match_time, capacity, status, latitude, longitude, is_verified, price)
VALUES ('Football', '7v7', 'Nagoa Futsal Arena (Women''s League)', now() + interval '5 days' + interval '17 hours', 14, 'upcoming', 15.5563, 73.7889, true, 300);


-- ─── CRICKET ───────────────────────────────────────────────

-- 4. Goa Premier League (GPL - Cricket) Final
INSERT INTO public.matches (sport, format, location, match_time, capacity, status, latitude, longitude, is_verified, price)
VALUES ('Cricket', '11v11', 'GCA Academy Ground (GPL Final)', now() + interval '14 days' + interval '10 hours', 22, 'upcoming', 15.5241, 73.8298, true, 800);

-- 5. A Division North Zone
INSERT INTO public.matches (sport, format, location, match_time, capacity, status, latitude, longitude, is_verified, price)
VALUES ('Cricket', '11v11', 'Mapusa Municipal Ground (A Division)', now() + interval '9 days' + interval '11 hours', 22, 'upcoming', 15.5930, 73.8100, true, 400);


-- ─── TENNIS ────────────────────────────────────────────────

-- 6. Gadre Gaspar Dias Open (Major State Tournament)
INSERT INTO public.matches (sport, format, location, match_time, capacity, status, latitude, longitude, is_verified, price)
VALUES ('Tennis', 'Singles', 'Clube Tennis de Gaspar Dias (Open)', now() + interval '20 days' + interval '8 hours', 2, 'upcoming', 15.4746, 73.8118, true, 1500);

-- 7. Sportz Goa Singles League
INSERT INTO public.matches (sport, format, location, match_time, capacity, status, latitude, longitude, is_verified, price)
VALUES ('Tennis', 'Singles', 'Panjim Gymkhana (Sportz Goa League)', now() + interval '6 days' + interval '16 hours', 2, 'upcoming', 15.4984, 73.8325, true, 600);


-- ─── BASKETBALL ────────────────────────────────────────────

-- 8. All Goa Basketball League (Youth Hostel)
INSERT INTO public.matches (sport, format, location, match_time, capacity, status, latitude, longitude, is_verified, price)
VALUES ('Basketball', '5v5', 'Youth Hostel Miramar (All Goa League)', now() + interval '15 days' + interval '17 hours', 10, 'upcoming', 15.4767, 73.8067, true, 400);

-- 9. Goa University Inter-Collegiate Basketball
INSERT INTO public.matches (sport, format, location, match_time, capacity, status, latitude, longitude, is_verified, price)
VALUES ('Basketball', '5v5', 'Goa University (Inter-Collegiate)', now() + interval '18 days' + interval '15 hours', 10, 'upcoming', 15.4580, 73.8310, true, 0);

-- 10. Bosco Cup (U16 Championship)
INSERT INTO public.matches (sport, format, location, match_time, capacity, status, latitude, longitude, is_verified, price)
VALUES ('Basketball', '5v5', 'Don Bosco Fatorda (Bosco Cup)', now() + interval '25 days' + interval '10 hours', 10, 'upcoming', 15.2850, 73.9580, true, 200);


-- ─── VOLLEYBALL ────────────────────────────────────────────

-- 11. Prime Volleyball League (Goa Guardians Host)
INSERT INTO public.matches (sport, format, location, match_time, capacity, status, latitude, longitude, is_verified, price)
VALUES ('Volleyball', '6v6', 'Bambolim Athletic Ground (Prime Volley)', now() + interval '11 days' + interval '18 hours', 12, 'upcoming', 15.4600, 73.8600, true, 600);

-- 12. Goa University Inter-Collegiate Volleyball
INSERT INTO public.matches (sport, format, location, match_time, capacity, status, latitude, longitude, is_verified, price)
VALUES ('Volleyball', '6v6', 'Goa University (Volleyball Championship)', now() + interval '19 days' + interval '14 hours', 12, 'upcoming', 15.4580, 73.8310, true, 0);

-- ============================================================
-- SUMMARY: Added 12 massive tournaments including Basketball and Volleyball!
-- ============================================================
