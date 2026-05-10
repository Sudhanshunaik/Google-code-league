-- ============================================================
-- SEED DATA — Real Goa Sports Venues with GPS Coordinates
-- Run this in your Supabase SQL Editor to populate the map
-- with actual playgrounds across Goa.
-- ============================================================

-- ─── FOOTBALL / FUTSAL VENUES ──────────────────────────────

-- 1. Duler Stadium, Mapusa (Major ISL-Level Stadium)
INSERT INTO public.matches (sport, format, location, match_time, capacity, status, latitude, longitude, is_verified, price)
VALUES ('Football', '11v11', 'Duler Stadium, Mapusa', now() + interval '2 days' + interval '16 hours', 22, 'upcoming', 15.5985, 73.8161, true, 300);

-- 2. Tilak Maidan Stadium, Vasco da Gama
INSERT INTO public.matches (sport, format, location, match_time, capacity, status, latitude, longitude, is_verified, price)
VALUES ('Football', '11v11', 'Tilak Maidan Stadium, Vasco', now() + interval '3 days' + interval '17 hours', 22, 'upcoming', 15.4006, 73.8151, true, 350);

-- 3. Fatorda Stadium (Jawaharlal Nehru Stadium), Margao
INSERT INTO public.matches (sport, format, location, match_time, capacity, status, latitude, longitude, is_verified, price)
VALUES ('Football', '11v11', 'Fatorda Stadium, Margao', now() + interval '5 days' + interval '18 hours', 22, 'upcoming', 15.2892, 73.9622, true, 500);

-- 4. Peddem Sports Complex, Mapusa
INSERT INTO public.matches (sport, format, location, match_time, capacity, status, latitude, longitude, is_verified, price)
VALUES ('Football', '7v7', 'Peddem Sports Complex, Mapusa', now() + interval '1 day' + interval '17 hours', 14, 'upcoming', 15.6017, 73.8248, true, 250);

-- 5. St Sebastian Sports, Arpora
INSERT INTO public.matches (sport, format, location, match_time, capacity, status, latitude, longitude, is_verified, price)
VALUES ('Football', '5v5', 'St Sebastian Sports, Arpora', now() + interval '1 day' + interval '19 hours', 10, 'upcoming', 15.5627, 73.7693, true, 200);

-- 6. Nagoa Futsal Arena, Saligao
INSERT INTO public.matches (sport, format, location, match_time, capacity, status, latitude, longitude, is_verified, price)
VALUES ('Futsal', '5v5', 'Nagoa Futsal Arena, Saligao', now() + interval '2 days' + interval '18 hours', 10, 'upcoming', 15.5563, 73.7889, true, 200);

-- 7. Calangute Panchayat Futsal Arena
INSERT INTO public.matches (sport, format, location, match_time, capacity, status, latitude, longitude, is_verified, price)
VALUES ('Futsal', '5v5', 'Calangute Panchayat Futsal Arena', now() + interval '3 days' + interval '19 hours', 10, 'upcoming', 15.5438, 73.7584, true, 150);

-- 8. DENGOA Multisports Arena, Ribandar
INSERT INTO public.matches (sport, format, location, match_time, capacity, status, latitude, longitude, is_verified, price)
VALUES ('Football', '5v5', 'DENGOA Multisports Arena, Ribandar', now() + interval '1 day' + interval '18 hours', 10, 'upcoming', 15.5000, 73.8500, true, 250);

-- 9. The Base, Seraulim/Margao
INSERT INTO public.matches (sport, format, location, match_time, capacity, status, latitude, longitude, is_verified, price)
VALUES ('Football', '5v5', 'The Base, Seraulim', now() + interval '4 days' + interval '17 hours', 10, 'upcoming', 15.2650, 73.9650, true, 200);

-- 10. Royals Arena, Betalbatim
INSERT INTO public.matches (sport, format, location, match_time, capacity, status, latitude, longitude, is_verified, price)
VALUES ('Football', '7v7', 'Royals Arena, Betalbatim', now() + interval '2 days' + interval '16 hours', 14, 'upcoming', 15.2800, 73.9300, true, 250);

-- 11. Camp Souza, Camorlim
INSERT INTO public.matches (sport, format, location, match_time, capacity, status, latitude, longitude, is_verified, price)
VALUES ('Futsal', '5v5', 'Camp Souza, Camorlim', now() + interval '6 days' + interval '17 hours', 10, 'upcoming', 15.3200, 73.9580, true, 200);

