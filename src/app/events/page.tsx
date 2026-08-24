import type { Metadata } from "next";
import Link from "next/link";

import EventCard from "@/components/EventCard";
import { JsonLd, breadcrumbJsonLd, eventListJsonLd } from "@/lib/structured-data";
import {
  SITE_URL,
  cityUrl,
  getCitySummaries,
  getUpcomingEvents,
  groupByMonth,
} from "@/lib/events";

export const revalidate = 900;

export const metadata: Metadata = {
  title: "Upcoming Islamic events in the UK",
  description:
    "Every upcoming Islamic event in our calendar — lectures, halaqas, classes, fundraisers and community events across the UK, listed by month.",
  alternates: { canonical: `${SITE_URL}/events` },
  openGraph: {
    title: "Upcoming Islamic events in the UK",
    description:
      "Lectures, halaqas, classes, fundraisers and community events across the UK.",
    url: `${SITE_URL}/events`,
  },
};

export default async function EventsIndexPage() {
  const events = await getUpcomingEvents();
  const cities = (await getCitySummaries()).filter((c) => c.upcoming > 0);
  const months = groupByMonth(events);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-50 md:px-6">
      <JsonLd
        data={[
          eventListJsonLd(events, "Upcoming Islamic events in the UK"),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Events", path: "/events" },
          ]),
        ]}
      />

      <div className="mx-auto max-w-5xl">
        <nav
          aria-label="Breadcrumb"
          className="mb-4 text-xs text-slate-500 dark:text-slate-400"
        >
          <Link href="/" className="hover:text-indigo-600 hover:underline">
            Home
          </Link>
          <span aria-hidden> › </span>
          <span>Events</span>
        </nav>

        <header className="mb-6">
          <h1 className="text-xl font-semibold md:text-2xl">
            Upcoming Islamic events in the UK
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
            {events.length > 0
              ? `${events.length} upcoming event${events.length === 1 ? "" : "s"} across ${cities.length} ${cities.length === 1 ? "city" : "cities"}, listed by month. Prefer a calendar view? `
              : "No upcoming events are listed right now. "}
            <Link
              href="/"
              className="text-indigo-700 hover:underline dark:text-indigo-300"
            >
              Open the calendar
            </Link>
            .
          </p>
        </header>

        {cities.length > 0 ? (
          <section className="mb-8">
            <h2 className="mb-2 text-sm font-semibold">Browse by city</h2>
            <div className="flex flex-wrap gap-1.5">
              {cities.map((city) => (
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

        {months.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Nothing listed yet. Check back soon.
          </p>
        ) : (
          months.map(([month, monthEvents]) => (
            <section key={month} className="mb-8">
              <h2 className="mb-3 border-b border-slate-200 pb-1 text-sm font-semibold text-slate-900 dark:border-slate-800 dark:text-slate-50">
                {month}
              </h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {monthEvents.map((ev) => (
                  <EventCard key={ev.id} event={ev} />
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </main>
  );
}
