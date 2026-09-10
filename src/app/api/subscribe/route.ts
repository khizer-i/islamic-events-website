import { NextResponse } from "next/server";

import { supabase } from "@/lib/supabaseClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Crude per-instance throttle. Serverless gives each instance its own memory,
 * so this is a speed bump rather than a real rate limiter — the honeypot and
 * the unique index do the heavier lifting.
 */
const recent = new Map<string, number>();
const WINDOW_MS = 60_000;

function throttled(key: string): boolean {
  const now = Date.now();
  for (const [k, t] of recent) {
    if (now - t > WINDOW_MS) recent.delete(k);
  }
  const last = recent.get(key);
  if (last && now - last < 3_000) return true;
  recent.set(key, now);
  return false;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { email, city, source, company } = (body ?? {}) as {
    email?: unknown;
    city?: unknown;
    source?: unknown;
    company?: unknown;
  };

  // Honeypot filled in: accept silently so the bot learns nothing.
  if (typeof company === "string" && company.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  if (typeof email !== "string") {
    return NextResponse.json({ error: "Enter an email address." }, { status: 400 });
  }

  const clean = email.trim().toLowerCase();

  if (clean.length > 254 || !EMAIL_RE.test(clean)) {
    return NextResponse.json(
      { error: "That doesn't look like an email address." },
      { status: 400 }
    );
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (throttled(ip)) {
    return NextResponse.json(
      { error: "One moment, then try again." },
      { status: 429 }
    );
  }

  const record = {
    email: clean,
    city:
      typeof city === "string" && city.trim() !== "" ? city.trim() : null,
    source:
      typeof source === "string" && source.trim() !== ""
        ? source.trim().slice(0, 60)
        : "site",
  };

  const { error } = await supabase.from("subscribers").insert(record);

  if (error) {
    // 23505 = unique violation. Already subscribed is a success from the
    // subscriber's point of view, and saying so avoids leaking who is on
    // the list.
    if (error.code === "23505") {
      return NextResponse.json({ ok: true });
    }
    console.error("Subscribe failed:", error.message);
    return NextResponse.json(
      { error: "Could not add you right now. Please try again later." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
