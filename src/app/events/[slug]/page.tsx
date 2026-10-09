/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import EventCard from "@/components/EventCard";
import RichText from "@/components/RichText";
import ShareButtons from "@/components/ShareButtons";
import { SITE_NAME, WHATSAPP_CHANNEL_URL } from "@/lib/brand";
import { JsonLd, breadcrumbJsonLd, eventJsonLd } from "@/lib/structured-data";
import { CATEGORIES, categoriesForEvent } from "@/lib/calendar";
import {
  SITE_URL,
  cityUrl,
  eventDescription,
  eventEnd,
  eventSessions,
  eventSlug,
  eventTitle,
  eventUrl,
  formatDateLong,
  formatDateShort,
  formatHijri,
  formatTagLabel,
  formatTime,
  getAllEvents,
  getEventBySlug,
  getRelatedEvents,
  getUpcomingEvents,
  googleCalendarUrl,
  nextSession,
} from "@/lib/events";
import { describeRule } from "@/lib/recurrence";

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
      siteName: SITE_NAME,
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
  // A series is shown at its next session (or its last, once it is over).
  // Everything below that reads a date reads `shown`.
  const sessions = eventSessions(event);
  const series = sessions.length > 1;
  const next = nextSession(event);
  const shown = next ?? sessions[sessions.length - 1];
  const upcomingSessions = next
    ? sessions.filter((s) => (s.start_datetime_utc ?? "") >= (next.start_datetime_utc ?? ""))
    : [];
  const lastSession = sessions[sessions.length - 1];
  const pattern = series ? describeRule(event.recurrence_rule, event.start_datetime_utc) : null;

  const startTime = formatTime(shown.start_datetime_utc);
  const end = eventEnd(shown);
  const endTime = end ? formatTime(end.iso) : null;
  const hijri = formatHijri(shown.start_datetime_utc);
  const gcal = googleCalendarUrl(shown);
  const related = await getRelatedEvents(event);
  // Google wants each date of a repeating event as its own Event, so a
  // series lists its next few sessions (all at this one page).
  const eventLd = (series && next ? upcomingSessions.slice(0, 6) : [event])
    .map((s) => eventJsonLd(s))
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const upcomingIds = new Set((await getUpcomingEvents()).map((e) => e.id));
  const isPast = !upcomingIds.has(event.id);

  const categoryLabels = categoriesForEvent(event)
    .map((id) => CATEGORIES.find((c) => c.id === id)?.label)
    .filter(Boolean) as string[];

  return (
    <main className="mx-auto max-w-[900px] px-5 py-8 md:px-10 md:py-12">
      <JsonLd
        data={[
          ...eventLd,
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
          {series && next ? <span className="text-[13px] font-sans uppercase tracking-[0.08em]">Next: </span> : null}
          {formatDateLong(shown.start_datetime_utc)}
          {startTime ? <span className="tnum"> · {startTime}</span> : null}
          {startTime && endTime && endTime !== startTime ? (
            <span className="tnum">–{endTime}</span>
          ) : null}
          {startTime && end?.estimated ? (
            <span className="text-[13px] text-faint"> (end time estimated)</span>
          ) : null}
        </p>
        {hijri ? <p className="text-[13px] text-faint">{hijri}</p> : null}
        {pattern ? (
          <p className="text-[14px] text-ink-soft">
            {next
              ? event.recurrence_open
                ? `${pattern}, ongoing`
                : `${pattern}, until ${formatDateLong(lastSession.start_datetime_utc)}`
              : `Ran ${pattern[0].toLowerCase()}${pattern.slice(1)}, until ${formatDateLong(lastSession.start_datetime_utc)}`}
          </p>
        ) : null}
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

            {series && next ? (
              <Row label="Dates">
                <span className="flex flex-wrap gap-x-3 gap-y-1 text-[14px] tnum">
                  {upcomingSessions.slice(0, 8).map((s) => (
                    <span key={s.start_datetime_utc}>{formatDateShort(s.start_datetime_utc)}</span>
                  ))}
                  {upcomingSessions.length > 8 ? (
                    <span className="text-faint">and {upcomingSessions.length - 8} more</span>
                  ) : null}
                </span>
                {event.recurrence_open ? (
                  <span className="text-[12px] text-faint">
                    {`Listed to ${formatDateShort(lastSession.start_datetime_utc)}. Please check with the organiser for later weeks.`}
                  </span>
                ) : null}
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
              <p className="mt-1 text-[13px] leading-[1.6] text-muted">
                Get a roundup of events like this every Thursday on{" "}
                <a
                  href={WHATSAPP_CHANNEL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent underline underline-offset-2 hover:text-accent-hover"
                >
                  our WhatsApp channel
                </a>
                .
              </p>
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

      {related.sameCity.length > 0 || related.elsewhere.length > 0 ? (
        <section className="mt-16 border-t border-rule-strong pt-8">
          {related.sameCity.length > 0 ? (
            <>
              <h2 className="font-display text-[21px] font-medium tracking-[-0.3px]">
                More upcoming events in {event.city}
              </h2>
              <ul className="mt-3">
                {related.sameCity.map((ev) => (
                  <EventCard key={ev.id} event={ev} />
                ))}
              </ul>
            </>
          ) : null}

          {related.elsewhere.length > 0 ? (
            <div className={related.sameCity.length > 0 ? "mt-10" : undefined}>
              <h2 className="font-display text-[21px] font-medium tracking-[-0.3px]">
                {event.city ? "Elsewhere in the UK" : "More upcoming events"}
              </h2>
              <ul className="mt-3">
                {related.elsewhere.map((ev) => (
                  <EventCard key={ev.id} event={ev} />
                ))}
              </ul>
            </div>
          ) : null}

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
