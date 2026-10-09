-- Run once in the Supabase SQL editor.
--
-- The website inserts into this table through its own API route using the
-- anon key. RLS therefore allows INSERT and nothing else: nobody holding the
-- public key can read, update or delete the list. Read it yourself from the
-- Supabase dashboard or with the service role key.

create table if not exists public.subscribers (
  id              uuid primary key default gen_random_uuid(),
  email           text        not null,
  city            text,
  source          text        not null default 'site',

  -- Ready for double opt-in the moment there is a way to send email.
  -- Until then rows arrive unconfirmed and you treat them as single opt-in.
  confirmed       boolean     not null default false,
  confirm_token   uuid        not null default gen_random_uuid(),
  confirmed_at    timestamptz,

  unsubscribed_at timestamptz,
  created_at      timestamptz not null default now()
);

-- One row per address, case-insensitively. The API route relies on this
-- raising 23505 rather than creating duplicates.
create unique index if not exists subscribers_email_unique
  on public.subscribers (lower(email));

create index if not exists subscribers_city_idx
  on public.subscribers (city)
  where unsubscribed_at is null;

alter table public.subscribers enable row level security;

-- Insert only. No select policy exists, so the list is not readable with the
-- public key even though that key ships in the browser bundle.
--
-- The public key can be used to call Supabase directly, skipping the site's
-- route and its checks, so the database enforces them itself (Oct 2026):
-- the public may set ONLY email, city and source, every other column keeps
-- its default (so nobody can insert a row already "confirmed", or choose
-- its confirm_token), and the values must look like what the form sends.
-- Safe to re-run.
revoke insert on public.subscribers from anon, authenticated;
grant insert (email, city, source) on public.subscribers to anon, authenticated;

drop policy if exists "public can subscribe" on public.subscribers;
create policy "public can subscribe"
  on public.subscribers
  for insert
  to anon, authenticated
  with check (
    char_length(email) between 6 and 254
    and email = lower(email)
    and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$'
    and (city is null or char_length(city) <= 80)
    and char_length(source) <= 60
  );


-- Handy for later: the current mailing list.
-- select email, city, created_at
--   from public.subscribers
--  where unsubscribed_at is null
--  order by created_at desc;
