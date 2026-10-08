import { cache } from "react";
import { supabase } from "./supabaseClient";
import { hijriLong, UK_TZ } from "./hijri";
import {
  calendarRrule,
  describeRule,
  occurrenceInstants,
  parseRule,
} from "./recurrence";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.islamiceventscalendar.co.uk"
).replace(/\/+$/, "");

// Both now live in ./hijri, re-exported here so existing imports keep working.
export { UK_TZ, HIJRI_MONTHS } from "./hijri";

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
  /** Repeating events (Oct 2026). Optional so rows from before the
   *  recurrence columns existed still type-check. See lib/recurrence.ts. */
  recurrence_rule?: string | null;
  recurrence_text?: string | null;
  recurrence_open?: boolean | null;
  /** Not a column: set on a copy moved to one session of a series (see
   *  atSession), holding the series' first start. */
  series_start_utc?: string | null;
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
  return hijriLong(d);
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
 * The extraction model sometimes emits the STRING "null" (or "N/A", "unknown")
 * rather than a JSON null, and those land in the database as real text — which
 * is why an unknown organiser rendered as the word "null" on the page. Cleaned
 * here at the single point every route reads through, so no template has to
 * defend against it individually.
 */
const NOT_A_VALUE = new Set([
  "null",
  "none",
  "nil",
  "n/a",
  "na",
  "unknown",
  "not specified",
  "not stated",
  "tbc",
  "tbd",
  "-",
  "--",
  "undefined",
]);

function cleanText(value: string | null): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (trimmed === "") return null;
  return NOT_A_VALUE.has(trimmed.toLowerCase()) ? null : trimmed;
}

function cleanRow(ev: EventRow): EventRow {
  return {
    ...ev,
    title: cleanText(ev.title),
    organiser: cleanText(ev.organiser),
    venue_name: cleanText(ev.venue_name),
    city: cleanText(ev.city),
    notes: cleanText(ev.notes),
    source_caption: cleanText(ev.source_caption),
    tags:
      ev.tags
        ?.map((t) => cleanText(t))
        .filter((t): t is string => Boolean(t)) ?? null,
  };
}

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
    return ((data ?? []) as EventRow[]).map(cleanRow);
  } catch (err) {
    console.error("Supabase request failed:", err);
    return [];
  }
});

/* ------------------------------------------------------------------ */
/* Repeating events                                                    */
/* ------------------------------------------------------------------ */

/** True when the row repeats (has a rule the site understands). */
export function isSeries(ev: EventRow): boolean {
  return parseRule(ev.recurrence_rule) !== null;
}

/**
 * A copy of the row moved to one session of its series, keeping the
 * session's length. Every helper that reads start/end (times, the 2-hour
 * estimate, markup, cards) then works on a session unchanged.
 */
export function atSession(ev: EventRow, startMs: number): EventRow {
  const start = toDate(ev.start_datetime_utc);
  // occurrenceEnd, not the raw column: older rows stored the SERIES end there.
  const end = occurrenceEnd(ev);
  const length = start && end ? end.getTime() - start.getTime() : null;
  return {
    ...ev,
    start_datetime_utc: new Date(startMs).toISOString(),
    end_datetime_utc: length !== null ? new Date(startMs + length).toISOString() : null,
    series_start_utc: ev.series_start_utc ?? ev.start_datetime_utc,
  };
}

/** Every session of a series, first to last (a one-off gives itself). */
export function eventSessions(ev: EventRow): EventRow[] {
  if (!isSeries(ev)) return [ev];
  return occurrenceInstants(ev.start_datetime_utc, ev.recurrence_rule).map((t) =>
    atSession(ev, t)
  );
}

/** Today's events stay visible all day: anything ending in the last 12 hours counts. */
function upcomingCutoff(): number {
  return Date.now() - 12 * 60 * 60 * 1000;
}

/**
 * Reads the end through eventEnd(), never end_datetime_utc directly: older
 * rows for a recurring class stored the LAST DATE OF THE SERIES there, which
 * kept a talk from 21 September listed as "upcoming" until 21 November.
 */
function stillOn(ev: EventRow, cutoff: number): boolean {
  const end = toDate(eventEnd(ev)?.iso) ?? toDate(ev.start_datetime_utc);
  return end ? end.getTime() >= cutoff : false;
}

