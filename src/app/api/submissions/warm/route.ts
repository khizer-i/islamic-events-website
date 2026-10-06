import { NextResponse } from "next/server";

import { pingBot } from "@/lib/submissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 10;

/**
 * Called when the submit page opens. If the bot is on Render's free plan it
 * sleeps after a quiet spell, and this gets it waking while the visitor is
 * still choosing their poster rather than after they press the button.
 */
export async function GET() {
  const awake = await pingBot();
  return NextResponse.json({ ok: true, awake });
}
