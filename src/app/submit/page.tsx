import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd, breadcrumbJsonLd } from "@/lib/structured-data";
import { SITE_URL } from "@/lib/events";

/* ------------------------------------------------------------------ */
/* FILL THESE IN — they are the only things on this page that need     */
/* changing. Set a channel to null and it disappears from the page.    */
/* ------------------------------------------------------------------ */
const CHANNELS = {
  whatsapp: null as string | null, // e.g. "447700900123" (no +, no spaces)
  telegram: null as string | null, // e.g. "islamiceventsukbot"
  email: "events@islamiceventscalendar.co.uk" as string | null, // e.g. "events@islamiceventscalendar.co.uk"
  instagram: null as string | null, // e.g. "islamiceventscalendar"
};

export const metadata: Metadata = {
  title: "Add your event",
  description:
    "List your Islamic event on the UK Islamic Events Calendar for free. Send us the poster and we will do the rest — no account, no form.",
  alternates: { canonical: `${SITE_URL}/submit` },
};

function Channel({
  label,
  detail,
  href,
  action,
}: {
  label: string;
  detail: string;
  href: string;
  action: string;
}) {
  return (
    <li className="flex flex-col gap-2 border-t border-rule py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="flex flex-col gap-1">
        <span className="font-display text-[18px] font-medium">{label}</span>
        <span className="text-[13px] text-muted">{detail}</span>
      </div>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="w-fit shrink-0 bg-fill px-4 py-2.5 text-[13px] font-medium text-fill-text transition-opacity hover:opacity-85"
      >
        {action}
      </a>
    </li>
  );
}

export default function SubmitPage() {
  const anyChannel = Object.values(CHANNELS).some(Boolean);

  return (
    <main className="mx-auto max-w-[760px] px-5 py-10 md:px-10 md:py-14">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Add your event", path: "/submit" },
        ])}
      />

      <h1 className="font-display text-[30px] font-medium leading-[1.1] tracking-[-0.6px] md:text-[38px]">
        Send us the poster. That is the whole process.
      </h1>

      <p className="mt-4 text-[15px] leading-[1.6] text-muted">
        There is no form to fill in and no account to make. Send the poster you
        already made for WhatsApp or Instagram, and it will be read, turned
        into a listing and published — usually the same day. Listing is free
        and always will be.
      </p>

      {anyChannel ? (
        <ul className="mt-10 flex flex-col">
          {CHANNELS.whatsapp ? (
            <Channel
              label="WhatsApp"
              detail="Forward the poster. Quickest option."
              href={`https://wa.me/${CHANNELS.whatsapp}`}
              action="Open WhatsApp"
            />
          ) : null}
          {CHANNELS.telegram ? (
            <Channel
              label="Telegram"
              detail="Send the poster to our bot."
              href={`https://t.me/${CHANNELS.telegram}`}
              action="Open Telegram"
            />
          ) : null}
          {CHANNELS.instagram ? (
            <Channel
              label="Instagram"
              detail="Send the post or poster as a DM."
              href={`https://instagram.com/${CHANNELS.instagram}`}
              action="Open Instagram"
            />
          ) : null}
          {CHANNELS.email ? (
            <Channel
              label="Email"
              detail="Attach the poster. A caption helps but is not needed."
              href={`mailto:${CHANNELS.email}?subject=Event%20submission`}
              action="Send email"
            />
          ) : null}
        </ul>
      ) : (
        <div className="mt-10 border border-dashed border-shade p-6">
          <p className="text-[14px] leading-[1.6] text-muted">
            Submission channels are being set up. In the meantime, please get
            in touch through the{" "}
            <Link href="/support" className="text-accent hover:underline">
              support page
            </Link>
            .
          </p>
        </div>
      )}

      <section className="mt-12 border-t border-rule-strong pt-8">
        <h2 className="font-display text-[21px] font-medium tracking-[-0.3px]">
          What happens next
        </h2>
        <ol className="mt-5 flex flex-col gap-5">
          {[
            {
              n: "1",
              t: "The poster is read automatically",
              d: "Title, date, time, venue, city and organiser are extracted from the image and the caption.",
            },
            {
              n: "2",
              t: "A person checks it",
              d: "Every listing is reviewed before it goes live, so a misread date does not reach anyone.",
            },
            {
              n: "3",
              t: "It gets its own page",
              d: "With the poster, a link you can share, an add-to-calendar button, and a listing Google can find.",
            },
          ].map((step) => (
            <li key={step.n} className="flex gap-5">
              <span className="font-display shrink-0 text-[22px] leading-none text-accent">
                {step.n}
              </span>
              <div className="flex flex-col gap-1">
                <span className="text-[15px] font-medium">{step.t}</span>
                <span className="text-[14px] leading-[1.55] text-muted">
                  {step.d}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12 border-t border-rule pt-8">
        <h2 className="font-display text-[21px] font-medium tracking-[-0.3px]">
          What makes a poster easy to read
        </h2>
        <p className="mt-4 text-[14px] leading-[1.65] text-muted">
          Anything legible works, but listings come out best when the poster
          states the date including the year, a start time, and the venue with
          its town or city. If the event runs weekly or over several weeks, say
          so in the caption. If it is online only, say that too.
        </p>
      </section>
    </main>
  );
}
