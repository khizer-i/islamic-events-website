import 'server-only';

/**
 * Sending through Resend's HTTP API (no SDK needed). RESEND_API_KEY is set on
 * Vercel; EMAIL_FROM must be an address on a domain verified in Resend.
 */
const API = "https://api.resend.com/emails/batch";

export const EMAIL_FROM =
  process.env.EMAIL_FROM || "UK Islamic Events Calendar <events@islamiceventscalendar.co.uk>";

export type OutgoingEmail = {
  to: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
  replyTo?: string;
};

export function resendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/**
 * Sends up to 100 emails in one request. The idempotency key makes a retried
 * request (or a second cron run) a no-op on Resend's side for 24 hours.
 */
export async function sendBatch(emails: OutgoingEmail[], idempotencyKey: string): Promise<void> {
  if (emails.length === 0) return;
  if (emails.length > 100) throw new Error("Resend batches are limited to 100 emails.");
  const res = await fetch(API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(
      emails.map((e) => ({
        from: EMAIL_FROM,
        to: [e.to],
        subject: e.subject,
        html: e.html,
        text: e.text,
        headers: e.headers,
        reply_to: e.replyTo,
      }))
    ),
  });
  if (!res.ok) {
    throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
}
