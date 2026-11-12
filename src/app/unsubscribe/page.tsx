import type { Metadata } from "next";
import Link from "next/link";

import { CONTACT_EMAIL } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Unsubscribe",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ t?: string; done?: string; error?: string }> };

/**
 * Reached from the link in the weekly email. Opening the page changes
 * nothing (email security scanners open links); the button does.
 */
export default async function UnsubscribePage({ searchParams }: Props) {
  const { t, done, error } = await searchParams;

  return (
    <main className="mx-auto max-w-[560px] px-5 py-16 md:px-10">
      <h1 className="font-display text-[30px] font-medium leading-tight">
        {done ? "You've been unsubscribed" : "Unsubscribe from the weekly email"}
      </h1>

      {done ? (
        <p className="mt-4 text-[15px] leading-[1.7] text-muted">
          You won't get the weekly email any more. If you change your mind, just sign up again on
          the <Link href="/" className="text-accent underline underline-offset-2">home page</Link>.
        </p>
      ) : error || !t ? (
        <p className="mt-4 text-[15px] leading-[1.7] text-muted">
          That link didn't work. Please use the unsubscribe link in your latest email, or email{" "}
          <a href={`mailto:${CONTACT_EMAIL}?subject=Unsubscribe`} className="text-accent underline underline-offset-2">
            {CONTACT_EMAIL}
          </a>{" "}
          and we'll take you off the list.
        </p>
      ) : (
        <form method="post" action="/api/unsubscribe" className="mt-6">
          <input type="hidden" name="t" value={t} />
          <p className="text-[15px] leading-[1.7] text-muted">
            You'll stop getting the weekly round-up of events. You can sign up again any time.
          </p>
          <button
            type="submit"
            className="mt-6 h-12 cursor-pointer bg-fill px-6 text-[14px] font-medium text-fill-text transition-opacity hover:opacity-85"
          >
            Unsubscribe
          </button>
        </form>
      )}
    </main>
  );
}
