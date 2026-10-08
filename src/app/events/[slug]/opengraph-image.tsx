import {
  eventLocationLine,
  eventTitle,
  formatDateLong,
  formatTime,
  getEventBySlug,
  nextSession,
} from "@/lib/events";
import { describeRule } from "@/lib/recurrence";
import { OG_SIZE, renderShareCard } from "@/lib/og-card";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "UK Islamic Events Calendar";

export const revalidate = 900;

/** The share card for one event. The design lives in lib/og-card.tsx. */
export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let event = null;
  try {
    event = await getEventBySlug(slug);
  } catch {
    event = null;
  }

  // A series reads "Every Wednesday" rather than whichever date it started.
  const pattern = event ? describeRule(event.recurrence_rule, event.start_datetime_utc) : null;
  const shown = event ? (nextSession(event) ?? event) : null;

  const card = {
    title: event ? eventTitle(event) : "UK Islamic Events Calendar",
    when: pattern ?? (shown ? formatDateLong(shown.start_datetime_utc) : ""),
    time: event ? formatTime(event.start_datetime_utc) : null,
    where: event ? eventLocationLine(event) : "",
  };

  try {
    return await renderShareCard({ ...card, poster: event?.poster_url ?? null });
  } catch {
    // A poster that fails to fetch must not break the share card entirely.
    return await renderShareCard({ ...card, poster: null });
  }
}
