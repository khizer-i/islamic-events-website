import type { Metadata } from "next";
import Link from "next/link";

import { SITE_URL } from "@/lib/events";

// NOTE: this address is on a domain mailbox that is no longer active.
// Set up free forwarding (Cloudflare Email Routing) or change it — as it
// stands, everyone who writes in gets a bounce.
const EMAIL = "contact@islamiceventscalendar.co.uk";

export const metadata: Metadata = {
  title: "Support this project",
  description:
    "How to support the UK Islamic Events Calendar — donations, sponsorship and getting in touch.",
  alternates: { canonical: `${SITE_URL}/support` },
};

export default function SupportPage() {
  return (
    <main className="mx-auto max-w-[760px] px-5 py-10 md:px-10 md:py-14">
      <nav aria-label="Breadcrumb" className="mb-6 text-[12px] text-faint">
        <Link href="/" className="hover:text-ink">
          Home
        </Link>
        <span aria-hidden> / </span>
        <span>Support</span>
      </nav>

      <h1 className="font-display text-[30px] font-medium leading-[1.1] tracking-[-0.6px] md:text-[38px]">
        Support this project
      </h1>
      <p className="mt-4 text-[15px] leading-[1.65] text-muted">
        This calendar is built and maintained as a community service, to make
        it easier to find Islamic events across the UK. Support helps keep it
        online, accurate and free for everyone.
      </p>

      <section className="mt-11 border-t border-rule-strong pt-7">
        <h2 className="font-display text-[21px] font-medium tracking-[-0.3px]">
          Donate
        </h2>
        <p className="mt-2 text-[14px] leading-[1.6] text-muted">
          A simple way to contribute towards hosting and running costs.
        </p>
        <a
          href="https://paypal.me/islamiceventsuk"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex h-12 items-center justify-center bg-fill px-6 text-[14px] font-medium text-fill-text transition-opacity hover:opacity-85"
        >
          Donate via PayPal
        </a>
        <p className="mt-2 text-[12px] text-faint">
          You will be taken to a secure PayPal page to complete your donation.
        </p>
      </section>

      <section className="mt-11 border-t border-rule pt-7">
        <h2 className="font-display text-[21px] font-medium tracking-[-0.3px]">
          Sponsor a slot
        </h2>
        <p className="mt-2 text-[14px] leading-[1.6] text-muted">
          If you run an organisation, business or project and would like to
          visibly support this service, you can sponsor a slot on the calendar.
          Sponsorship covers the running costs and keeps the calendar free to
          use and free to list on.
        </p>
        <p className="mt-3 text-[14px] text-muted">
          For pricing and availability, get in touch at{" "}
          <a href={`mailto:${EMAIL}`} className="text-accent hover:underline">
            {EMAIL}
          </a>
          .
        </p>
      </section>

      <section className="mt-11 border-t border-rule pt-7">
        <h2 className="font-display text-[21px] font-medium tracking-[-0.3px]">
          Adding an event
        </h2>
        <p className="mt-2 text-[14px] leading-[1.6] text-muted">
          Listing is free and takes about ten seconds — you send the poster and
          we do the rest. See{" "}
          <Link href="/submit" className="text-accent hover:underline">
            add your event
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
