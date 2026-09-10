-- RUN ONCE against the existing database.
--
-- Closes the hole where the public anon key had full write access to the
-- events table. Safe to run on live data: it adds no columns and changes no
-- rows, and the bot writes with the service role key, which bypasses RLS.
--
-- After running, the site keeps working exactly as before (it only reads
-- published events) and the public key can no longer insert, update or
-- delete anything.

alter table public.events enable row level security;

drop policy if exists "public can read published events" on public.events;
create policy "public can read published events"
  on public.events
  for select
  to anon, authenticated
  using (status = 'published');

-- Optional, and worth it before the table grows.
create index if not exists events_status_start_idx
  on public.events (status, start_datetime_utc);

create index if not exists events_city_idx
  on public.events (city)
  where status = 'published';


-- Check it took effect:
--
--   select relrowsecurity from pg_class where oid = 'public.events'::regclass;
--   -- expect: true
--
--   select policyname, cmd from pg_policies
--    where schemaname = 'public' and tablename = 'events';
--   -- expect: one row, "public can read published events" / SELECT
