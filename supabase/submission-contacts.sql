-- Run once in the Supabase SQL editor (Nov 2026). Safe to re-run.
--
-- The optional "Email me when it's live" address from the submission form.
-- It is NOT a column on events: the site reads events with the public key,
-- so anything on that table is public. This table has RLS switched on and no
-- policies at all, so the public key can neither read nor write it; only the
-- bot, with the service role key, can.
--
-- The bot deletes a row as soon as it has been used: after the "your event
-- is live" email goes out on Publish, or straight away on Reject.

create table if not exists public.submission_contacts (
  event_id   uuid        primary key references public.events (id) on delete cascade,
  email      text        not null check (char_length(email) between 6 and 254),
  created_at timestamptz not null default now()
);

alter table public.submission_contacts enable row level security;

revoke all on public.submission_contacts from anon, authenticated;
