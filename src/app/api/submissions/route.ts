import { NextResponse } from "next/server";

import {
  MAX_IMAGE_CHARS,
  botConfigured,
  clientIp,
  forwardToBot,
  jsonError,
} from "@/lib/submissions";
import { cleanRepeat } from "@/lib/repeat-form";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const FIELD_KEYS = [
  "title",
  "organiser",
  "venue_name",
  "city",
  "start_date",
  "start_time",
  "end_date",
  "end_time",
] as const;

/**
 * The checked fields go to the bot, which saves ONE row with status
 * "pending" and sends it to Telegram for approval. No captcha here: the bot
 * only accepts the signed token it issued after a captcha-checked read.
 */
export async function POST(request: Request) {
  if (!botConfigured()) {
    return jsonError(503, "Submissions are not switched on yet.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "Invalid request.");
  }

  const { token, image, fields, repeat, description, company } = (body ?? {}) as {
    token?: unknown;
    image?: unknown;
    fields?: unknown;
    repeat?: unknown;
    description?: unknown;
    company?: unknown;
  };

  // Honeypot filled in: report success so the bot learns nothing.
  if (typeof company === "string" && company.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  if (typeof token !== "string" || token.length === 0) {
    return jsonError(400, "This form has expired. Please upload the poster again.");
  }
  if (typeof image !== "string" || image.length === 0 || image.length > MAX_IMAGE_CHARS) {
    return jsonError(400, "The poster image is missing. Please upload it again.");
  }

  const raw = (fields && typeof fields === "object" ? fields : {}) as Record<
    string,
    unknown
  >;
  const clean: Record<string, string> = {};
  for (const key of FIELD_KEYS) {
    const v = raw[key];
    clean[key] = typeof v === "string" ? v.trim().slice(0, 200) : "";
  }

  if (!clean.title) return jsonError(400, "Please give the event a title.");
  if (!clean.start_date) return jsonError(400, "Please give the date of the event.");

  return forwardToBot(
    "/web/submit",
    {
      token,
      image_base64: image,
      fields: clean,
      // What the submitter chose under "Repeats". Left out entirely when the
      // form did not send one, so the bot falls back to what it read.
      ...(repeat && typeof repeat === "object" ? { repeat: cleanRepeat(repeat) } : {}),
      description:
        typeof description === "string" ? description.slice(0, 3000) : "",
    },
    clientIp(request),
    25_000
  );
}
