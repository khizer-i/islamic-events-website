import { cache } from "react";
import { supabase } from "./supabaseClient";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.islamiceventscalendar.co.uk"
).replace(/\/+$/, "");

export const UK_TZ = "Europe/London";

export const HIJRI_MONTHS = [
  "Muharram",
  "Safar",
  "Rabi al-Awwal",
  "Rabi al-Thani",
  "Jumada al-Awwal",
  "Jumada al-Thani",
  "Rajab",
  "Sha'ban",
  "Ramadan",
  "Shawwal",
  "Dhu al-Qa'dah",
  "Dhu al-Hijjah",
];

export type EventRow = {
  id: string;
  title: string | null;
  organiser: string | null;
  start_datetime_utc: string | null;
  end_datetime_utc: string | null;
  venue_name: string | null;
  city: string | null;
  tags: string[] | null;
  notes: string | null;
  poster_url: string | null;
  source_caption: string | null;
  status: string | null;
};

/* ------------------------------------------------------------------ */
/* Slugs                                                               */
/* ------------------------------------------------------------------ */

export function slugifyText(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['‘’ʻʼ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70)
    .replace(/-+$/g, "");
}

/** Stable short hash so every event gets a unique, permanent URL. */
function shortHash(id: string): string {
  let h = 5381;
  for (let i = 0; i < id.length; i++) {
    h = ((h * 33) ^ id.charCodeAt(i)) >>> 0;
  }
  return h.toString(36).slice(0, 6).padStart(6, "0");
}

export function eventSlug(ev: Pick<EventRow, "id" | "title">): string {
  const base = slugifyText(ev.title || "") || "islamic-event";
  return `${base}-${shortHash(ev.id)}`;
}

export function eventUrl(ev: Pick<EventRow, "id" | "title">): string {
  return `/events/${eventSlug(ev)}`;
}

export function citySlug(city: string): string {
  return slugifyText(city);
}

export function cityUrl(city: string): string {
  return `/cities/${citySlug(city)}`;
}

/* ------------------------------------------------------------------ */
/* Dates                                                               */
/* ------------------------------------------------------------------ */

export function toDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDateLong(iso: string | null | undefined): string {
  const d = toDate(iso);
  if (!d) return "Date to be confirmed";
  return d.toLocaleDateString("en-GB", {
    timeZone: UK_TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDateShort(iso: string | null | undefined): string {
  const d = toDate(iso);
  if (!d) return "TBC";
  return d.toLocaleDateString("en-GB", {
    timeZone: UK_TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatTime(iso: string | null | undefined): string | null {
  const d = toDate(iso);
  if (!d) return null;
  const t = d.toLocaleTimeString("en-GB", {
    timeZone: UK_TZ,
    hour: "2-digit",
    minute: "2-digit",
  });
  // Midnight almost always means "time unknown" from the poster extraction.
  return t === "00:00" ? null : t;
}

export function formatHijri(iso: string | null | undefined): string | null {
  const d = toDate(iso);
  if (!d) return null;
  try {
    const parts = new Intl.DateTimeFormat("en-GB-u-ca-islamic-umalqura", {
      timeZone: UK_TZ,
      day: "numeric",
      month: "numeric",
      year: "numeric",
    }).formatToParts(d);

    const get = (type: string) =>
      parts.find((p) => p.type === type)?.value ?? "";

    const day = get("day").replace(/^0+/, "");
    const monthIndex = Number(get("month")) - 1;
    const year = get("year").replace(/[^0-9]/g, "");
    const month = HIJRI_MONTHS[monthIndex];
    if (!day || !month || !year) return null;
    return `${day} ${month} ${year} AH`;
  } catch {
    return null;
  }
}

export function monthKey(iso: string | null | undefined): string {
  const d = toDate(iso);
  if (!d) return "Dates to be confirmed";
  return d.toLocaleDateString("en-GB", {
    timeZone: UK_TZ,
    month: "long",
    year: "numeric",
  });
}

/* ------------------------------------------------------------------ */
/* Queries                                                             */
/* ------------------------------------------------------------------ */

/**
 * All published events. Cached per-request by React, and the routes that use
 * it set their own `revalidate`, so this hits Supabase rarely.
 * Never throws: a Supabase outage must not break the build or the site.
 */
export const getAllEvents = cache(async (): Promise<EventRow[]> => {
  try {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("status", "published")
      .order("start_datetime_utc", { ascending: true });

    if (error) {
      console.error("Supabase error loading events:", error.message);
      return [];
    }
    return (data ?? []) as EventRow[];
  } catch (err) {
    console.error("Supabase request failed:", err);
    return [];
  }
});

/** Events that have not finished yet (today's events stay visible all day). */
export const getUpcomingEvents = cache(async (): Promise<EventRow[]> => {
  const all = await getAllEvents();
  const cutoff = Date.now() - 12 * 60 * 60 * 1000;
  return all.filter((ev) => {
    const end = toDate(ev.end_datetime_utc) ?? toDate(ev.start_datetime_utc);
    return end ? end.getTime() >= cutoff : false;
  });
});

export const getEventBySlug = cache(
  async (slug: string): Promise<EventRow | null> => {
    const all = await getAllEvents();
    return all.find((ev) => eventSlug(ev) === slug) ?? null;
  }
);

export type CitySummary = {
  name: string;
  slug: string;
  upcoming: number;
  total: number;
};

export const getCitySummaries = cache(async (): Promise<CitySummary[]> => {
  const [all, upcoming] = await Promise.all([
    getAllEvents(),
    getUpcomingEvents(),
  ]);

  const totals = new Map<string, number>();
  for (const ev of all) {
    if (!ev.city) continue;
    totals.set(ev.city, (totals.get(ev.city) ?? 0) + 1);
  }

  const upcomingCounts = new Map<string, number>();
  for (const ev of upcoming) {
    if (!ev.city) continue;
    upcomingCounts.set(ev.city, (upcomingCounts.get(ev.city) ?? 0) + 1);
  }

  return Array.from(totals.entries())
    .map(([name, total]) => ({
      name,
      slug: citySlug(name),
      total,
      upcoming: upcomingCounts.get(name) ?? 0,
    }))
    .sort(
      (a, b) => b.upcoming - a.upcoming || a.name.localeCompare(b.name)
    );
});

export const getCityBySlug = cache(
  async (slug: string): Promise<CitySummary | null> => {
    const cities = await getCitySummaries();
    return cities.find((c) => c.slug === slug) ?? null;
  }
);

export const getEventsInCity = cache(
  async (cityName: string): Promise<{ upcoming: EventRow[]; past: EventRow[] }> => {
    const all = await getAllEvents();
    const upcomingIds = new Set((await getUpcomingEvents()).map((e) => e.id));
    const inCity = all.filter((ev) => ev.city === cityName);
    return {
      upcoming: inCity.filter((ev) => upcomingIds.has(ev.id)),
      past: inCity
        .filter((ev) => !upcomingIds.has(ev.id))
        .sort((a, b) =>
          (b.start_datetime_utc ?? "").localeCompare(a.start_datetime_utc ?? "")
        ),
    };
  }
);

/** Other upcoming events to cross-link from an event page. */
export async function getRelatedEvents(
  ev: EventRow,
  limit = 6
): Promise<EventRow[]> {
  const upcoming = await getUpcomingEvents();
  const others = upcoming.filter((e) => e.id !== ev.id);
  const sameCity = others.filter((e) => e.city && e.city === ev.city);
  const rest = others.filter((e) => !e.city || e.city !== ev.city);
  return [...sameCity, ...rest].slice(0, limit);
}

/* ------------------------------------------------------------------ */
/* Presentation helpers                                                */
/* ------------------------------------------------------------------ */

export function formatTagLabel(tag: string): string {
  return tag
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export function eventTitle(ev: EventRow): string {
  return ev.title?.trim() || "Islamic event";
}

export function eventLocationLine(ev: EventRow): string {
  return [ev.venue_name, ev.city].filter(Boolean).join(", ");
}

/** Short human description used for meta descriptions and cards. */
export function eventDescription(ev: EventRow): string {
  const when = formatDateLong(ev.start_datetime_utc);
  const time = formatTime(ev.start_datetime_utc);
  const where = eventLocationLine(ev);

  const bits = [
    `${eventTitle(ev)} on ${when}${time ? ` at ${time}` : ""}${
      where ? `, ${where}` : ""
    }.`,
    ev.organiser ? `Organised by ${ev.organiser}.` : "",
  ].filter(Boolean);

  const caption = ev.source_caption?.replace(/\s+/g, " ").trim();
  const base = bits.join(" ").replace(/\s+/g, " ").trim();
  const full = caption ? `${base} ${caption}` : base;
  return full.length > 300 ? `${full.slice(0, 297).trimEnd()}...` : full;
}

function gcalStamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/**
 * "Add to Google Calendar" link. Getting an event into someone's own calendar
 * is the strongest signal of intent we can capture without an account system.
 */
export function googleCalendarUrl(ev: EventRow): string | null {
  const start = toDate(ev.start_datetime_utc);
  if (!start) return null;
  const end =
    toDate(ev.end_datetime_utc) ??
    new Date(start.getTime() + 2 * 60 * 60 * 1000);

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: eventTitle(ev),
    dates: `${gcalStamp(start)}/${gcalStamp(end)}`,
    details: `${ev.source_caption?.trim() || ""}\n\n${SITE_URL}${eventUrl(ev)}`.trim(),
    location: eventLocationLine(ev) || "United Kingdom",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Group events by month for readable, crawlable listings. */
export function groupByMonth(events: EventRow[]): [string, EventRow[]][] {
  const groups = new Map<string, EventRow[]>();
  for (const ev of events) {
    const key = monthKey(ev.start_datetime_utc);
    const bucket = groups.get(key);
    if (bucket) bucket.push(ev);
    else groups.set(key, [ev]);
  }
  return Array.from(groups.entries());
}