/** The next session that has not finished, or null once the series is over. */
export function nextSession(ev: EventRow, cutoff = upcomingCutoff()): EventRow | null {
  return eventSessions(ev).find((s) => stillOn(s, cutoff)) ?? null;
}

const byStart = (a: EventRow, b: EventRow) =>
  (a.start_datetime_utc ?? "").localeCompare(b.start_datetime_utc ?? "");

/**
 * Events that have not finished yet. A series appears ONCE, moved to its
 * next session, so a weekly class does not fill a list with copies of
 * itself; it stays upcoming until its last session has passed.
 */
export const getUpcomingEvents = cache(async (): Promise<EventRow[]> => {
  const all = await getAllEvents();
  const cutoff = upcomingCutoff();
  const out: EventRow[] = [];
  for (const ev of all) {
    if (isSeries(ev)) {
      const next = nextSession(ev, cutoff);
      if (next) out.push(next);
    } else if (stillOn(ev, cutoff)) {
      out.push(ev);
    }
  }
  return out.sort(byStart);
});

/**
 * For the calendar grid: every session in the next `days` days, so a weekly
 * class shows on each date it runs. Lists use getUpcomingEvents instead.
 */
export const getCalendarSessions = cache(
  async (days = 49): Promise<EventRow[]> => {
    const all = await getAllEvents();
    const cutoff = upcomingCutoff();
    const horizon = Date.now() + days * 86_400_000;
    const out: EventRow[] = [];
    for (const ev of all) {
      for (const s of eventSessions(ev)) {
        const start = toDate(s.start_datetime_utc)?.getTime();
        if (start !== undefined && start <= horizon && stillOn(s, cutoff)) out.push(s);
      }
    }
    return out.sort(byStart);
  }
);

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
    const upcomingAll = await getUpcomingEvents();
    const upcomingIds = new Set(upcomingAll.map((e) => e.id));
    const inCity = all.filter((ev) => ev.city === cityName);
    return {
      // From the upcoming list, not the raw rows, so a series shows at its
      // next session rather than its first.
      upcoming: upcomingAll.filter((ev) => ev.city === cityName),
      past: inCity
        .filter((ev) => !upcomingIds.has(ev.id))
        .sort((a, b) =>
          (b.start_datetime_utc ?? "").localeCompare(a.start_datetime_utc ?? "")
        ),
    };
  }
);

export type RelatedEvents = {
  /** Upcoming events in the same city, which the city heading can claim. */
  sameCity: EventRow[];
  /** Upcoming events anywhere else, headed separately so the page stays honest. */
  elsewhere: EventRow[];
};

/**
 * Other upcoming events to cross-link from an event page, kept in two buckets.
 *
 * These used to be concatenated and sliced, which meant a city with only two
 * upcoming events had its list padded out to six from other cities under a
 * heading reading "More upcoming events in <city>". The buckets are returned
 * separately so the page can head each one for what it actually is.
 */
export async function getRelatedEvents(
  ev: EventRow,
  limit = 6
): Promise<RelatedEvents> {
  const upcoming = await getUpcomingEvents();
  const others = upcoming.filter((e) => e.id !== ev.id);

  const sameCity = ev.city
    ? others.filter((e) => e.city === ev.city).slice(0, limit)
    : [];
  const elsewhere = others
    .filter((e) => !ev.city || e.city !== ev.city)
    .slice(0, Math.max(0, limit - sameCity.length));

  return { sameCity, elsewhere };
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
  const pattern = describeRule(ev.recurrence_rule, ev.start_datetime_utc);
  const firstStart = ev.series_start_utc ?? ev.start_datetime_utc;
  const when = pattern
    ? `${pattern[0].toLowerCase()}${pattern.slice(1)}, from ${formatDateLong(firstStart)}`
    : formatDateLong(ev.start_datetime_utc);
  const time = formatTime(ev.start_datetime_utc);
  const where = eventLocationLine(ev);

  const bits = [
    `${eventTitle(ev)}${pattern ? ", " : " on "}${when}${time ? ` at ${time}` : ""}${
      where ? `, ${where}` : ""
    }.`,
    ev.organiser ? `Organised by ${ev.organiser}.` : "",
  ].filter(Boolean);

  const caption = ev.source_caption?.replace(/\s+/g, " ").trim();
  const base = bits.join(" ").replace(/\s+/g, " ").trim();
  const full = caption ? `${base} ${caption}` : base;
  return full.length > 300 ? `${full.slice(0, 297).trimEnd()}...` : full;
}

