import {
  SITE_URL,
  eventDescription,
  eventTitle,
  eventUrl,
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

/**
 * schema.org/Event — this is what makes an event eligible for Google's
 * event rich results and the "events near me" experience.
 * Google requires name, startDate and location.
 */
export function eventJsonLd(ev: EventRow): Json {
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
    startDate: ev.start_datetime_utc ?? undefined,
    endDate: ev.end_datetime_utc ?? undefined,
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
