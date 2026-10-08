/**
 * The "Repeats" part of the submit form, shared by the form (client) and
 * /api/submissions (server). The bot turns it into the stored rule
 * (recurrence.from_form in the bot repo) and is the one that validates it
 * properly; this only makes sure nothing odd is passed along.
 */

export const FREQUENCIES = ["none", "daily", "weekly", "fortnightly", "monthly"] as const;
export type Frequency = (typeof FREQUENCIES)[number];

export const DAY_CODES = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"] as const;
export type DayCode = (typeof DAY_CODES)[number];

/** 1 to 4 = first to fourth, -1 = last. */
export const WEEK_POSITIONS = [1, 2, 3, 4, -1] as const;

export type Repeat = {
  frequency: Frequency;
  days: DayCode[];
  week_of_month: number | null;
  /** YYYY-MM-DD, or "" */
  until: string;
  count: number | null;
};

export const NO_REPEAT: Repeat = {
  frequency: "none",
  days: [],
  week_of_month: null,
  until: "",
  count: null,
};

export const MAX_SESSIONS = 200;

/** Anything (the bot's pre-fill, or a request body) to a well-formed Repeat. */
export function cleanRepeat(input: unknown): Repeat {
  if (!input || typeof input !== "object") return NO_REPEAT;
  const r = input as Record<string, unknown>;

  const frequency = FREQUENCIES.includes(r.frequency as Frequency)
    ? (r.frequency as Frequency)
    : "none";

  const days = Array.isArray(r.days)
    ? DAY_CODES.filter((code) => (r.days as unknown[]).includes(code))
    : [];

  const wom = Number(r.week_of_month);
  const week_of_month = (WEEK_POSITIONS as readonly number[]).includes(wom) ? wom : null;

  const until =
    typeof r.until === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.until) ? r.until : "";

  const n = Number(r.count);
  const count = Number.isInteger(n) && n >= 2 ? Math.min(n, MAX_SESSIONS) : null;

  return { frequency, days, week_of_month, until, count };
}

/** Monday = "MO" ... for a YYYY-MM-DD date. */
export function weekdayCode(isoDate: string): DayCode | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null;
  const d = new Date(`${isoDate}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return DAY_CODES[(d.getUTCDay() + 6) % 7];
}

/** Which of that weekday in its month a date is: 1 to 4, or -1 for the last. */
export function weekPosition(isoDate: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null;
  const d = new Date(`${isoDate}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  const nextWeek = new Date(d.getTime() + 7 * 86_400_000);
  if (nextWeek.getUTCMonth() !== d.getUTCMonth()) return -1;
  return Math.ceil(d.getUTCDate() / 7);
}