/**
 * Most posters give a start time but no finish, so a timed event with no
 * recorded end is assumed to run for two hours. The assumption lives here
 * so the event page, the JSON-LD and the Google Calendar link all agree,
 * and the page labels it as an estimate. Events with no start time (the
 * midnight convention) get no estimate: they are treated as all-day.
 */
export const ESTIMATED_DURATION_MS = 2 * 60 * 60 * 1000;

export type EventEnd = { iso: string; estimated: boolean };

/**
 * The longest a single occurrence can plausibly run (a weekend retreat or a
 * three-day conference). A recorded end further out than this is the end of
 * a recurring series ("every second Wednesday until 21 November"), not of
 * the event on this page.
 */
export const MAX_EVENT_SPAN_MS = 3 * 24 * 60 * 60 * 1000;

const ukClockFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: UK_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function ukParts(d: Date) {
  const p = Object.fromEntries(
    ukClockFormat.formatToParts(d).map((x) => [x.type, Number(x.value)])
  );
  return { y: p.year, mo: p.month, day: p.day, h: p.hour, mi: p.minute };
}

/** UK wall-clock time to an instant, correct either side of a clock change. */
function ukWallToDate(y: number, mo: number, day: number, h: number, mi: number): Date {
  const wallAsUtc = Date.UTC(y, mo - 1, day, h, mi);
  const seen = ukParts(new Date(wallAsUtc));
  const offset = Date.UTC(seen.y, seen.mo - 1, seen.day, seen.h, seen.mi) - wallAsUtc;
  return new Date(wallAsUtc - offset);
}

/**
 * The recorded end of THIS occurrence, or null if there isn't a usable one.
 * When the stored end is a series end, its clock time is moved onto the
 * start's day, so "19:30, ends 21:00 on 21 Nov" becomes 19:30 to 21:00.
 */
export function occurrenceEnd(ev: EventRow): Date | null {
  const start = toDate(ev.start_datetime_utc);
  const end = toDate(ev.end_datetime_utc);
  if (!start || !end || end.getTime() <= start.getTime()) return null;
  if (end.getTime() - start.getTime() <= MAX_EVENT_SPAN_MS) return end;

  const s = ukParts(start);
  const e = ukParts(end);
  const sameDay = ukWallToDate(s.y, s.mo, s.day, e.h, e.mi);
  return sameDay.getTime() > start.getTime() ? sameDay : null;
}

export function eventEnd(ev: EventRow): EventEnd | null {
  const start = toDate(ev.start_datetime_utc);
  if (!start) return null;

  const end = occurrenceEnd(ev);
  if (end) {
    return { iso: end.toISOString(), estimated: false };
  }
  if (!formatTime(ev.start_datetime_utc)) return null;

  return {
    iso: new Date(start.getTime() + ESTIMATED_DURATION_MS).toISOString(),
    estimated: true,
  };
}

const UK_STAMP = new Intl.DateTimeFormat("en-GB", {
  timeZone: UK_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

/** UK wall-clock as YYYYMMDDTHHMMSS, no zone (paired with ctz). */
function ukStamp(d: Date): string {
  const p = Object.fromEntries(UK_STAMP.formatToParts(d).map((x) => [x.type, x.value]));
  return `${p.year}${p.month}${p.day}T${p.hour}${p.minute}${p.second}`;
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
    toDate(eventEnd(ev)?.iso) ?? new Date(start.getTime() + ESTIMATED_DURATION_MS);

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: eventTitle(ev),
    dates: `${gcalStamp(start)}/${gcalStamp(end)}`,
    details: `${ev.source_caption?.trim() || ""}\n\n${SITE_URL}${eventUrl(ev)}`.trim(),
    location: eventLocationLine(ev) || "United Kingdom",
  });

  // A series goes in as a repeating calendar entry from this session to the
  // last. Times are then given as UK wall-clock with ctz, so the calendar
  // repeats it at 19:00 UK rather than at a fixed UTC time that would slip
  // an hour at the clock change.
  const rrule = isSeries(ev)
    ? calendarRrule(ev.series_start_utc ?? ev.start_datetime_utc, ev.recurrence_rule)
    : null;
  if (rrule) {
    params.set("dates", `${ukStamp(start)}/${ukStamp(end)}`);
    params.set("ctz", UK_TZ);
    params.set("recur", rrule);
  }

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
