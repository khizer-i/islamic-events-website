-- One-off tidy of the `city` column (Oct 2026). Run in the Supabase SQL
-- editor. Safe to re-run: it only changes rows that still need it.
--
-- Neighbourhoods were saved as cities ("Seven Kings", "Old Trafford") and
-- some cities in capitals ("BRADFORD"), each making its own near-empty page
-- on /cities. The bot now fixes these as it saves (places.py in the bot
-- repo); this brings the existing rows into line with it.

-- 1. See what is there first.
select city, count(*) as events
  from public.events
 group by city
 order by lower(city);

-- 2. Neighbourhoods to their town. Keep in step with NEIGHBOURHOODS in the
--    bot's places.py.
update public.events set city = 'Ilford'
 where lower(trim(city)) in ('goodmayes', 'seven kings', 'gants hill',
                             'newbury park', 'barkingside');

update public.events set city = 'Manchester'
 where lower(trim(city)) in ('old trafford', 'rusholme', 'longsight',
                             'levenshulme', 'cheetham hill', 'moss side',
                             'whalley range');

update public.events set city = 'Birmingham'
 where lower(trim(city)) in ('sparkbrook', 'sparkhill', 'small heath',
                             'alum rock', 'saltley', 'bordesley green',
                             'balsall heath', 'washwood heath');

update public.events set city = 'Ashton-under-Lyne'
 where lower(trim(city)) in ('ashton under lyne', 'ashton-under-lyne')
   and city <> 'Ashton-under-Lyne';

-- 3. Capitals ("BRADFORD") to normal case. initcap gives "Stoke-On-Trent"
--    for hyphenated names, so check step 4's output for any of those.
update public.events set city = initcap(city)
 where city = upper(city) and city <> lower(city);

-- 4. Check again: each town should now appear once.
select city, count(*) as events
  from public.events
 group by city
 order by lower(city);