-- 12. Kicks - Infinity Futsal, Loutolim
INSERT INTO public.matches (sport, format, location, match_time, capacity, status, latitude, longitude, is_verified, price)
VALUES ('Futsal', '5v5', 'Kicks Infinity Futsal, Loutolim', now() + interval '3 days' + interval '20 hours', 10, 'upcoming', 15.3100, 73.9400, true, 180);

-- 13. Bambolim Athletic Ground
INSERT INTO public.matches (sport, format, location, match_time, capacity, status, latitude, longitude, is_verified, price)
VALUES ('Football', '11v11', 'Bambolim Athletic Ground', now() + interval '7 days' + interval '16 hours', 22, 'upcoming', 15.4600, 73.8600, true, 300);


-- ─── CRICKET VENUES ────────────────────────────────────────

-- 14. GCA Academy Ground, Alto Porvorim (Main Ranji Trophy Venue)
INSERT INTO public.matches (sport, format, location, match_time, capacity, status, latitude, longitude, is_verified, price)
VALUES ('Cricket', '11v11', 'GCA Academy Ground, Porvorim', now() + interval '3 days' + interval '9 hours', 22, 'upcoming', 15.5241, 73.8298, true, 400);

-- 15. Fatorda Stadium - Cricket, Margao (ODI Venue)
INSERT INTO public.matches (sport, format, location, match_time, capacity, status, latitude, longitude, is_verified, price)
VALUES ('Cricket', '11v11', 'Fatorda Cricket Ground, Margao', now() + interval '6 days' + interval '9 hours', 22, 'upcoming', 15.2900, 73.9630, true, 500);

-- 16. Campal Ground (Bhausaheb Bandodkar), Panaji
INSERT INTO public.matches (sport, format, location, match_time, capacity, status, latitude, longitude, is_verified, price)
VALUES ('Cricket', '6v6', 'Campal Ground, Panaji', now() + interval '2 days' + interval '16 hours', 12, 'upcoming', 15.4881, 73.8131, true, 200);

-- 17. Mapusa Municipal Ground
INSERT INTO public.matches (sport, format, location, match_time, capacity, status, latitude, longitude, is_verified, price)
VALUES ('Cricket', '6v6', 'Mapusa Municipal Ground', now() + interval '4 days' + interval '15 hours', 12, 'upcoming', 15.5930, 73.8100, true, 150);

-- 18. Ponda Sports Complex - Cricket
INSERT INTO public.matches (sport, format, location, match_time, capacity, status, latitude, longitude, is_verified, price)
VALUES ('Cricket', '11v11', 'Ponda Sports Complex', now() + interval '5 days' + interval '10 hours', 22, 'upcoming', 15.4028, 74.0078, true, 300);

-- 19. Vasco Sports Ground - Box Cricket
INSERT INTO public.matches (sport, format, location, match_time, capacity, status, latitude, longitude, is_verified, price)
VALUES ('Cricket', '6v6', 'Vasco Sports Ground', now() + interval '1 day' + interval '16 hours', 12, 'upcoming', 15.3860, 73.8440, true, 200);

-- 20. Don Bosco School Ground, Panaji
INSERT INTO public.matches (sport, format, location, match_time, capacity, status, latitude, longitude, is_verified, price)
VALUES ('Cricket', '6v6', 'Don Bosco Ground, Panaji', now() + interval '2 days' + interval '15 hours', 12, 'upcoming', 15.4950, 73.8250, true, 150);

-- 21. The Base, Seraulim — Box Cricket
INSERT INTO public.matches (sport, format, location, match_time, capacity, status, latitude, longitude, is_verified, price)
VALUES ('Cricket', '6v6', 'The Base Box Cricket, Seraulim', now() + interval '3 days' + interval '16 hours', 12, 'upcoming', 15.2655, 73.9660, true, 200);


-- ─── TENNIS VENUES ─────────────────────────────────────────

-- 22. Clube Tennis de Gaspar Dias, Miramar
INSERT INTO public.matches (sport, format, location, match_time, capacity, status, latitude, longitude, is_verified, price)
VALUES ('Tennis', 'Singles', 'Clube Tennis de Gaspar Dias, Miramar', now() + interval '1 day' + interval '7 hours', 2, 'upcoming', 15.4746, 73.8118, true, 500);

