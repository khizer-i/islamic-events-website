/**
 * Server-side helpers for the /submit poster upload. Used only by the
 * /api/submissions routes: the bot's address and secret never reach the
 * browser.
 *
 * The AI work happens in the bot (islamic-events-ai-bot on Render), so the
 * prompt, model and date handling exist in one place and the eval harness
 * covers what the website uses. These routes only check the captcha and pass
 * the request on.
 */
import { NextResponse } from "next/server";

const BOT_API_URL = (process.env.BOT_API_URL || "").replace(/\/+$/, "");
const BOT_API_SECRET = process.env.BOT_API_SECRET || "";
const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY || "";

/** Base64 of the resized JPEG. The browser keeps it well under this. */
export const MAX_IMAGE_CHARS = 8_000_000;

export function jsonError(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

export function botConfigured(): boolean {
  return Boolean(BOT_API_URL && BOT_API_SECRET);
}

/**
 * In production the captcha keys are required. Without them every upload is
 * refused with a plain "not switched on" message rather than a misleading
 * "are you a robot" one.
 */
export function captchaConfigured(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  return Boolean(TURNSTILE_SECRET_KEY && process.env.TURNSTILE_SITE_KEY);
}

export function clientIp(request: Request): string {
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

/**
 * Cloudflare Turnstile check. Without a secret key the check is skipped in
 * development only, so `npm run dev` works before the keys exist; in
 * production a missing key refuses every upload rather than letting them all
 * through unchecked.
 */
export async function verifyTurnstile(
  token: unknown,
  ip: string
): Promise<boolean> {
  if (!TURNSTILE_SECRET_KEY) {
    return process.env.NODE_ENV !== "production";
  }
  if (typeof token !== "string" || token.length === 0 || token.length > 4096) {
    return false;
  }

  try {
    const body = new URLSearchParams({
      secret: TURNSTILE_SECRET_KEY,
      response: token,
    });
    if (ip !== "unknown") body.set("remoteip", ip);

    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body, signal: AbortSignal.timeout(10_000) }
    );
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (err) {
    console.error("Turnstile verification failed:", err);
    return false;
  }
}

/** POST to the bot and hand its JSON reply straight back to the browser. */
export async function forwardToBot(
  path: string,
  body: unknown,
  ip: string,
  timeoutMs: number
) {
  try {
    const res = await fetch(`${BOT_API_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Site-Secret": BOT_API_SECRET,
        "X-Client-IP": ip,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });

    let data: unknown;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (res.status === 401) {
      console.error(
        `Bot ${path} refused the secret: BOT_API_SECRET on Vercel must match WEB_API_SECRET on Render`
      );
      return jsonError(503, "Submissions are not available right now.");
    }
    if (!data || typeof data !== "object") {
      console.error(`Bot ${path} returned ${res.status} with no JSON`);
      return jsonError(502, "Something went wrong. Please try again.");
    }
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    const timedOut = err instanceof Error && err.name === "TimeoutError";
    console.error(`Bot ${path} request failed:`, err);
    return jsonError(
      504,
      timedOut
        ? "That took too long. Please try again, it is usually quicker the second time."
        : "We couldn't reach the server. Please try again."
    );
  }
}

/** Wakes the bot if Render has put it to sleep. Never throws. */
export async function pingBot(): Promise<boolean> {
  if (!BOT_API_URL) return false;
  try {
    const res = await fetch(`${BOT_API_URL}/health`, {
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}
