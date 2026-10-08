/**
 * Repeating events: works out the dates of a series from its rule.
 *
 * The bot stores ONE row per poster, with the first session as
 * start_datetime_utc and, for a series, an iCalendar RRULE such as
 *   FREQ=WEEKLY;BYDAY=WE;UNTIL=20270728T235959
 * The rules are built by recurrence.py in the bot repo, which only ever
 * writes this subset: DAILY, WEEKLY with BYDAY and INTERVAL, MONTHLY with an
 * nth weekday (BYDAY=-1TH), ended by COUNT or by UNTIL (a UK local time).
 * Anything else is treated as "does not repeat" rather than guessed at.
 *
 * Every session keeps the poster's UK wall-clock start time, so a 19:00
 * class is 19:00 either side of the clock change. These dates are checked
 * against the bot's (python-dateutil) in the test that came with this file;
 * if the two ever disagree, the bot's Telegram draft and the site would
 * describe different dates.
 */
import { UK_TZ } from "./hijri";

const CODES = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"] as const;
const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const ORDINAL: Record<string, string> = {
  "1": "first",
  "2": "second",
  "3": "third",
  "4": "fourth",
  "-1": "last",
};

const DAY_MS = 86_400_000;
/** Matches the bot: nothing is listed more than ~3 years out. */
const MAX_SPAN_DAYS = 3 * 366;
const MAX_DATES = 400;

export type ParsedRule = {
  freq: "DAILY" | "WEEKLY" | "MONTHLY";
  interval: number;
  /** 0 = Monday ... 6 = Sunday; nth only for MONTHLY. */
  byDay: { day: number; nth: number | null }[];
  count: number | null;
  /** The last day, YYYY-MM-DD, UK local. */
  until: string | null;
};

export function parseRule(rule: string | null | undefined): ParsedRule | null {
  if (!rule) return null;
  const parts: Record<string, string> = {};
  for (const piece of rule.split(";")) {
    const [k, v] = piece.split("=");
    if (k && v) parts[k.trim().toUpperCase()] = v.trim().toUpperCase();
  }

  const freq = parts.FREQ;
  if (freq !== "DAILY" && freq !== "WEEKLY" && freq !== "MONTHLY") return null;

  const byDay: ParsedRule["byDay"] = [];
  for (const token of (parts.BYDAY ?? "").split(",").filter(Boolean)) {
    const m = /^([+-]?\d)?(MO|TU|WE|TH|FR|SA|SU)$/.exec(token);
    if (!m) return null;
    byDay.push({
      day: CODES.indexOf(m[2] as (typeof CODES)[number]),
      nth: m[1] ? parseInt(m[1], 10) : null,
    });
  }
  if (freq === "MONTHLY" && (byDay.length !== 1 || byDay[0].nth === null)) {
    return null;
  }

  const count = parts.COUNT ? parseInt(parts.COUNT, 10) : null;
  const u = parts.UNTIL;
  const until =
    u && /^\d{8}/.test(u) ? `${u.slice(0, 4)}-${u.slice(4, 6)}-${u.slice(6, 8)}` : null;

  return {
    freq,
    interval: Math.max(1, parseInt(parts.INTERVAL ?? "1", 10) || 1),
    byDay,
    count: count && count > 0 ? count : null,
    until,
  };
}

/* ------------------------------------------------------------------ */
/* UK wall-clock arithmetic                                            */
/* ------------------------------------------------------------------ */

