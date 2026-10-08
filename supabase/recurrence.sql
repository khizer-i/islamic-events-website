-- RUN ONCE in the Supabase SQL editor, BEFORE deploying the bot change that
-- saves repeating events (Oct 2026). Safe on live data: it only adds columns,
-- all of them empty or false, and changes no existing rows.
--
-- One poster stays one row. These columns say how that row repeats; the
-- website works out the individual dates from them.

alter table public.events
  -- iCalendar RRULE without DTSTART, e.g. FREQ=WEEKLY;BYDAY=WE;UNTIL=20270728T235959
  -- The first session is start_datetime_utc. Null means a one-off.
  add column if not exists recurrence_rule text,

  -- How the poster words it, e.g. 'Weekly classes, Wednesdays'. Display only.
  add column if not exists recurrence_text text,

  -- True when the poster gave no end. The rule then runs 12 weeks and the bot
  -- asks the moderator before it lapses whether the class is still running.
  add column if not exists recurrence_open boolean not null default false,

  -- The UNTIL date the moderator has already been asked about, so the
  -- check-in is sent once per extension, not daily.
  add column if not exists recurrence_checked_until date;

-- The public read policy already covers these: it limits rows, not columns.

-- Check it took effect:
--   select column_name, data_type from information_schema.columns
--    where table_schema = 'public' and table_name = 'events'
--      and column_name like 'recurrence%';
--   -- expect four rows
