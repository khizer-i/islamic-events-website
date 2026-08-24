/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import EventCard from "@/components/EventCard";
import ShareButtons from "@/components/ShareButtons";
import {
  JsonLd,
  breadcrumbJsonLd,
  eventJsonLd,
} from "@/lib/structured-data";
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
    return {
      title: "Event not found",
      robots: { index: false, follow: true },
    };
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
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
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

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-50 md:px-6">
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

      <div className="mx-auto max-w-4xl">
        {/* Breadcrumbs */}
        <nav
          aria-label="Breadcrumb"
          className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"
        >
          <Link href="/" className="hover:text-indigo-600 hover:underline">
            Home
          </Link>
          <span aria-hidden>›</span>
          <Link href="/events" className="hover:text-indigo-600 hover:underline">
            Events
          </Link>
          {event.city ? (
            <>
              <span aria-hidden>›</span>
              <Link
                href={cityUrl(event.city)}
                className="hover:text-indigo-600 hover:underline"
              >
                {event.city}
              </Link>
            </>
          ) : null}
        </nav>

        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-5 py-5 dark:border-slate-800">
            {isPast ? (
              <p className="mb-2 inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                This event has already taken place
              </p>
            ) : null}

            <h1 className="text-xl font-semibold leading-snug md:text-2xl">
              {title}
            </h1>

            <p className="mt-2 text-sm font-medium text-indigo-700 dark:text-indigo-300">
              {formatDateLong(event.start_datetime_utc)}
              {startTime ? ` · ${startTime}` : ""}
              {endTime && endTime !== startTime ? `–${endTime}` : ""}
            </p>

            {hijri ? (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {hijri}
              </p>
            ) : null}
          </div>

          <div className="grid gap-5 px-5 py-5 sm:grid-cols-[minmax(0,1fr),minmax(0,1.15fr)]">
            {/* Poster */}
            <div>
              {event.poster_url ? (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950">
                  <img
                    src={event.poster_url}
                    alt={`Poster for ${title}`}
                    className="w-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-slate-300 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  No poster available for this event.
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex flex-col gap-4 text-sm">
              <dl className="space-y-2">
                {event.venue_name ? (
                  <div className="flex gap-2">
                    <dt className="w-20 shrink-0 font-medium text-slate-500 dark:text-slate-400">
                      Venue
                    </dt>
                    <dd>{event.venue_name}</dd>
                  </div>
                ) : null}

                {event.city ? (
                  <div className="flex gap-2">
                    <dt className="w-20 shrink-0 font-medium text-slate-500 dark:text-slate-400">
                      City
                    </dt>
                    <dd>
                      <Link
                        href={cityUrl(event.city)}
                        className="text-indigo-700 hover:underline dark:text-indigo-300"
                      >
                        {event.city}
                      </Link>
                    </dd>
                  </div>
                ) : null}

                {event.organiser ? (
                  <div className="flex gap-2">
                    <dt className="w-20 shrink-0 font-medium text-slate-500 dark:text-slate-400">
                      Organiser
                    </dt>
                    <dd>{event.organiser}</dd>
                  </div>
                ) : null}
              </dl>

              {event.tags && event.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {event.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      {formatTagLabel(tag)}
                    </span>
                  ))}
                </div>
              ) : null}

              {event.source_caption ? (
                <div>
                  <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Details
                  </h2>
                  <p className="whitespace-pre-line text-sm text-slate-800 dark:text-slate-100">
                    {event.source_caption}
                  </p>
                </div>
              ) : null}

              {event.notes ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-medium">Note: </span>
                  {event.notes}
                </p>
              ) : null}

              {!isPast ? (
                <div className="flex flex-col gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
                  {gcal ? (
                    <a
                      href={gcal}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-fit items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-indigo-700"
                    >
                      Add to Google Calendar
                    </a>
                  ) : null}
                  <ShareButtons url={canonical} title={title} />
                </div>
              ) : null}

              <p className="text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
                Details are extracted automatically from a community poster.
                Please check with the organiser before travelling.
              </p>
            </div>
          </div>
        </article>

        {related.length > 0 ? (
          <section className="mt-8">
            <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-50">
              {event.city
                ? `More upcoming events in ${event.city}`
                : "More upcoming events"}
            </h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {related.map((ev) => (
                <EventCard key={ev.id} event={ev} />
              ))}
            </ul>
            <Link
              href="/events"
              className="mt-3 inline-block text-xs font-medium text-indigo-700 hover:underline dark:text-indigo-300"
            >
              Browse all upcoming events →
            </Link>
          </section>
        ) : null}
      </div>
    </main>
  );
}
