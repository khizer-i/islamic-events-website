"use client";

import { useState } from "react";

type State = "idle" | "sending" | "done" | "error";

/**
 * The list is the only asset with a revenue path attached, so this is
 * deliberately low-friction: one field, no account, no checkbox maze.
 * `city` pre-fills from a city page so the signup is local by default.
 */
export default function SubscribeForm({
  city = null,
  cities = [],
  source = "site",
  heading = "A weekly email of what's coming up",
  blurb = "One message a week with the events added that week. No adverts, and you can leave any time.",
}: {
  city?: string | null;
  cities?: string[];
  source?: string;
  heading?: string;
  blurb?: string;
}) {
  const [email, setEmail] = useState("");
  const [chosenCity, setChosenCity] = useState(city ?? "");
  const [company, setCompany] = useState(""); // honeypot
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === "sending") return;

    setState("sending");
    setMessage("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          city: chosenCity || null,
          source,
          company,
        }),
      });

      const data = (await res.json()) as { ok?: boolean; error?: string };

      if (res.ok && data.ok) {
        setState("done");
      } else {
        setState("error");
        setMessage(data.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setState("error");
      setMessage("Could not reach the server. Please try again.");
    }
  };

  if (state === "done") {
    return (
      <section className="border-t border-rule-strong py-8">
        <h2 className="font-display text-[21px] font-medium tracking-[-0.3px]">
          You&rsquo;re on the list
        </h2>
        <p className="mt-2 max-w-lg text-[14px] leading-[1.6] text-muted">
          {chosenCity
            ? `We'll email you when events are added in ${chosenCity}.`
            : "We'll email you when new events are added."}
        </p>
      </section>
    );
  }

  return (
    <section className="border-t border-rule-strong py-8">
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-12">
        <div>
          <h2 className="font-display text-[21px] font-medium tracking-[-0.3px] md:text-[24px]">
            {heading}
          </h2>
          <p className="mt-2 max-w-md text-[14px] leading-[1.6] text-muted">
            {blurb}
          </p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-2.5">
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <label className="sr-only" htmlFor="subscribe-email">
              Email address
            </label>
            <input
              id="subscribe-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="h-12 flex-1 border border-rule-strong bg-paper px-3.5 text-[14px] text-ink placeholder:text-faint"
            />

            <button
              type="submit"
              disabled={state === "sending"}
              className="h-12 cursor-pointer bg-fill px-6 text-[14px] font-medium text-fill-text transition-opacity hover:opacity-85 disabled:opacity-50"
            >
              {state === "sending" ? "Adding…" : "Subscribe"}
            </button>
          </div>

          {cities.length > 0 ? (
            <>
              <label className="sr-only" htmlFor="subscribe-city">
                City
              </label>
              <select
                id="subscribe-city"
                value={chosenCity}
                onChange={(e) => setChosenCity(e.target.value)}
                className="h-11 cursor-pointer border border-rule bg-paper px-3 text-[13px] text-ink"
              >
                <option value="">Anywhere in the UK</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </>
          ) : null}

          {/* Honeypot: real people never fill this in. */}
          <div aria-hidden className="hidden">
            <label htmlFor="subscribe-company">Company</label>
            <input
              id="subscribe-company"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </div>

          {state === "error" && message ? (
            <p className="text-[13px] text-accent">{message}</p>
          ) : null}

          <p className="text-[12px] leading-[1.5] text-faint">
            We only use your address to send this email. Unsubscribe any time.
          </p>
        </form>
      </div>
    </section>
  );
}
