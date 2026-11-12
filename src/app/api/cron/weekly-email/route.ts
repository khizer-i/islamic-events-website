import { timingSafeEqual } from "node:crypto";

import { CONTACT_EMAIL, SITE_URL } from "@/lib/brand";
import { getUpcomingEvents } from "@/lib/events";
import { sendBatch, resendConfigured, type OutgoingEmail } from "@/lib/resend";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { buildWeeklyEmail, emailCity, eventsThisWeek } from "@/lib/weekly-email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CRON_SECRET = process.env.CRON_SECRET || "";
const RESEND_GAP_DAYS = 5;

function authorised(request: Request): boolean {
  if (!CRON_SECRET) return process.env.NODE_ENV !== "production";
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const wanted = Buffer.from(`Bearer ${CRON_SECRET}`);
  return given.length === wanted.length && timingSafeEqual(given, wanted);
}

const json = (status: number, body: unknown) => Response.json(body, { status });

function unsubscribeUrl(token: string): string {
  return `${SITE_URL}/unsubscribe?t=${encodeURIComponent(token)}`;
}

/** The headers behind Gmail's and Apple Mail's own "Unsubscribe" button. */
function unsubscribeHeaders(token: string): Record<string, string> {
  return {
    "List-Unsubscribe": `<${SITE_URL}/api/unsubscribe?t=${encodeURIComponent(token)}>, <mailto:${CONTACT_EMAIL}?subject=Unsubscribe>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

/**
 * Weekly, from Vercel Cron (vercel.json): Thursday morning. Emails every
 * subscribed address what is on in the next seven days, their city first.
 *
 * With the cron secret as a Bearer token you can also:
 *   ?preview=London          return the email as a web page, send nothing
 *   ?test=you@example.com    send one copy to that address only
 */
export async function GET(request: Request) {
  if (!authorised(request)) return json(401, { error: "Unauthorised." });

  const params = new URL(request.url).searchParams;
  const thisWeek = eventsThisWeek(await getUpcomingEvents());

  const preview = params.get("preview");
  if (preview !== null) {
    const email = buildWeeklyEmail({
      city: emailCity(preview),
      thisWeek,
      unsubscribeUrl: unsubscribeUrl("preview"),
    });
    if (!email) return new Response("Nothing on in the next seven days.", { status: 200 });
    return new Response(email.html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  if (!resendConfigured()) return json(503, { error: "RESEND_API_KEY is not set." });

  const test = params.get("test");
  if (test) {
    const email = buildWeeklyEmail({
      city: emailCity(params.get("city")),
      thisWeek,
      unsubscribeUrl: unsubscribeUrl("test"),
    });
    if (!email) return json(200, { sent: 0, reason: "Nothing on in the next seven days." });
    await sendBatch(
      [{ to: test, ...email, subject: `[Test] ${email.subject}`, replyTo: CONTACT_EMAIL }],
      `weekly-test-${test}-${Date.now()}`
    );
    return json(200, { sent: 1, to: test });
  }

  if (!supabaseAdmin) return json(503, { error: "SUPABASE_SERVICE_ROLE_KEY is not set." });

  const cutoff = new Date(Date.now() - RESEND_GAP_DAYS * 86_400_000).toISOString();
  const { data: subscribers, error } = await supabaseAdmin
    .from("subscribers")
    .select("id, email, city, confirm_token")
    .is("unsubscribed_at", null)
    .or(`last_emailed_at.is.null,last_emailed_at.lt.${cutoff}`);
  if (error) return json(500, { error: error.message });

  const outgoing: { id: string; email: OutgoingEmail }[] = [];
  for (const s of subscribers ?? []) {
    const built = buildWeeklyEmail({
      city: emailCity(s.city),
      thisWeek,
      unsubscribeUrl: unsubscribeUrl(s.confirm_token),
    });
    if (!built) continue;
    outgoing.push({
      id: s.id,
      email: { to: s.email, ...built, headers: unsubscribeHeaders(s.confirm_token), replyTo: CONTACT_EMAIL },
    });
  }

  const week = new Date().toISOString().slice(0, 10);
  let sent = 0;
  for (let i = 0; i < outgoing.length; i += 100) {
    const chunk = outgoing.slice(i, i + 100);
    await sendBatch(chunk.map((o) => o.email), `weekly-${week}-${i}`);
    await supabaseAdmin
      .from("subscribers")
      .update({ last_emailed_at: new Date().toISOString() })
      .in("id", chunk.map((o) => o.id));
    sent += chunk.length;
  }

  return json(200, { subscribers: subscribers?.length ?? 0, sent, eventsThisWeek: thisWeek.length });
}
