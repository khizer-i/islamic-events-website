import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST only, so a link scanner opening the email cannot unsubscribe anyone.
 * Two callers: Gmail/Apple Mail's one-click button (List-Unsubscribe-Post,
 * token in the query string), and the button on /unsubscribe (token in the
 * form). Either way the row is kept and marked, never deleted.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  let token = url.searchParams.get("t") ?? "";
  const fromForm = (request.headers.get("content-type") ?? "").includes("form");
  if (!token && fromForm) {
    token = String((await request.formData()).get("t") ?? "");
  }

  if (!UUID.test(token) || !supabaseAdmin) {
    return fromForm
      ? Response.redirect(new URL("/unsubscribe?error=1", url), 303)
      : new Response("Unknown or missing link.", { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("subscribers")
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq("confirm_token", token)
    .is("unsubscribed_at", null);

  if (error) {
    console.error("Unsubscribe failed:", error.message);
    return fromForm
      ? Response.redirect(new URL("/unsubscribe?error=1", url), 303)
      : new Response("Could not unsubscribe right now.", { status: 500 });
  }

  return fromForm
    ? Response.redirect(new URL("/unsubscribe?done=1", url), 303)
    : new Response("Unsubscribed.", { status: 200 });
}
