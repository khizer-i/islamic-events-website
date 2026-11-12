-- Run once in the Supabase SQL editor (Nov 2026), after subscribers.sql.
-- Safe to re-run.
--
-- The weekly email (app/api/cron/weekly-email) reads and updates this table
-- with the service role key, which bypasses RLS; the public key still can
-- only insert. confirm_token doubles as each subscriber's private
-- unsubscribe token: it is random, unique and never shown to anyone else.

-- When this address was last sent the weekly email. Vercel can run a cron
-- twice, so the send skips anyone emailed in the last five days.
alter table public.subscribers
  add column if not exists last_emailed_at timestamptz;

create unique index if not exists subscribers_confirm_token_unique
  on public.subscribers (confirm_token);
