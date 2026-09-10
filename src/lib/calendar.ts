import {
  HIJRI_MONTHS,
  UK_TZ,
  type EventRow,
  eventLocationLine,
  eventSlug,
  eventTitle,
  formatTime,
  toDate,
} from "./events";

/**
 * The slice of an event the calendar UI needs. The full row carries OCR text
 * and captions that would otherwise be serialised into the client payload for
 * every event on the page.
 */
export type CalendarEvent = {
  id: string;
  slug: string;
  title: string;
  startUtc: string | null;
  time: string | null;
  city: string | null;
  venue: string | null;
  location: string;
  organiser: string | null;
  posterUrl: string | null;
  categories: string[];
  isCourse: boolean;
};

/* ------------------------------------------------------------------ */
/* Day keys                                                            */
/*                                                                     */
/* Everything is keyed on "which UK calendar day is this instant on",  */
/* never on the browser's local day — a user in Dubai must see the     */
/* same grid as one in Dartford.                                       */
/* ------------------------------------------------------------------ */

const KEY_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: UK_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function ukDayKey(date: Date): string {
  return KEY_FORMAT.format(date);
}

/**
 * A day key back to a Date anchored at noon UTC. Noon keeps every arithmetic
 * step clear of the DST boundaries at 01:00, so adding days never slips one.
 */
export function dateFromDayKey(key: string): Date {
  return new Date(`${key}T12:00:00Z`);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

export type CalendarDay = {
  key: string;
  date: Date;
  dayOfMonth: number;
  monthShort: string;
  isFirstOfMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  hijriShort: string;
  events: CalendarEvent[];
};

export type CalendarWeek = {
  key: string;
  days: CalendarDay[];
};

const MONTH_SHORT = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  month: "short",
});

function hijriShort(date: Date): string {
  try {
    const parts = new Intl.DateTimeFormat("en-GB-u-ca-islamic-umalqura", {
      timeZone: "UTC",
      day: "numeric",
      month: "numeric",
    }).formatToParts(date);
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    const day = get("day").replace(/^0+/, "");
    const month = HIJRI_MONTHS[Number(get("month")) - 1];
    if (!day || !month) return "";
    // "Rabi al-Awwal" is too long for a day cell; take the distinguishing part.
    const short = month
      .replace("Rabi al-Awwal", "Rabi I")
      .replace("Rabi al-Thani", "Rabi II")
      .replace("Jumada al-Awwal", "Jumada I")
      .replace("Jumada al-Thani", "Jumada II")
      .replace("Dhu al-Qa'dah", "Dhu Qa'dah")
      .replace("Dhu al-Hijjah", "Dhu Hijjah");
    return `${day} ${short}`;
  } catch {
    return "";
  }
}

/** Events bucketed by the UK day they start on. */
export function bucketEventsByDay(
  events: CalendarEvent[]
): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();
  for (const ev of events) {
    const start = toDate(ev.startUtc);
    if (!start) continue;
    const key = ukDayKey(start);
    const bucket = map.get(key);
    if (bucket) bucket.push(ev);
    else map.set(key, [ev]);
  }
  for (const list of map.values()) {
    list.sort((a, b) => (a.startUtc ?? "").localeCompare(b.startUtc ?? ""));
  }
  return map;
}

/**
 * A rolling window of whole weeks starting from the Monday of the current
 * UK week. Deliberately not a calendar month: a sparse calendar shows an
 * empty month far too often, and a rolling window always opens on what is
 * actually next.
 */
export function buildRollingWeeks(
  events: CalendarEvent[],
  weekCount = 6,
  now: Date = new Date()
): CalendarWeek[] {
  const buckets = bucketEventsByDay(events);
  const todayKey = ukDayKey(now);
  const todayAnchor = dateFromDayKey(todayKey);

  // getUTCDay on a noon-UTC anchor gives the UK weekday. 0 = Sunday.
  const weekday = todayAnchor.getUTCDay();
  const backToMonday = weekday === 0 ? 6 : weekday - 1;
  const firstMonday = addDays(todayAnchor, -backToMonday);

  const weeks: CalendarWeek[] = [];

  for (let w = 0; w < weekCount; w++) {
    const days: CalendarDay[] = [];
    for (let d = 0; d < 7; d++) {
      const date = addDays(firstMonday, w * 7 + d);
      const key = ukDayKey(date);
      const dayOfMonth = date.getUTCDate();
      days.push({
        key,
        date,
        dayOfMonth,
        monthShort: MONTH_SHORT.format(date),
        isFirstOfMonth: dayOfMonth === 1,
        isToday: key === todayKey,
        isPast: key < todayKey,
        hijriShort: hijriShort(date),
        events: buckets.get(key) ?? [],
      });
    }
    weeks.push({ key: days[0].key, days });
  }

  return weeks;
}

