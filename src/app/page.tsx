import Link from "next/link";

import EventCalendar from "@/components/EventCalendar";
import SubscribeForm from "@/components/SubscribeForm";
import { JsonLd, eventListJsonLd, websiteJsonLd } from "@/lib/structured-data";
import { toCalendarEvent } from "@/lib/calendar";
import {
  cityUrl,
  getCitySummaries,
  getUpcomingEvents,
} from "@/lib/events";

export const revalidate = 600;

export default async function HomePage() {
  const upcoming = await getUpcomingEvents();
  const citySummaries = await getCitySummaries();

  const calendarEvents = upcoming.map(toCalendarEvent);
  const cities = citySummaries
    .filter((c) => c.upcoming > 0)
    .map((c) => c.name)
    .sort((a, b) => a.localeCompare(b));

  const activeCities = citySummaries.filter((c) => c.upcoming > 0);

  return (
    <main className="mx-auto max-w-[1440px] px-5 pb-12 md:px-10">
      <JsonLd
        data={[
          websiteJsonLd(),
          eventListJsonLd(
            upcoming.slice(0, 12),
            "Upcoming Islamic events in the UK"
          ),
        ]}
      />

      <div className="max-w-2xl py-8 md:py-10">
        <h1 className="font-display text-[30px] font-medium leading-[1.1] tracking-[-0.6px] md:text-[38px]">
          Islamic events across the UK
        </h1>
        <p className="mt-3 text-[14px] leading-[1.6] text-muted md:text-[15px]">
          Lectures, halaqas, classes, conferences and community gatherings,
          collected from posters shared by the community and listed here for
          free.
        </p>
      </div>

      <EventCalendar events={calendarEvents} cities={cities} />

      {activeCities.length > 0 ? (
        <section className="mt-14 border-t border-rule pt-8">
          <h2 className="font-display text-[19px] font-medium tracking-[-0.2px]">
            Islamic events by city
          </h2>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {activeCities.map((c) => (
              <Link
                key={c.slug}
                href={cityUrl(c.name)}
                className="border border-rule px-3 py-1.5 text-[12px] text-muted transition-colors hover:border-rule-strong hover:text-ink"
              >
                {c.name}
                <span className="ml-1.5 text-faint">{c.upcoming}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-14">
        <SubscribeForm cities={cities} source="home" />
      </div>
    </main>
  );
}
