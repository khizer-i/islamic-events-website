import {
  MAX_IMAGE_CHARS,
  botConfigured,
  captchaConfigured,
  clientIp,
  forwardToBot,
  jsonError,
  verifyTurnstile,
} from "@/lib/submissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// A cold Render instance plus the model reading a poster can take most of a
// minute. 60 seconds is the most the Vercel Hobby plan allows.
export const maxDuration = 60;

/** Poster in, the fields the model read out, plus a token for /api/submissions. */
export async function POST(request: Request) {
  if (!botConfigured() || !captchaConfigured()) {
    return jsonError(503, "Uploads are not switched on yet.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "Invalid request.");
  }

  const { image, caption, turnstileToken, company } = (body ?? {}) as {
    image?: unknown;
    caption?: unknown;
    turnstileToken?: unknown;
    company?: unknown;
  };

  // Honeypot: a real person never fills this in.
  if (typeof company === "string" && company.trim() !== "") {
    return jsonError(400, "Please try again.");
  }

  if (typeof image !== "string" || image.length === 0) {
    return jsonError(400, "Please choose a poster image.");
  }
  if (image.length > MAX_IMAGE_CHARS) {
    return jsonError(413, "That image is too large. Please try a smaller one.");
  }

  const ip = clientIp(request);
  if (!(await verifyTurnstile(turnstileToken, ip))) {
    return jsonError(
      403,
      "We couldn't confirm you're not a robot. Please refresh the page and try again."
    );
  }

  return forwardToBot(
    "/web/extract",
    {
      image_base64: image,
      caption: typeof caption === "string" ? caption.slice(0, 3000) : "",
    },
    ip,
    55_000
  );
}
