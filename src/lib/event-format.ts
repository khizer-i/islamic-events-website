/**
 * The pure parts of an event: its type, slug, URL and the date formatting.
 * Kept apart from events.ts, which loads events from Supabase, so that the
 * calendar (a client component) can use these without pulling the Supabase
 * client into every visitor's browser. events.ts re-exports all of it, so
 * server code keeps importing from "@/lib/events".
 */
import { hijriLong, UK_TZ } from "./hijri";

export type EventRow = {
  id: string;
  created_at?: string | null;
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
