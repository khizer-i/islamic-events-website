import { eventUrl, getAllEvents } from "@/lib/events";

export const dynamic = "force-dynamic";

/**
 * /e/<event id>: a stable short link that redirects to the event's page.
 * The bot uses it in the "your event is live" email, so the rules for
 * building an event's slug live only here on the site. An unknown or
 * unpublished id goes to the upcoming events list rather than a 404.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = (await getAllEvents()).find((ev) => ev.id === id);
  return Response.redirect(new URL(event ? eventUrl(event) : "/events", request.url), 302);
}