const PARTS = new Intl.DateTimeFormat("en-GB", {
  timeZone: UK_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

type Wall = { y: number; m: number; d: number; hh: number; mm: number };

function wallOf(instant: number): Wall {
  const p = Object.fromEntries(
    PARTS.formatToParts(new Date(instant)).map((x) => [x.type, x.value])
  );
  return {
    y: Number(p.year),
    m: Number(p.month),
    d: Number(p.day),
    hh: Number(p.hour),
    mm: Number(p.minute),
  };
}

/** Days since 1970-01-01 for a calendar date. */
const dayNumber = (y: number, m: number, d: number) => Date.UTC(y, m - 1, d) / DAY_MS;
/** 0 = Monday ... 6 = Sunday. */
const weekdayOf = (dn: number) => (new Date(dn * DAY_MS).getUTCDay() + 6) % 7;

/** UK offset from UTC at an instant, in ms (0 in winter, 3,600,000 in summer). */
function ukOffset(instant: number): number {
  const w = wallOf(instant);
  return Date.UTC(w.y, w.m - 1, w.d, w.hh, w.mm) - Math.floor(instant / 60_000) * 60_000;
}

/** A UK wall-clock time on a given day, as a UTC instant. */
function ukWallToInstant(dn: number, hh: number, mm: number): number {
  const asIfUtc = dn * DAY_MS + (hh * 60 + mm) * 60_000;
  const first = asIfUtc - ukOffset(asIfUtc);
  return asIfUtc - ukOffset(first);
}

/** The nth (1..4, or -1 for last) given weekday of a month, as a day number. */
function nthWeekday(y: number, m: number, day: number, nth: number): number | null {
  if (nth > 0) {
    const first = dayNumber(y, m, 1);
    const dn = first + ((day - weekdayOf(first) + 7) % 7) + (nth - 1) * 7;
    const check = new Date(dn * DAY_MS);
    return check.getUTCMonth() + 1 === m ? dn : null;
  }
  const last = dayNumber(y, m + 1, 1) - 1; // Date.UTC rolls month 13 over
  return last - ((weekdayOf(last) - day + 7) % 7);
}

/* ------------------------------------------------------------------ */
/* Dates                                                               */
/* ------------------------------------------------------------------ */

/**
 * Start instants (ms since epoch) of every session, first one included even
 * if it falls outside the rule (the poster's own start date wins), in order.
 * A one-off, or an unreadable rule, gives just the start.
 */
export function occurrenceInstants(
  startIso: string | null | undefined,
  rule: string | null | undefined
): number[] {
  if (!startIso) return [];
  const start = new Date(startIso).getTime();
  if (Number.isNaN(start)) return [];
  const parsed = parseRule(rule);
  if (!parsed) return [start];

  const w = wallOf(start);
  const startDn = dayNumber(w.y, w.m, w.d);
  // Same limits as the bot: an UNTIL is capped at ~3 years from the start,
  // a COUNT at its number of sessions (the bot caps COUNT at 200), and the
  // far horizon below only guards against a malformed rule.
  let lastDn = startDn + 10 * 366;
  if (parsed.until) {
    const [y, m, d] = parsed.until.split("-").map(Number);
    lastDn = Math.min(startDn + MAX_SPAN_DAYS, dayNumber(y, m, d));
  }
  const limit = Math.min(parsed.count ?? MAX_DATES, MAX_DATES);

  const days: number[] = [];
  if (parsed.freq === "DAILY") {
    for (let dn = startDn; dn <= lastDn && days.length < limit; dn += parsed.interval) {
      days.push(dn);
    }
  } else if (parsed.freq === "WEEKLY") {
    const wanted = new Set(
      parsed.byDay.length ? parsed.byDay.map((b) => b.day) : [weekdayOf(startDn)]
    );
    const weekStart = startDn - weekdayOf(startDn); // weeks run Monday to Sunday
    for (let dn = startDn; dn <= lastDn && days.length < limit; dn++) {
      const week = Math.floor((dn - weekStart) / 7);
      if (week % parsed.interval === 0 && wanted.has(weekdayOf(dn))) days.push(dn);
    }
  } else {
    const { day, nth } = parsed.byDay[0];
    let y = w.y;
    let m = w.m;
    while (days.length < limit && dayNumber(y, m, 1) <= lastDn) {
      const dn = nthWeekday(y, m, day, nth as number);
      if (dn !== null && dn >= startDn && dn <= lastDn) days.push(dn);
      m += parsed.interval;
      while (m > 12) {
        m -= 12;
        y += 1;
      }
    }
  }

  const instants = days.map((dn) => ukWallToInstant(dn, w.hh, w.mm));
  if (!instants.includes(start)) instants.unshift(start);
  return Array.from(new Set(instants)).sort((a, b) => a - b);
}

/* ------------------------------------------------------------------ */
/* Words                                                               */
/* ------------------------------------------------------------------ */

function listDays(days: number[]): string {
  const names = days.map((d) => DAY_NAMES[d]);
  return names.length <= 1
    ? names.join("")
    : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/** "Every Wednesday", "Every other Friday", "The last Thursday of every month". */
export function describeRule(
  rule: string | null | undefined,
  startIso?: string | null
): string | null {
  const p = parseRule(rule);
  if (!p) return null;
  if (p.freq === "DAILY") return "Every day";
  if (p.freq === "MONTHLY") {
    const { day, nth } = p.byDay[0];
    return `The ${ORDINAL[String(nth)] ?? nth} ${DAY_NAMES[day]} of every month`;
  }
  let days = p.byDay.map((b) => b.day);
  if (!days.length && startIso) {
    const w = wallOf(new Date(startIso).getTime());
    days = [weekdayOf(dayNumber(w.y, w.m, w.d))];
  }
  return `${p.interval === 2 ? "Every other" : "Every"} ${listDays(days)}`;
}

/** One word for cards and lists: "Weekly", "Fortnightly", "Daily", "Monthly". */
export function repeatLabel(rule: string | null | undefined): string | null {
  const p = parseRule(rule);
  if (!p) return null;
  if (p.freq === "DAILY") return "Daily";
  if (p.freq === "MONTHLY") return "Monthly";
  return p.interval === 2 ? "Fortnightly" : "Weekly";
}

/**
 * The series' rule for a Google Calendar link, with UNTIL as a UTC instant
 * (what calendar apps expect) taken from the actual last session, so COUNT
 * and UNTIL rules both end on the right day.
 */
export function calendarRrule(
  startIso: string | null | undefined,
  rule: string | null | undefined
): string | null {
  const p = parseRule(rule);
  const dates = occurrenceInstants(startIso, rule);
  if (!p || dates.length < 2) return null;
  const last = dates[dates.length - 1];
  const until = new Date(last + 60_000)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
  const parts = [`FREQ=${p.freq}`];
  if (p.interval > 1) parts.push(`INTERVAL=${p.interval}`);
  if (p.byDay.length) {
    parts.push(`BYDAY=${p.byDay.map((b) => `${b.nth ?? ""}${CODES[b.day]}`).join(",")}`);
  }
  parts.push(`UNTIL=${until}`);
  return `RRULE:${parts.join(";")}`;
}
