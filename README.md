# UK Islamic Events Calendar (Web)

This is the **public website** for the UK Islamic Events Calendar, islamiceventscalendar.co.uk.

It lists Islamic events across the UK, read from community posters by a private backend bot and approved by a person before they appear. Deployed on Vercel.

> This repo contains **only** the website (Next.js). It reads events with the Supabase **anon** key, which row-level security limits to published events.
> The bot, which writes events and handles moderation in Telegram, lives in a separate private repo.

---

## What is on the site

- **Calendar (home page):** the next six weeks, as a month grid on desktop and a compact grid with the chosen day's events on a phone. A list view is one tap away. Filter by city and by category.
- **Event pages** (`/events/<title>-<id>`): poster, times in UK time, Hijri date, venue, "Add to Google Calendar", share buttons, and Google Event structured data. A timed event with no end printed shows an estimated two-hour end, labelled as estimated.
- **Repeating events:** a weekly class or course is one listing. It appears once in lists at its next session, on every date it runs in the calendar, and its page lists the coming dates.
- **Upcoming list** (`/events`), **cities** (`/cities`, `/cities/<city>`), **support** (`/support`), sitemap and robots.
- **Add your event** (`/submit`): upload a poster, check the details the bot read from it (including how it repeats), and send it in for review. Protected by Cloudflare Turnstile.
- **Mailing list sign-up** (`/api/subscribe`) into the `subscribers` table.
- **Share cards:** generated images for the site and for every event.
- Light and dark themes follow the visitor's system setting. Weeks start on Monday, dates are UK style.

Hijri dates come from a hand-kept table of UK moon-sighting announcements in `src/lib/hijri.ts`. **Add a row at the start of every Hijri month**; past the end of the table the site falls back to a calculated estimate.

---

## Tech stack

- **Framework:** Next.js 16 (App Router, Turbopack, React compiler), TypeScript
- **UI:** React 19, Tailwind CSS 4
- **Data:** Supabase (PostgreSQL + Storage), read at build time and refreshed with ISR every 10 to 60 minutes
- **Hosting:** Vercel, with a daily cron (`vercel.json`)
- **Analytics:** Google Analytics 4 and Vercel Analytics

---

## Requirements

- Node.js 20.9 or later
- npm
- A Supabase project with the tables in `supabase/` (see below) and a public `event-posters` storage bucket

---

## Environment variables

Set these in Vercel, and in `.env.local` for local development (never committed):

| Variable | Required | What it is |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Public by design |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Public by design. Never put the service role key here |
| `NEXT_PUBLIC_SITE_URL` | no | Defaults to `https://www.islamiceventscalendar.co.uk` |
| `BOT_API_URL` | for submissions | The bot's base URL on Render |
| `BOT_API_SECRET` | for submissions | Shared with the bot, where it is `WEB_API_SECRET` |
| `TURNSTILE_SITE_KEY` | in production | Cloudflare Turnstile. Deliberately not `NEXT_PUBLIC_`: the server passes it to the form |
| `TURNSTILE_SECRET_KEY` | in production | Cloudflare Turnstile |
| `CRON_SECRET` | in production | Vercel sends it to `/api/cron/series-check` |

Without the Turnstile keys, submissions work locally but are switched off in production.

---

## Database

The files in `supabase/` are run by hand in the Supabase SQL editor; each says at the top when and whether to run it.

- `events.sql`: the `events` table as it exists, with its indexes and row-level security
- `enable-events-rls.sql`: the read-only, published-only policy on its own
- `recurrence.sql`: the repeating-event columns (already applied)
- `city-names.sql`: a one-off tidy of neighbourhood and capitalised city names (the bot keeps new ones tidy)
- `subscribers.sql`: the mailing list table. The public key may only insert an email, city and source. Safe to re-run

---

## Running locally

Install dependencies:
```bash
npm install
```

Start the dev server:
```bash
npm run dev
```
Then open http://localhost:3000.

Before pushing:
```bash
npx tsc --noEmit
npm run lint
npm test
```

`npm test` checks the site's repeat-date code against dates produced by the bot's (`scripts/recurrence-golden.json`). If the two ever disagree, the bot's Telegram draft and the site would describe different dates.

---

## Cron

`vercel.json` runs `/api/cron/series-check` daily at 08:00 UTC. It asks the bot to message the moderator about repeating events, listed with no end date, that are about to drop off the site.

---

## License
All rights reserved.
