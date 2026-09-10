/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import EventCard from "@/components/EventCard";
import RichText from "@/components/RichText";
import ShareButtons from "@/components/ShareButtons";
import { JsonLd, breadcrumbJsonLd, eventJsonLd } from "@/lib/structured-data";
import { CATEGORIES, categoriesForEvent } from "@/lib/calendar";
import {
  SITE_URL,
  cityUrl,
  eventDescription,
  eventSlug,
  eventTitle,
  eventUrl,
  formatDateLong,
  formatHijri,
  formatTagLabel,
  formatTime,
  getAllEvents,
  getEventBySlug,
  getRelatedEvents,
  getUpcomingEvents,
  googleCalendarUrl,
} from "@/lib/events";

export const revalidate = 900;
export const dynamicParams = true;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const events = await getAllEvents();
  return events.map((ev) => ({ slug: eventSlug(ev) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    return { title: "Event not found", robots: { index: false, follow: true } };
  }

  const title = event.city
    ? `${eventTitle(event)} — ${event.city}`
    : eventTitle(event);
  const description = eventDescription(event);
  const canonical = `${SITE_URL}${eventUrl(event)}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title,
      description,
      url: canonical,
      siteName: "UK Islamic Events Calendar",
      locale: "en_GB",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-5 border-b border-rule py-3.5">
      <span className="label w-[64px] shrink-0 pt-1">{label}</span>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) notFound();

  const title = eventTitle(event);
  const canonical = `${SITE_URL}${eventUrl(event)}`;
  const startTime = formatTime(event.start_datetime_utc);
  const endTime = formatTime(event.end_datetime_utc);
  const hijri = formatHijri(event.start_datetime_utc);
  const gcal = googleCalendarUrl(event);
  const related = await getRelatedEvents(event);

  const upcomingIds = new Set((await getUpcomingEvents()).map((e) => e.id));
  const isPast = !upcomingIds.has(event.id);

  const categoryLabels = categoriesForEvent(event)
    .map((id) => CATEGORIES.find((c) => c.id === id)?.label)
    .filter(Boolean) as string[];

  return (
    <main className="mx-auto max-w-[900px] px-5 py-8 md:px-10 md:py-12">
      <JsonLd
        data={[
          eventJsonLd(event),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Events", path: "/events" },
            ...(event.city
              ? [{ name: event.city, path: cityUrl(event.city) }]
              : []),
            { name: title, path: eventUrl(event) },
          ]),
        ]}
      />

      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex flex-wrap items-center gap-1.5 text-[12px] text-faint"
      >
        <Link href="/" className="hover:text-ink">
          Home
        </Link>
        <span aria-hidden>/</span>
        <Link href="/events" className="hover:text-ink">
          Upcoming
        </Link>
        {event.city ? (
          <>
            <span aria-hidden>/</span>
            <Link href={cityUrl(event.city)} className="hover:text-ink">
              {event.city}
            </Link>
          </>
        ) : null}
      </nav>

      {/* Title block */}
      <div className="flex flex-col gap-3">
        {(isPast || categoryLabels.length > 0) && (
          <div className="flex flex-wrap gap-1.5">
            {isPast ? (
              <span className="border border-shade px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
                Already happened
              </span>
            ) : null}
            {categoryLabels.slice(0, 2).map((label) => (
              <span
                key={label}
                className="bg-fill px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-fill-text"
              >
                {label}
              </span>
            ))}
          </div>
        )}

        <h1 className="font-display text-[30px] font-semibold leading-[1.12] tracking-[-0.6px] text-pretty md:text-[40px]">
          {title}
        </h1>

        <p className="font-display text-[17px] text-accent md:text-[19px]">
          {formatDateLong(event.start_datetime_utc)}
          {startTime ? <span className="tnum"> · {startTime}</span> : null}
          {endTime && endTime !== startTime ? (
            <span className="tnum">–{endTime}</span>
          ) : null}
        </p>
        {hijri ? <p className="text-[13px] text-faint">{hijri}</p> : null}
      </div>

      {/* Poster + details */}
      <div className="mt-8 grid gap-8 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] md:gap-10">
        <div>
          {event.poster_url ? (
            <img
              src={event.poster_url}
              alt={`Poster for ${title}`}
              className="w-full rounded-[2px] border border-rule object-contain"
            />
          ) : (
            <div className="flex h-56 items-center justify-center border border-dashed border-shade text-[13px] text-faint">
              No poster available.
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <div className="border-t border-rule-strong">
            {event.venue_name ? (
              <Row label="Venue">
                <span className="font-display text-[17px] font-medium">
                  {event.venue_name}
                </span>
              </Row>
            ) : null}

            {event.city ? (
              <Row label="City">
                <Link
                  href={cityUrl(event.city)}
                  className="font-display text-[17px] font-medium text-accent hover:underline"
                >
                  {event.city}
                </Link>
              </Row>
            ) : null}

            {event.organiser ? (
              <Row label="By">
                <span className="font-display text-[17px] font-medium">
                  {event.organiser}
                </span>
              </Row>
            ) : null}
          </div>

          {!isPast ? (
            <div className="mt-7 flex flex-col gap-2.5">
              {gcal ? (
                <a
                  href={gcal}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-12 items-center justify-center gap-2 bg-fill text-[14px] font-medium text-fill-text transition-opacity hover:opacity-85"
                >
                  Add to calendar
                </a>
              ) : null}
              <ShareButtons url={canonical} title={title} />
            </div>
          ) : null}

          {event.source_caption ? (
            <div className="mt-8 flex flex-col gap-2">
              <h2 className="label">From the organiser</h2>
              <RichText
                text={event.source_caption}
                className="text-[14px] leading-[1.6] text-ink-soft"
              />
            </div>
          ) : null}

          {event.tags && event.tags.length > 0 ? (
            <div className="mt-7 flex flex-wrap gap-1.5">
              {event.tags.map((tag) => (
                <span
                  key={tag}
                  className="border border-rule px-2 py-1 text-[11px] text-muted"
                >
                  {formatTagLabel(tag)}
                </span>
              ))}
            </div>
          ) : null}

          {event.notes ? (
            <p className="mt-5 text-[12px] leading-[1.5] text-faint">
              <span className="font-medium">Note: </span>
              {event.notes}
            </p>
          ) : null}

          <p className="mt-7 border-t border-rule pt-5 text-[12px] leading-[1.55] text-faint">
            Details were read automatically from the organiser&rsquo;s poster.
            Please confirm with them before travelling.
          </p>
        </div>
      </div>

      {related.length > 0 ? (
        <section className="mt-16 border-t border-rule-strong pt-8">
          <h2 className="font-display text-[21px] font-medium tracking-[-0.3px]">
            {event.city
              ? `More upcoming events in ${event.city}`
              : "More upcoming events"}
          </h2>
          <ul className="mt-3">
            {related.map((ev) => (
              <EventCard key={ev.id} event={ev} />
            ))}
          </ul>
          <Link
            href="/events"
            className="mt-5 inline-block text-[13px] font-medium text-accent hover:underline"
          >
            Browse all upcoming events →
          </Link>
        </section>
      ) : null}
    </main>
  );
}
