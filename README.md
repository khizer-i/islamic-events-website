# UK Islamic Events Calendar (Web)

This is the **public website** for the UK Islamic Events Calendar.

It displays Islamic events across the UK in a modern calendar interface, powered by Supabase and updated automatically by a private backend bot.

> This repo contains **only** the frontend (Next.js) code and uses the Supabase **anon** key.  
> The private bot/backend lives in a separate private repo.

---

## Features

- Month / Week / List calendar views
- Dual date display:
  - Gregorian dates
  - Hijri dates (transliterated), shown subtly in each day cell and in the "Today" line
- Clickable events with a **poster modal**:
  - Poster image
  - Caption (if present)
  - Venue, city, organiser, tags, notes
- Filters:
  - Filter by city
  - Filter by tags (multi-select)
  - Reset filters button
- Dark mode / light mode:
  - Follows the user’s system preference
- UK conventions:
  - Week starts on **Monday**
  - Dates in `dd/mm` style in week/list views
- “Support this project” button in the header

---

## Tech stack

- **Framework**: Next.js (App Router, TypeScript)
- **UI**: React, Tailwind CSS
- **Calendar**: FullCalendar (dayGrid, timeGrid, list)
- **Data**: Supabase (PostgreSQL)
- **Hijri dates**: `moment-hijri`

The backend that:
- receives the event information,
- runs OCR and AI extraction
- writes to Supabase

is not part of this repo.

---

## Requirements

- Node.js 18+
- npm / pnpm / yarn
- A Supabase project with:
  - `events` table (readable by anon key)
  - `event-posters` public storage bucket

---

## Environment variables

Create a `.env.local` file in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL= https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY= <your-anon-key>

Notes:
- These are public keys intended for frontend usage.
- Do not put the Supabase service role key here.
```

## Running locally

Install dependencies:
```bash
npm install
```

Start the dev server:
```bash
npm run dev
```
Then open:
```bash
http://localhost:3000
```
## License
All rights reserved.
