import { timingSafeEqual } from "node:crypto";

import { botConfigured, forwardToBot, jsonError } from "@/lib/submissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// The bot may be asleep on Render's free plan and take ~50s to wake.
export const maxDuration = 60;

const CRON_SECRET = process.env.CRON_SECRET || "";

function authorised(request: Request): boolean {
  if (!CRON_SECRET) {
    // Without a secret anyone could trigger it, so only allow that locally.
    return process.env.NODE_ENV !== "production";
  }
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const wanted = Buffer.from(`Bearer ${CRON_SECRET}`);
  return given.length === wanted.length && timingSafeEqual(given, wanted);
}

/**
 * Daily, from Vercel Cron (vercel.json). Asks the bot to send the moderator
 * a "still running?" message for each repeating event that was listed with
 * no end date and is a week from dropping off the site. Vercel sends
 * CRON_SECRET as a Bearer token when that variable is set on the project.
 */
export async function GET(request: Request) {
  if (!authorised(request)) return jsonError(401, "Unauthorised.");
  if (!botConfigured()) return jsonError(503, "The bot is not configured.");
  return forwardToBot("/web/series-check", {}, "vercel-cron", 55_000);
}
