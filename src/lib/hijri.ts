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

/* ------------------------------------------------------------------ */
/* Why this file exists                                                */
/*                                                                     */
/* Intl's "islamic-umalqura" calendar is the Saudi civil calendar. It  */
/* starts a month when the moon sets after the sun at Mecca, whether   */
/* or not anyone could actually see the crescent, so it routinely runs */
/* one or two days ahead of what UK mosques announce. On 14 Sep 2026   */
/* it says 3 Rabi al-Thani; the UK announcement was 2. A fixed offset  */
/* does not fix this, because the gap changes from month to month.     */
/*                                                                     */
/* So UK month starts are tabulated below, from the announcements      */
/* themselves, and Intl is kept only as a fallback for dates the table */
/* does not cover.                                                     */
/*                                                                     */
/* To extend: add one row per announcement, ascending, and nothing     */
/* else needs to change.                                               */
/* Source: Wifaqul Ulama (Britain) — UK sighting primary, Morocco      */
/* secondary. https://www.wifaqululama.co.uk/moonsighting/             */
/* ------------------------------------------------------------------ */

type MonthStart = {
  /** First Gregorian day of the Hijri month, as a UK calendar day. */
  gregorian: string;
  /** 1 = Muharram ... 12 = Dhu al-Hijjah. */
  month: number;
  year: number;
};

export const UK_HIJRI_MONTH_STARTS: MonthStart[] = [
  { gregorian: "2025-06-27", month: 1, year: 1447 },
  { gregorian: "2025-07-26", month: 2, year: 1447 },
  { gregorian: "2025-08-25", month: 3, year: 1447 },
  { gregorian: "2025-09-24", month: 4, year: 1447 },
  { gregorian: "2025-10-23", month: 5, year: 1447 },
  { gregorian: "2025-11-22", month: 6, year: 1447 },
  { gregorian: "2025-12-22", month: 7, year: 1447 },
  { gregorian: "2026-01-21", month: 8, year: 1447 },
  { gregorian: "2026-02-19", month: 9, year: 1447 },
  { gregorian: "2026-03-20", month: 10, year: 1447 },
  { gregorian: "2026-04-19", month: 11, year: 1447 },
  { gregorian: "2026-05-18", month: 12, year: 1447 },
  { gregorian: "2026-06-17", month: 1, year: 1448 },
  { gregorian: "2026-07-16", month: 2, year: 1448 },
  { gregorian: "2026-08-14", month: 3, year: 1448 },
  { gregorian: "2026-09-13", month: 4, year: 1448 },
];

/**
 * A Hijri month never runs past 30 days, so a date more than 29 days after
 * the last tabulated start is beyond what the announcements cover and falls
 * back to Intl rather than being extrapolated.
 */
const MAX_MONTH_LENGTH = 30;

const UK_DAY_KEY = new Intl.DateTimeFormat("en-CA", {
  timeZone: UK_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Which UK calendar day an instant falls on, as "YYYY-MM-DD". */
function ukDayKeyLocal(date: Date): string {
  return UK_DAY_KEY.format(date);
}

/** Whole days between two "YYYY-MM-DD" keys, anchored at noon to dodge DST. */
function daysBetween(from: string, to: string): number {
  const a = Date.parse(`${from}T12:00:00Z`);
  const b = Date.parse(`${to}T12:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}

export type HijriDate = {
  day: number;
  month: number;
  year: number;
  monthName: string;
  /** True when the date came from the UK table rather than the Intl fallback. */
  sighted: boolean;
};

/** The tabulated UK Hijri date, or null when the table does not reach it. */
function fromTable(date: Date): HijriDate | null {
  const key = ukDayKeyLocal(date);

  let match: MonthStart | null = null;
  for (const entry of UK_HIJRI_MONTH_STARTS) {
    if (entry.gregorian > key) break;
    match = entry;
  }
  if (!match) return null;

  const day = daysBetween(match.gregorian, key) + 1;
  if (day < 1 || day > MAX_MONTH_LENGTH) return null;

  return {
    day,
    month: match.month,
    year: match.year,
    monthName: HIJRI_MONTHS[match.month - 1],
    sighted: true,
  };
}

const INTL_HIJRI = new Intl.DateTimeFormat("en-GB-u-ca-islamic-umalqura", {
  timeZone: UK_TZ,
  day: "numeric",
  month: "numeric",
  year: "numeric",
});

function fromIntl(date: Date): HijriDate | null {
  try {
    const parts = INTL_HIJRI.formatToParts(date);
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";

    const day = Number(get("day"));
    const month = Number(get("month"));
    const year = Number(get("year").replace(/[^0-9]/g, ""));
    const monthName = HIJRI_MONTHS[month - 1];
    if (!day || !month || !year || !monthName) return null;

    return { day, month, year, monthName, sighted: false };
  } catch {
    return null;
  }
}

/**
 * Umm al-Qura, shifted so it lines up with the nearest end of the UK table.
 *
 * Reading Umm al-Qura raw outside the table leaves a visible seam: the table
 * ends on 30 Rabi al-Thani and Intl picks up on 2 Jumada al-Ula, skipping the
 * 1st. Anchoring on the offset at the last known month start removes the seam
 * and assumes the next month follows Umm al-Qura by the same margin, which is
 * the usual UK pattern. It is still a guess, so these days come back with
 * sighted: false and should be corrected by adding the announcement to the
 * table above.
 */
let shiftCache: { first: number; last: number } | null = null;

function anchorShift(): { first: number; last: number } {
  if (shiftCache) return shiftCache;
  const shiftAt = (entry: MonthStart) => {
    const intl = fromIntl(new Date(`${entry.gregorian}T12:00:00Z`));
    return intl ? 1 - intl.day : 0;
  };
  shiftCache = {
    first: shiftAt(UK_HIJRI_MONTH_STARTS[0]),
    last: shiftAt(UK_HIJRI_MONTH_STARTS[UK_HIJRI_MONTH_STARTS.length - 1]),
  };
  return shiftCache;
}

function fromAnchoredIntl(date: Date): HijriDate | null {
  const { first, last } = anchorShift();
  const key = ukDayKeyLocal(date);
  const shift = key < UK_HIJRI_MONTH_STARTS[0].gregorian ? first : last;
  return fromIntl(new Date(date.getTime() + shift * 86_400_000));
}

export function toHijri(date: Date): HijriDate | null {
  return fromTable(date) ?? fromAnchoredIntl(date);
}

/** "Rabi al-Awwal" is too long for a day cell; keep the distinguishing part. */
const SHORT_MONTHS = [
  "Muharram",
  "Safar",
  "Rabi I",
  "Rabi II",
  "Jumada I",
  "Jumada II",
  "Rajab",
  "Sha'ban",
  "Ramadan",
  "Shawwal",
  "Dhu Qa'dah",
  "Dhu Hijjah",
];

/** "2 Rabi II" — short enough for a day cell. */
export function hijriShort(date: Date): string {
  const h = toHijri(date);
  if (!h) return "";
  return `${h.day} ${SHORT_MONTHS[h.month - 1]}`;
}

/** "2 Rabi al-Thani 1448 AH" — the long form used on event pages. */
export function hijriLong(date: Date): string | null {
  const h = toHijri(date);
  if (!h) return null;
  return `${h.day} ${h.monthName} ${h.year} AH`;
}
