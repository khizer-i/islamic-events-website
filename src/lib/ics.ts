/**
 * iCalendar (.ics) files, for "Add to calendar" outside Google.
 *
 * Opening a text/calendar response on an iPhone brings up the native
 * "Add to Calendar" sheet; Outlook and desktop calendars import the same file.
 * Pure string building, no data access, so it can be tested on its own.
 */

/** Europe/London rules, so a TZID'd repeating event keeps 19:00 UK across the clock change. */
const VTIMEZONE_LONDON = [
  "BEGIN:VTIMEZONE",
  "TZID:Europe/London",
  "BEGIN:DAYLIGHT",
  "TZOFFSETFROM:+0000",
  "TZOFFSETTO:+0100",
  "TZNAME:BST",
  "DTSTART:19700329T010000",
  "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
  "END:DAYLIGHT",
  "BEGIN:STANDARD",
  "TZOFFSETFROM:+0100",
  "TZOFFSETTO:+0000",
  "TZNAME:GMT",
  "DTSTART:19701025T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
  "END:STANDARD",
  "END:VTIMEZONE",
];

/** RFC 5545 TEXT escaping. */
export function icsEscape(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

/** Fold to 75 octets per line, never splitting a UTF-8 character. */
export function icsFold(line: string): string {
  const enc = new TextEncoder();
  const out: string[] = [];
  let current = "";
  let bytes = 0;
  for (const ch of line) {
    const size = enc.encode(ch).length;
    const limit = out.length === 0 ? 75 : 74; // continuation lines start with a space
    if (bytes + size > limit) {
      out.push(current);
      current = "";
      bytes = 0;
    }
    current += ch;
    bytes += size;
  }
  out.push(current);
  return out.join("\r\n ");
}

/** UTC as YYYYMMDDTHHMMSSZ. */
export function icsUtc(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export type IcsEvent = {
  uid: string;
  title: string;
  description?: string;
  location?: string;
  url?: string;
  start: Date;
  end: Date;
  /**
   * For a repeating event: the RRULE line ("RRULE:FREQ=...") plus a function
   * giving UK wall-clock stamps (YYYYMMDDTHHMMSS). Times are then written with
   * TZID=Europe/London so the series stays at the same UK time all year.
   */
  repeat?: { rrule: string; ukStamp: (d: Date) => string } | null;
  now?: Date;
};

export function buildIcs(ev: IcsEvent): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Islamic Events Calendar//islamiceventscalendar.co.uk//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...(ev.repeat ? VTIMEZONE_LONDON : []),
    "BEGIN:VEVENT",
    `UID:${ev.uid}`,
    `DTSTAMP:${icsUtc(ev.now ?? new Date())}`,
  ];
  if (ev.repeat) {
    lines.push(`DTSTART;TZID=Europe/London:${ev.repeat.ukStamp(ev.start)}`);
    lines.push(`DTEND;TZID=Europe/London:${ev.repeat.ukStamp(ev.end)}`);
    lines.push(ev.repeat.rrule);
  } else {
    lines.push(`DTSTART:${icsUtc(ev.start)}`);
    lines.push(`DTEND:${icsUtc(ev.end)}`);
  }
  lines.push(`SUMMARY:${icsEscape(ev.title)}`);
  if (ev.location) lines.push(`LOCATION:${icsEscape(ev.location)}`);
  if (ev.description) lines.push(`DESCRIPTION:${icsEscape(ev.description)}`);
  if (ev.url) lines.push(`URL:${ev.url}`);
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.map(icsFold).join("\r\n") + "\r\n";
}
