import { eventSessions, getEventBySlug, icsCalendar, nextSession } from "@/lib/events";

export const revalidate = 900;

/**
 * /events/<slug>/calendar.ics: the event as a calendar file. On an iPhone this
 * opens the native "Add to Calendar" sheet; Outlook and desktop apps import it.
 * A series is given from its next session, matching the event page.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return new Response("Event not found", { status: 404 });

  const sessions = eventSessions(event);
  const shown = nextSession(event) ?? sessions[sessions.length - 1];
  const ics = icsCalendar(shown);
  if (!ics) return new Response("This event has no date yet", { status: 404 });

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="${slug.replace(/[^a-z0-9-]/gi, "")}.ics"`,
      "Cache-Control": "public, max-age=0, s-maxage=900",
    },
  });
}
