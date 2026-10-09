import type { Metadata } from "next";

import SubmitEventForm from "@/components/SubmitEventForm";
import { JsonLd, breadcrumbJsonLd } from "@/lib/structured-data";
import { SITE_NAME, SITE_URL } from "@/lib/brand";

/* ------------------------------------------------------------------ */
/* Other ways to send a poster, listed under the upload form. Set a     */
/* channel and it appears; with both null the section is hidden. There  */
/* is deliberately no Telegram option: the bot only listens to the      */
/* moderator's chat, so posters sent to it by anyone else are ignored.  */
/* ------------------------------------------------------------------ */
const CHANNELS = {
  whatsapp: null as string | null, // e.g. "447700900123" (no +, no spaces)
  instagram: null as string | null, // e.g. "islamiceventscalendar"
};

export const metadata: Metadata = {
  title: "Add your event",
  description:
    `List your Islamic event on the ${SITE_NAME} for free. Upload the poster, check the details we read from it, and send it in. No account needed.`,
  alternates: { canonical: `${SITE_URL}/submit` },
  // Its own share card: this is the link sent to organisers, and without
  // these it showed the homepage's title and URL.
  openGraph: {
    title: `Add your event to the ${SITE_NAME}`,
    description:
      "Free. Upload the poster, check the details we read from it, and send it in.",
    images: ["/opengraph-image"],
    url: `${SITE_URL}/submit`,
  },
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
    <main className="mx-auto max-w-[900px] px-5 py-10 md:px-10 md:py-14">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Add your event", path: "/submit" },
        ])}
      />

      <div className="max-w-[680px]">
        <h1 className="font-display text-[30px] font-medium leading-[1.1] tracking-[-0.6px] md:text-[38px]">
          Upload the poster, check the details, and that&rsquo;s it.
        </h1>

        <p className="mt-4 text-[15px] leading-[1.6] text-muted">
          There&rsquo;s no account to make. Upload the poster you already made
          for WhatsApp or Instagram and the title, date, time and venue are
          read from it for you. Correct anything that was misread, send it in,
          and a person checks it before it goes live, usually the same day.
          Listing is free and always will be.
        </p>
      </div>

      <SubmitEventForm siteKey={process.env.TURNSTILE_SITE_KEY ?? ""} />

      {anyChannel ? (
        <section className="mt-12 max-w-[680px]">
          <h2 className="font-display text-[21px] font-medium tracking-[-0.3px]">
            Other ways to send it
          </h2>
          <ul className="mt-4 flex flex-col">
            {CHANNELS.whatsapp ? (
              <Channel
                label="WhatsApp"
                detail="Forward the poster."
                href={`https://wa.me/${CHANNELS.whatsapp}`}
                action="Open WhatsApp"
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
          </ul>
        </section>
      ) : null}

      <section className="mt-12 max-w-[680px] border-t border-rule-strong pt-8">
        <h2 className="font-display text-[21px] font-medium tracking-[-0.3px]">
          What happens next
        </h2>
        <ol className="mt-5 flex flex-col gap-5">
          {[
            {
              n: "1",
              t: "The poster is read automatically",
              d: "Title, date, time, venue, city and organiser are read from the image and any caption you add.",
            },
            {
              n: "2",
              t: "You check the details",
              d: "Correct anything that was misread before you send it in. The date and time matter most.",
            },
            {
              n: "3",
              t: "A person approves it",
              d: "Every listing is reviewed before it goes live. It then gets its own page with the poster, a link you can share, an add-to-calendar button, and a listing Google can find.",
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

      <section className="mt-12 max-w-[680px] border-t border-rule pt-8">
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
