import Link from "next/link";
import type { EventInput } from "@fullcalendar/core";

import CalendarWithModal from "@/components/CalendarWithModal";
import EventCard from "@/components/EventCard";
import { JsonLd, eventListJsonLd, websiteJsonLd } from "@/lib/structured-data";
import {
  cityUrl,
  eventSlug,
  getAllEvents,
  getCitySummaries,
  getUpcomingEvents,
} from "@/lib/events";

export const revalidate = 600;

export default async function HomePage() {
  const rows = await getAllEvents();
  const upcoming = await getUpcomingEvents();
  const citySummaries = await getCitySummaries();

  const events: EventInput[] = rows.map((ev) => ({
    id: ev.id,
    title: ev.title ?? "Untitled event",
    // FullCalendar expects DateInput | undefined, not null
    start: ev.start_datetime_utc ?? undefined,
    end: ev.end_datetime_utc ?? undefined,
    extendedProps: {
      city: ev.city,
      venue_name: ev.venue_name,
      organiser: ev.organiser,
      tags: ev.tags,
      notes: ev.notes,
      poster_url: ev.poster_url,
      caption: ev.source_caption,
      slug: eventSlug(ev),
    },
  }));

  const cities = Array.from(
    new Set(rows.map((ev) => ev.city).filter((c): c is string => Boolean(c)))
  ).sort();

  const tags = Array.from(
    new Set(
      rows.flatMap((ev) => (ev.tags && ev.tags.length > 0 ? ev.tags : []))
    )
  ).sort();

  const nextUp = upcoming.slice(0, 8);
  const activeCities = citySummaries.filter((c) => c.upcoming > 0);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-4 text-slate-900 dark:bg-slate-950 dark:text-slate-50 md:px-6 md:py-6">
      <JsonLd
        data={[
          websiteJsonLd(),
          eventListJsonLd(nextUp, "Upcoming Islamic events in the UK"),
        ]}
      />

      {/* HEADER */}
      <header className="mb-4 md:mb-6">
        <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/90 md:px-5 md:py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-lg font-semibold md:text-xl">
                UK Islamic Events Calendar
              </h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                A curated view of Islamic events across the UK, extracted
                automatically from community posters.
              </p>
            </div>

            <div className="flex flex-col items-start gap-1 md:items-end">
              <div className="flex items-center gap-2">
                <Link
                  href="/events"
                  className="inline-flex items-center rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-indigo-400 hover:text-indigo-700 md:text-sm dark:border-slate-700 dark:text-slate-200 dark:hover:text-indigo-300"
                >
                  Upcoming list
                </Link>
                <a
                  href="/support"
                  className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-indigo-700 md:px-3.5 md:py-1.5 md:text-sm dark:bg-indigo-400 dark:text-slate-900 dark:hover:bg-indigo-300"
                >
                  <span className="mr-1 text-indigo-100 dark:text-indigo-900">
                    ♥
                  </span>
                  <span>Support this project</span>
                </a>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Built &amp; maintained as a community service.
              </span>
            </div>
          </div>
        </div>
      </header>

      <CalendarWithModal events={events} cities={cities} tags={tags} />

      {/*
        Server-rendered content below the calendar. FullCalendar renders on the
        client, so without this a crawler sees an empty page.
      */}
      {nextUp.length > 0 ? (
        <section className="mt-8">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold">Next up across the UK</h2>
            <Link
              href="/events"
              className="text-xs font-medium text-indigo-700 hover:underline dark:text-indigo-300"
            >
              See all {upcoming.length} upcoming →
            </Link>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {nextUp.map((ev) => (
              <EventCard key={ev.id} event={ev} />
            ))}
          </ul>
        </section>
      ) : null}

      {activeCities.length > 0 ? (
        <section className="mt-8">
          <h2 className="mb-2 text-sm font-semibold">
            Islamic events by city
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {activeCities.map((city) => (
              <Link
                key={city.slug}
                href={cityUrl(city.name)}
                className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-indigo-400 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:text-indigo-300"
              >
                {city.name}
                <span className="ml-1 text-slate-400">{city.upcoming}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
