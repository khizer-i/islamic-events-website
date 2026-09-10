import type { Metadata } from "next";
import Link from "next/link";

import EventCard from "@/components/EventCard";
import SubscribeForm from "@/components/SubscribeForm";
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
    <main className="mx-auto max-w-[860px] px-5 py-10 md:px-10 md:py-12">
      <JsonLd
        data={[
          eventListJsonLd(events, "Upcoming Islamic events in the UK"),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Events", path: "/events" },
          ]),
        ]}
      />

      <nav aria-label="Breadcrumb" className="mb-6 text-[12px] text-faint">
        <Link href="/" className="hover:text-ink">
          Home
        </Link>
        <span aria-hidden> / </span>
        <span>Upcoming</span>
      </nav>

      <h1 className="font-display text-[30px] font-medium leading-[1.1] tracking-[-0.6px] md:text-[38px]">
        Upcoming Islamic events in the UK
      </h1>
      <p className="mt-3 max-w-xl text-[14px] leading-[1.6] text-muted md:text-[15px]">
        {events.length > 0
          ? `${events.length} upcoming event${events.length === 1 ? "" : "s"} across ${cities.length} ${cities.length === 1 ? "city" : "cities"}, listed by month.`
          : "No upcoming events are listed right now."}{" "}
        <Link href="/" className="text-accent hover:underline">
          Open the calendar
        </Link>
        .
      </p>

      {cities.length > 0 ? (
        <section className="mt-8">
          <h2 className="label">Browse by city</h2>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {cities.map((city) => (
              <Link
                key={city.slug}
                href={cityUrl(city.name)}
                className="border border-rule px-3 py-1.5 text-[12px] text-muted transition-colors hover:border-rule-strong hover:text-ink"
              >
                {city.name}
                <span className="ml-1.5 text-faint">{city.upcoming}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {months.length === 0 ? (
        <p className="mt-12 border-t border-rule py-16 text-center text-[14px] text-faint">
          Nothing listed yet. Check back soon.
        </p>
      ) : (
        months.map(([month, monthEvents]) => (
          <section key={month} className="mt-12">
            <h2 className="font-display text-[21px] font-medium tracking-[-0.3px]">
              {month}
            </h2>
            <ul className="mt-3">
              {monthEvents.map((ev) => (
                <EventCard key={ev.id} event={ev} />
              ))}
            </ul>
          </section>
        ))
      )}

      <div className="mt-14">
        <SubscribeForm
          cities={cities.map((c) => c.name)}
          source="events-index"
        />
      </div>
    </main>
  );
}