export function weekRangeLabel(weeks: CalendarWeek[]): string {
  if (weeks.length === 0) return "";
  const first = weeks[0].days[0].date;
  const last = weeks[weeks.length - 1].days[6].date;
  const fmt = (d: Date, withYear: boolean) =>
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "UTC",
      day: "numeric",
      month: "long",
      ...(withYear ? { year: "numeric" } : {}),
    }).format(d);
  return `${fmt(first, false)} to ${fmt(last, true)}`;
}

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/*                                                                     */
/* The events table carries 200+ freeform tags the extraction model    */
/* invented, which is unusable as a filter. These fold them into a     */
/* small set in application code — no migration, and the raw tags are  */
/* still shown on the event page.                                      */
/* ------------------------------------------------------------------ */

export type Category = {
  id: string;
  label: string;
  patterns: string[];
};

export const CATEGORIES: Category[] = [
  {
    id: "lectures",
    label: "Lectures & talks",
    patterns: [
      "lecture", "talk", "seminar", "halaqa", "halaqah", "reminder",
      "khutbah", "dars", "speaker", "mawlid", "milad", "gathering",
    ],
  },
  {
    id: "courses",
    label: "Courses & classes",
    patterns: [
      "course", "class", "madrasah", "madrassa", "academy", "programme",
      "program", "gcse", "curriculum", "tuition", "workshop", "training",
      "arabic", "alimah", "hifz",
    ],
  },
  {
    id: "quran",
    label: "Qur'an & tafsir",
    patterns: [
      "quran", "qur'an", "tafsir", "tafseer", "tajwid", "tajweed",
      "recitation", "khatm", "qiraat",
    ],
  },
  {
    id: "family",
    label: "Family & children",
    patterns: ["kids", "children", "child", "family", "parenting", "toddler"],
  },
  {
    id: "sisters",
    label: "Sisters",
    patterns: ["sisters", "ladies", "women", "womens", "sister"],
  },
  {
    id: "youth",
    label: "Youth & students",
    patterns: ["youth", "student", "isoc", "university", "teen", "young"],
  },
  {
    id: "charity",
    label: "Charity & fundraising",
    patterns: [
      "charity", "fundrais", "appeal", "donation", "sadaqah", "zakat",
      "relief", "aid", "orphan",
    ],
  },
  {
    id: "conference",
    label: "Conferences",
    patterns: ["conference", "convention", "summit", "expo", "symposium"],
  },
  {
    id: "community",
    label: "Community & social",
    patterns: [
      "social", "brotherhood", "community", "dinner", "iftar", "bbq",
      "sport", "trip", "walk", "football", "networking",
    ],
  },
  {
    id: "online",
    label: "Online",
    patterns: ["online", "zoom", "webinar", "virtual", "livestream", "stream"],
  },
];

/** Every category an event plausibly belongs to. May be empty. */
export function categoriesForEvent(ev: EventRow): string[] {
  const haystack = [
    ...(ev.tags ?? []),
    ev.title ?? "",
  ]
    .join(" ")
    .toLowerCase();

  return CATEGORIES.filter((cat) =>
    cat.patterns.some((p) => haystack.includes(p))
  ).map((cat) => cat.id);
}

/** Categories present in a set of events, with counts, most common first. */
export function categoryCounts(
  events: CalendarEvent[]
): { id: string; label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const ev of events) {
    for (const id of ev.categories) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  return CATEGORIES.filter((c) => counts.has(c.id))
    .map((c) => ({ id: c.id, label: c.label, count: counts.get(c.id) ?? 0 }))
    .sort((a, b) => b.count - a.count);
}

/** Server-side: narrow a database row to what the calendar UI needs. */
export function toCalendarEvent(ev: EventRow): CalendarEvent {
  const categories = categoriesForEvent(ev);
  return {
    id: ev.id,
    slug: eventSlug(ev),
    title: eventTitle(ev),
    startUtc: ev.start_datetime_utc,
    time: formatTime(ev.start_datetime_utc),
    city: ev.city,
    venue: ev.venue_name,
    location: eventLocationLine(ev),
    organiser: ev.organiser,
    posterUrl: ev.poster_url,
    categories,
    isCourse: categories.includes("courses"),
  };
}