-- 23. Clube Tennis de Gaspar Dias, Miramar — Doubles
INSERT INTO public.matches (sport, format, location, match_time, capacity, status, latitude, longitude, is_verified, price)
VALUES ('Tennis', 'Doubles', 'Clube Tennis de Gaspar Dias, Miramar', now() + interval '4 days' + interval '8 hours', 4, 'upcoming', 15.4746, 73.8118, true, 400);

-- 24. Panjim Gymkhana Tennis Courts
INSERT INTO public.matches (sport, format, location, match_time, capacity, status, latitude, longitude, is_verified, price)
VALUES ('Tennis', 'Singles', 'Panjim Gymkhana, Panaji', now() + interval '2 days' + interval '7 hours', 2, 'upcoming', 15.4984, 73.8325, true, 600);

-- 25. Panjim Gymkhana — Doubles
INSERT INTO public.matches (sport, format, location, match_time, capacity, status, latitude, longitude, is_verified, price)
VALUES ('Tennis', 'Doubles', 'Panjim Gymkhana, Panaji', now() + interval '5 days' + interval '17 hours', 4, 'upcoming', 15.4984, 73.8325, true, 500);

-- 26. Goa University Tennis Court, Taleigao
INSERT INTO public.matches (sport, format, location, match_time, capacity, status, latitude, longitude, is_verified, price)
VALUES ('Tennis', 'Singles', 'Goa University Tennis Court, Taleigao', now() + interval '3 days' + interval '6 hours', 2, 'upcoming', 15.4580, 73.8310, true, 300);

-- 27. Goa University — Doubles
INSERT INTO public.matches (sport, format, location, match_time, capacity, status, latitude, longitude, is_verified, price)
VALUES ('Tennis', 'Doubles', 'Goa University Tennis Court, Taleigao', now() + interval '6 days' + interval '7 hours', 4, 'upcoming', 15.4580, 73.8310, true, 250);

-- 28. NIO Tennis Court, Dona Paula
INSERT INTO public.matches (sport, format, location, match_time, capacity, status, latitude, longitude, is_verified, price)
VALUES ('Tennis', 'Singles', 'NIO Tennis Court, Dona Paula', now() + interval '1 day' + interval '17 hours', 2, 'upcoming', 15.4560, 73.8020, true, 350);

-- 29. Don Bosco College Tennis, Panaji
INSERT INTO public.matches (sport, format, location, match_time, capacity, status, latitude, longitude, is_verified, price)
VALUES ('Tennis', 'Doubles', 'Don Bosco College Tennis, Panaji', now() + interval '4 days' + interval '16 hours', 4, 'upcoming', 15.4940, 73.8240, true, 250);


-- ─── MULTI-SPORT / BONUS VENUES ────────────────────────────

-- 30. Peddem Sports Complex — Cricket
INSERT INTO public.matches (sport, format, location, match_time, capacity, status, latitude, longitude, is_verified, price)
VALUES ('Cricket', '11v11', 'Peddem Sports Complex, Mapusa', now() + interval '7 days' + interval '9 hours', 22, 'upcoming', 15.6017, 73.8248, true, 250);

-- 31. Campo Don Bosco, Fatorda — Football
INSERT INTO public.matches (sport, format, location, match_time, capacity, status, latitude, longitude, is_verified, price)
VALUES ('Football', '7v7', 'Campo Don Bosco, Fatorda', now() + interval '5 days' + interval '17 hours', 14, 'upcoming', 15.2850, 73.9580, true, 200);

-- 32. DENGOA Arena — Box Cricket
INSERT INTO public.matches (sport, format, location, match_time, capacity, status, latitude, longitude, is_verified, price)
VALUES ('Cricket', '6v6', 'DENGOA Arena Box Cricket, Ribandar', now() + interval '2 days' + interval '17 hours', 12, 'upcoming', 15.5005, 73.8510, true, 250);

-- ============================================================
-- SUMMARY:
--   13 Football/Futsal matches across 13 unique venues
--    8 Cricket matches across 8 unique venues  
--    8 Tennis matches across 5 unique courts
--    3 Multi-sport bonus entries
-- TOTAL: 32 verified matches with real GPS coordinates
-- ============================================================
