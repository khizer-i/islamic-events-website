import {
  SITE_URL,
  UK_TZ,
  eventDescription,
  eventEnd,
  eventTitle,
  eventUrl,
  toDate,
  type EventRow,
} from "./events";

const SITE_NAME = "UK Islamic Events Calendar";

type Json = Record<string, unknown>;

function clean(obj: Json): Json {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([, v]) => v !== undefined && v !== null && v !== ""
    )
  );
}

/* ------------------------------------------------------------------ */
/* Dates for schema.org                                                */
/* ------------------------------------------------------------------ */

type SchemaDate = { value: string; hasTime: boolean; date: string };

const ukPartsFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: UK_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

const pad = (n: number) => String(Math.abs(n)).padStart(2, "0");

/**
 * Turns a stored UTC timestamp into what Google expects for an Event:
 * UK wall-clock time with its offset ("2026-10-10T19:00:00+01:00"), or a
 * bare date ("2026-10-10") when the time is unknown. Local midnight is the
 * extraction's "no time on the poster" convention (see formatTime), so it
 * is emitted as a date rather than claiming the event starts at 00:00.
 */
function schemaDate(
  iso: string | null | undefined,
  keepMidnight = false
): SchemaDate | null {
  const d = toDate(iso);
  if (!d) return null;

  const parts = Object.fromEntries(
    ukPartsFormat.formatToParts(d).map((p) => [p.type, p.value])
  );
  const y = Number(parts.year);
  const mo = Number(parts.month);
  const day = Number(parts.day);
  const h = Number(parts.hour);
  const mi = Number(parts.minute);
  const sec = Number(parts.second);

  const date = `${y}-${pad(mo)}-${pad(day)}`;
  if (h === 0 && mi === 0 && !keepMidnight) {
    return { value: date, hasTime: false, date };
  }

  const wallAsUtc = Date.UTC(y, mo - 1, day, h, mi, sec);
  const offsetMin = Math.round(
    (wallAsUtc - Math.floor(d.getTime() / 1000) * 1000) / 60000
  );
  const sign = offsetMin < 0 ? "-" : "+";
  const offset = `${sign}${pad(Math.floor(Math.abs(offsetMin) / 60))}:${pad(
    Math.abs(offsetMin) % 60
  )}`;

  return {
    value: `${date}T${pad(h)}:${pad(mi)}:${pad(sec)}${offset}`,
    hasTime: true,
    date,
  };
}

/**
 * endDate rules:
 * - start has no time: all-day, so endDate is a date. The start day unless
 *   a later end date is recorded.
 * - start has a time: the recorded end, or the two-hour estimate from
 *   eventEnd(). schema.org has no way to mark a value as estimated, so the
 *   label lives on the event page instead.
 */
function schemaEndDate(start: SchemaDate, ev: EventRow): string | undefined {
  if (!start.hasTime) {
    const end = schemaDate(ev.end_datetime_utc);
    return end && end.date > start.date ? end.date : start.date;
  }

  const end = eventEnd(ev);
  // A timed start needs a timed end, so a real midnight finish (an event
  // running 19:00 to 00:00) is kept as a time here, not collapsed to a date.
  return end ? schemaDate(end.iso, true)?.value : undefined;
}

/**
 * schema.org/Event — this is what makes an event eligible for Google's
 * event rich results and the "events near me" experience.
 * Google requires name, startDate and location, so an event with no start
 * date gets no Event markup at all (returns null) rather than an invalid
 * block that Search Console reports as a critical error.
 */
export function eventJsonLd(ev: EventRow): Json | null {
  const start = schemaDate(ev.start_datetime_utc);
  if (!start) return null;

  const location: Json = ev.venue_name
    ? {
        "@type": "Place",
        name: ev.venue_name,
        address: clean({
          "@type": "PostalAddress",
          addressLocality: ev.city ?? undefined,
          addressCountry: "GB",
        }),
      }
    : {
        "@type": "Place",
        name: ev.city ?? "United Kingdom",
        address: clean({
          "@type": "PostalAddress",
          addressLocality: ev.city ?? undefined,
          addressCountry: "GB",
        }),
      };

  return clean({
    "@context": "https://schema.org",
    "@type": "Event",
    name: eventTitle(ev),
    startDate: start.value,
    endDate: schemaEndDate(start, ev),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    description: eventDescription(ev),
    image: ev.poster_url ? [ev.poster_url] : undefined,
    url: `${SITE_URL}${eventUrl(ev)}`,
    location,
    organizer: ev.organiser
      ? { "@type": "Organization", name: ev.organiser }
      : undefined,
    keywords:
      ev.tags && ev.tags.length > 0 ? ev.tags.join(", ") : undefined,
    inLanguage: "en-GB",
  });
}

/** An ordered list of events, used on index and city pages. */
export function eventListJsonLd(events: EventRow[], listName: string): Json {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: listName,
    numberOfItems: events.length,
    itemListElement: events.map((ev, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}${eventUrl(ev)}`,
      name: eventTitle(ev),
    })),
  };
}

export function breadcrumbJsonLd(
  trail: { name: string; path: string }[]
): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: `${SITE_URL}${crumb.path}`,
    })),
  };
}

export function websiteJsonLd(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: "Islamic Events Calendar UK",
    url: SITE_URL,
    description:
      "A free calendar of Islamic events, lectures, classes and fundraisers across the UK.",
    inLanguage: "en-GB",
  };
}

/** Renders a JSON-LD block. Next keeps this in the server-rendered HTML. */
export function JsonLd({ data }: { data: Json | Json[] }) {
  return (
    <script
      type="application/ld+json"
      // Structured data is generated from our own database, not user input.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
