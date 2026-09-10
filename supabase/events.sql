-- The `events` table as it actually exists, introspected 2026-09-10.
--
-- This is the reproducible definition: running it against an empty project
-- gives you the table the bot writes to and the site reads from. Keep it in
-- step with reality — the previous hand-kept copy had already drifted (it was
-- missing poster_url, which was added later by ALTER).
--
-- Written by: the private bot, using the SERVICE ROLE key.
-- Read by:    the website, using the anon key, which is public.

create table if not exists public.events (
  id                 uuid        primary key default gen_random_uuid(),
  created_at         timestamptz not null default now(),

  title              text,
  organiser          text,

  start_datetime_utc timestamptz,
  end_datetime_utc   timestamptz,

  venue_name         text,
  city               text,

  tags               text[],
  confidence         numeric,
  notes              text,

  source_caption     text,
  source_ocr         text,
  poster_url         text,

  status             text        not null default 'published'
);

-- The only index was the primary key. These match how the site actually
-- queries: published rows ordered by start date, and per-city listings.
create index if not exists events_status_start_idx
  on public.events (status, start_datetime_utc);

create index if not exists events_city_idx
  on public.events (city)
  where status = 'published';

-- ------------------------------------------------------------------
-- Security
--
-- Without RLS, the anon key grants full read AND write on this table —
-- and that key ships inside the website's browser bundle, so it is public
-- by design. RLS is what makes publishing it safe.
--
-- The bot is unaffected: the service role key bypasses RLS entirely.
-- ------------------------------------------------------------------

alter table public.events enable row level security;

-- Read-only, and only published rows. Drafts and cancelled events stay
-- invisible to the public key even if the site forgets to filter.
drop policy if exists "public can read published events" on public.events;
create policy "public can read published events"
  on public.events
  for select
  to anon, authenticated
  using (status = 'published');

-- Deliberately no insert, update or delete policy. Writes are the bot's
-- job, and it holds the service role key.
