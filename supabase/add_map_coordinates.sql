-- 1. Add coordinates columns
alter table public.matches 
add column if not exists latitude double precision,
add column if not exists longitude double precision;

-- 2. Ensure all seeded matches are verified so they show on the map
update public.matches set is_verified = true;

-- 3. Add coordinates to existing venues in Goa
update public.matches set latitude = 15.5494, longitude = 73.7538 where location = 'Calangute Beach Turf';
update public.matches set latitude = 15.4909, longitude = 73.8278 where location = 'Panjim Sports Complex';
update public.matches set latitude = 15.5937, longitude = 73.8105 where location = 'Mapusa Indoor Arena';
update public.matches set latitude = 15.6027, longitude = 73.8143 where location = 'Duler Stadium, Mapusa';
update public.matches set latitude = 15.4526, longitude = 73.8519 where location = 'Bambolim Athletic Ground';
update public.matches set latitude = 15.2891, longitude = 73.9620 where location = 'Fatorda Sports Hub';
update public.matches set latitude = 15.4851, longitude = 73.8115 where location = 'Miramar Cricket Oval';
update public.matches set latitude = 15.5262, longitude = 73.8173 where location = 'Porvorim Cricket Ground';
update public.matches set latitude = 15.5866, longitude = 73.7431 where location = 'Anjuna Beach Court';
update public.matches set latitude = 15.5553, longitude = 73.7517 where location = 'Baga Sports Zone';
update public.matches set latitude = 15.2832, longitude = 73.9649 where location = 'Margao Municipal Ground';
update public.matches set latitude = 15.3981, longitude = 73.8114 where location = 'Vasco Sports Arena';

-- 4. Just in case any are missed, give them a default Goa center coordinate
update public.matches set latitude = 15.2993, longitude = 74.1240 where latitude is null;
