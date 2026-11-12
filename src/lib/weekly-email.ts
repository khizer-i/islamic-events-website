/**
 * The weekly email: what is on in the next seven days, the subscriber's own
 * city first. Pure string building from events already loaded, so the same
 * code makes the real send and the preview.
 */

import { SITE_NAME, SITE_URL, WHATSAPP_CHANNEL_URL } from "./brand";
import {
  type EventRow,
  eventLocationLine,
  eventTitle,
  eventUrl,
  formatDateShort,
  formatTime,
} from "./event-format";
import { LONDON, londonArea } from "./london";

export const WINDOW_DAYS = 7;
const ELSEWHERE_LIMIT = 12;

/** A subscriber's chosen city as the site files it ("Ilford" is London). */
export function emailCity(city: string | null | undefined): string | null {
  const c = city?.trim();
  if (!c) return null;
  return londonArea(c) === null ? c : LONDON;
}

/** Upcoming events (next session for a series) that start within the window. */
export function eventsThisWeek(upcoming: EventRow[], now = Date.now()): EventRow[] {
  const horizon = now + WINDOW_DAYS * 86_400_000;
  return upcoming.filter((ev) => {
    const t = ev.start_datetime_utc ? Date.parse(ev.start_datetime_utc) : NaN;
    return !Number.isNaN(t) && t <= horizon;
  });
}

export type WeeklyEmail = { subject: string; html: string; text: string };

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const C = { paper: "#faf8f3", ink: "#14130f", muted: "#6b6558", rule: "#e9e4d8", accent: "#7b2e1e" };

function when(ev: EventRow): string {
  const time = formatTime(ev.start_datetime_utc);
  return time ? `${formatDateShort(ev.start_datetime_utc)}, ${time}` : formatDateShort(ev.start_datetime_utc);
}

function htmlEvent(ev: EventRow): string {
  const url = `${SITE_URL}${eventUrl(ev)}`;
  const where = eventLocationLine(ev);
  return `<tr><td style="padding:14px 0;border-top:1px solid ${C.rule}">
<div style="font-size:13px;color:${C.muted}">${esc(when(ev))}</div>
<a href="${esc(url)}" style="display:block;margin:3px 0;font-size:17px;font-weight:600;color:${C.ink};text-decoration:none">${esc(eventTitle(ev))}</a>
${where ? `<div style="font-size:14px;color:${C.muted}">${esc(where)}</div>` : ""}
</td></tr>`;
}

function htmlSection(heading: string, events: EventRow[], empty?: string): string {
  const body = events.length
    ? events.map(htmlEvent).join("")
    : `<tr><td style="padding:14px 0;border-top:1px solid ${C.rule};font-size:14px;color:${C.muted}">${esc(empty ?? "")}</td></tr>`;
  return `<tr><td style="padding:22px 0 4px;font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:${C.accent}">${esc(heading)}</td></tr>${body}`;
}

function textSection(heading: string, events: EventRow[], empty?: string): string {
  const lines = events.length
    ? events.map((ev) => {
        const where = eventLocationLine(ev);
        return `${when(ev)}\n${eventTitle(ev)}${where ? `\n${where}` : ""}\n${SITE_URL}${eventUrl(ev)}`;
      })
    : [empty ?? ""];
  return `${heading.toUpperCase()}\n\n${lines.join("\n\n")}`;
}

/**
 * The email for one subscriber, or null when there is nothing to send (no
 * events anywhere in the next week), in which case nobody is emailed.
 */
export function buildWeeklyEmail(opts: {
  city: string | null;
  thisWeek: EventRow[];
  unsubscribeUrl: string;
}): WeeklyEmail | null {
  const { city, thisWeek, unsubscribeUrl } = opts;
  if (thisWeek.length === 0) return null;

  const local = city ? thisWeek.filter((ev) => ev.city?.toLowerCase() === city.toLowerCase()) : [];
  const rest = city ? thisWeek.filter((ev) => ev.city?.toLowerCase() !== city.toLowerCase()) : thisWeek;
  const elsewhere = rest.slice(0, city ? ELSEWHERE_LIMIT : ELSEWHERE_LIMIT * 2);
  const more = rest.length - elsewhere.length;

  const subject = city
    ? local.length
      ? `This week in ${city}: ${local.length} event${local.length === 1 ? "" : "s"}`
      : `This week's Islamic events across the UK`
    : `This week's Islamic events: ${thisWeek.length} across the UK`;

  const sections: [string, EventRow[], string?][] = city
    ? [
        [`In ${city}`, local, `Nothing listed in ${city} for the next seven days yet.`],
        ...(elsewhere.length ? [["Elsewhere in the UK", elsewhere] as [string, EventRow[]]] : []),
      ]
    : [["Across the UK", elsewhere]];

  const moreLine = more > 0 ? `and ${more} more on the calendar.` : "";
  const calendarUrl = `${SITE_URL}/events`;
  const submitUrl = `${SITE_URL}/submit`;

  const html = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:${C.paper}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.paper}"><tr><td align="center" style="padding:28px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;font-family:Georgia,'Times New Roman',serif;color:${C.ink}">
<tr><td style="font-size:13px;color:${C.muted}">${esc(SITE_NAME)}</td></tr>
<tr><td style="padding:6px 0 0;font-size:26px;font-weight:600">The week ahead</td></tr>
<tr><td style="padding:6px 0 0;font-size:15px;color:${C.muted}">What's on over the next seven days${city ? `, starting with ${esc(city)}` : ""}.</td></tr>
${sections.map(([h, evs, empty]) => htmlSection(h, evs, empty)).join("")}
<tr><td style="padding:18px 0 0;border-top:1px solid ${C.rule};font-size:15px">
<a href="${calendarUrl}" style="color:${C.accent}">See the full calendar</a>${moreLine ? ` <span style="color:${C.muted}">${esc(moreLine)}</span>` : ""}
</td></tr>
<tr><td style="padding:10px 0 0;font-size:14px;color:${C.muted}">Know of an event that isn't listed? <a href="${submitUrl}" style="color:${C.accent}">Send us the poster</a>. You can also follow the <a href="${esc(WHATSAPP_CHANNEL_URL)}" style="color:${C.accent}">WhatsApp channel</a>.</td></tr>
<tr><td style="padding:28px 0 0;font-size:12px;line-height:1.6;color:${C.muted}">You're getting this because you signed up at islamiceventscalendar.co.uk. Details are read from organisers' posters, so please check with the organiser before travelling.<br><a href="${esc(unsubscribeUrl)}" style="color:${C.muted}">Unsubscribe</a></td></tr>
</table></td></tr></table></body></html>`;

  const text = [
    `${SITE_NAME}: the week ahead`,
    ...sections.map(([h, evs, empty]) => textSection(h, evs, empty)),
    `Full calendar: ${calendarUrl}${moreLine ? ` (${moreLine})` : ""}`,
    `Know of an event that isn't listed? Send us the poster: ${submitUrl}`,
    `You're getting this because you signed up at islamiceventscalendar.co.uk.\nUnsubscribe: ${unsubscribeUrl}`,
  ].join("\n\n");

  return { subject, html, text };
}
