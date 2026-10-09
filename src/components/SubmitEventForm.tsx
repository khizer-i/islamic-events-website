"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";

import { MAX_IMAGE_CHARS } from "@/lib/upload-limits";
import {
  DAY_CODES,
  type DayCode,
  type Frequency,
  MAX_SESSIONS,
  NO_REPEAT,
  type Repeat,
  WEEK_POSITIONS,
  cleanRepeat,
  weekPosition,
  weekdayCode,
} from "@/lib/repeat-form";

type Fields = {
  title: string;
  organiser: string;
  venue_name: string;
  city: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
};

type Stage = "choose" | "reading" | "review" | "sending" | "done";

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id?: string) => void;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const TURNSTILE_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/** Big enough to read small print; shrunk further only if still too big. */
const MAX_SIDE = 2000;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("unreadable"));
    img.src = src;
  });
}

/**
 * Re-encodes the poster as a JPEG no larger than MAX_SIDE on its long edge,
 * and small enough to send (MAX_IMAGE_CHARS). Phone photos are often 5 to
 * 10 MB, which is over what a Vercel function accepts, and the model gains
 * nothing from more than this. Quality is lowered first, then the size.
 */
async function toJpeg(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no canvas");

    let side = MAX_SIDE;
    for (let attempt = 0; attempt < 4; attempt++) {
      const scale = Math.min(
        1,
        side / Math.max(img.naturalWidth, img.naturalHeight)
      );
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      // Transparent PNGs would otherwise turn black as JPEG.
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      for (const quality of [0.85, 0.7, 0.55]) {
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        // The limit is on the base64 part, which is what gets sent.
        if (dataUrl.length - dataUrl.indexOf(",") - 1 <= MAX_IMAGE_CHARS) {
          return dataUrl;
        }
      }
      side = Math.round(side * 0.75);
    }
    throw new Error("too large");
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let data: {
    ok?: boolean;
    error?: string;
    fields?: Fields;
    repeat?: unknown;
    token?: string;
  } = {};
  try {
    data = await res.json();
  } catch {
    // Non-JSON reply, handled as an error below.
  }
  return { ok: res.ok && data.ok === true, data };
}

const inputClass =
  "h-11 w-full border border-rule-strong bg-paper px-3 text-[14px] text-ink placeholder:text-faint";

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="label">
        {label}
      </label>
      {children}
      {hint ? <span className="text-[12px] text-faint">{hint}</span> : null}
    </div>
  );
}

type EndMode = "until" | "count" | "open";

const FREQUENCY_LABELS: Record<Frequency, string> = {
  none: "Does not repeat",
  weekly: "Every week",
  fortnightly: "Every other week",
  monthly: "Once a month",
  daily: "Every day",
};

const DAY_SHORT: Record<DayCode, string> = {
  MO: "Mon",
  TU: "Tue",
  WE: "Wed",
  TH: "Thu",
  FR: "Fri",
  SA: "Sat",
  SU: "Sun",
};

const DAY_LONG: Record<DayCode, string> = {
  MO: "Monday",
  TU: "Tuesday",
  WE: "Wednesday",
  TH: "Thursday",
  FR: "Friday",
  SA: "Saturday",
  SU: "Sunday",
};

const POSITION_LABELS: Record<string, string> = {
  "1": "First",
  "2": "Second",
  "3": "Third",
  "4": "Fourth",
  "-1": "Last",
};

/**
 * "Repeats": pre-filled from what the bot read on the poster ("every
 * Wednesday", "the last Thursday of the month", "10 weeks from 3rd Nov").
 * A weekly class is then one listing that shows each of its dates, rather
 * than one submission per week.
 */
function RepeatFields({
  repeat,
  setRepeat,
  endMode,
  setEndMode,
  startDate,
}: {
  repeat: Repeat;
  setRepeat: (r: Repeat) => void;
  endMode: EndMode;
  setEndMode: (m: EndMode) => void;
  startDate: string;
}) {
  const startDay = weekdayCode(startDate);

  const changeFrequency = (frequency: Frequency) => {
    const next = { ...repeat, frequency };
    // Start from the day of the date above, which is nearly always right.
    if ((frequency === "weekly" || frequency === "fortnightly") && !next.days.length) {
      next.days = startDay ? [startDay] : [];
    }
    if (frequency === "monthly") {
      if (next.days.length !== 1) next.days = startDay ? [startDay] : ["MO"];
      if (next.week_of_month === null) next.week_of_month = weekPosition(startDate) ?? 1;
    }
    setRepeat(next);
  };

  const toggleDay = (code: DayCode) => {
    const has = repeat.days.includes(code);
    setRepeat({
      ...repeat,
      days: DAY_CODES.filter((c) => (c === code ? !has : repeat.days.includes(c))),
    });
  };

  const freq = repeat.frequency;
  const weekly = freq === "weekly" || freq === "fortnightly";

  return (
    <div className="flex flex-col gap-4 border-y border-rule py-5">
      <Field
        id="f-repeats"
        label="Repeats"
        hint={
          freq === "none"
            ? "For a weekly class or a course, choose how often. It is listed once with all its dates."
            : undefined
        }
      >
        <select
          id="f-repeats"
          value={freq}
          onChange={(e) => changeFrequency(e.target.value as Frequency)}
          className={inputClass}
        >
          {(Object.keys(FREQUENCY_LABELS) as Frequency[]).map((f) => (
            <option key={f} value={f}>
              {FREQUENCY_LABELS[f]}
            </option>
          ))}
        </select>
      </Field>

      {weekly ? (
        <fieldset className="flex flex-col gap-1.5">
          <legend className="label mb-1.5">On</legend>
          <div className="flex flex-wrap gap-1.5">
            {DAY_CODES.map((code) => {
              const on = repeat.days.includes(code);
              return (
                <button
                  key={code}
                  type="button"
                  aria-pressed={on}
                  aria-label={DAY_LONG[code]}
                  onClick={() => toggleDay(code)}
                  className={`h-10 min-w-[44px] cursor-pointer border px-1.5 text-[13px] transition-colors ${
                    on
                      ? "border-fill bg-fill text-fill-text"
                      : "border-rule-strong bg-paper text-ink hover:border-ink"
                  }`}
                >
                  {DAY_SHORT[code]}
                </button>
              );
            })}
          </div>
          {!repeat.days.length ? (
            <span className="text-[12px] text-faint">
              None chosen: the same day as the date above.
            </span>
          ) : null}
        </fieldset>
      ) : null}

      {freq === "monthly" ? (
        <div className="grid grid-cols-2 gap-4">
          <Field id="f-repeat-pos" label="Which">
            <select
              id="f-repeat-pos"
              value={String(repeat.week_of_month ?? 1)}
              onChange={(e) =>
                setRepeat({ ...repeat, week_of_month: Number(e.target.value) })
              }
              className={inputClass}
            >
              {WEEK_POSITIONS.map((p) => (
                <option key={p} value={String(p)}>
                  {POSITION_LABELS[String(p)]}
                </option>
              ))}
            </select>
          </Field>
          <Field id="f-repeat-day" label="Day">
            <select
              id="f-repeat-day"
              value={repeat.days[0] ?? startDay ?? "MO"}
              onChange={(e) =>
                setRepeat({ ...repeat, days: [e.target.value as DayCode] })
              }
              className={inputClass}
            >
              {DAY_CODES.map((code) => (
                <option key={code} value={code}>
                  {DAY_LONG[code]}
                </option>
              ))}
            </select>
          </Field>
        </div>
      ) : null}

      {freq !== "none" ? (
        <fieldset className="flex flex-col gap-2.5">
          <legend className="label mb-1.5">Until</legend>
          {(
            [
              ["until", "A date"],
              ["count", "A number of sessions"],
              ["open", "No end date given"],
            ] as [EndMode, string][]
          ).map(([mode, label]) => (
            <label
              key={mode}
              className="flex cursor-pointer items-center gap-2.5 text-[14px]"
            >
              <input
                type="radio"
                name="repeat-end"
                value={mode}
                checked={endMode === mode}
                onChange={() => setEndMode(mode)}
                className="h-4 w-4 accent-accent"
              />
              {label}
            </label>
          ))}

          {endMode === "until" ? (
            <Field id="f-repeat-until" label="Last session">
              <input
                id="f-repeat-until"
                type="date"
                required
                min={startDate || undefined}
                value={repeat.until}
                onChange={(e) => setRepeat({ ...repeat, until: e.target.value })}
                className={inputClass}
              />
            </Field>
          ) : null}
          {endMode === "count" ? (
            <Field id="f-repeat-count" label="Number of sessions" hint="Including the first.">
              <input
                id="f-repeat-count"
                type="number"
                inputMode="numeric"
                required
                min={2}
                max={MAX_SESSIONS}
                value={repeat.count ?? ""}
                onChange={(e) =>
                  setRepeat({
                    ...repeat,
                    count: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                className={inputClass}
              />
            </Field>
          ) : null}
          {endMode === "open" ? (
            <span className="text-[12px] leading-[1.5] text-faint">
              It will be listed for 12 weeks, and we&rsquo;ll check it&rsquo;s
              still running before then.
            </span>
          ) : null}
        </fieldset>
      ) : null}
    </div>
  );
}

/**
 * `siteKey` is the Turnstile site key. It is public by design (Cloudflare
 * expects it in the page), but it is passed in from the server component
 * rather than read from a NEXT_PUBLIC_ variable, so it is set in one place
 * as plain TURNSTILE_SITE_KEY. Empty means no captcha (local development).
 */
export default function SubmitEventForm({ siteKey }: { siteKey: string }) {
  const [stage, setStage] = useState<Stage>("choose");
  const [poster, setPoster] = useState<string>(""); // JPEG data URL
  const [caption, setCaption] = useState("");
  const [fields, setFields] = useState<Fields | null>(null);
  const [repeat, setRepeat] = useState<Repeat>(NO_REPEAT);
  const [endMode, setEndMode] = useState<EndMode>("open");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [company, setCompany] = useState(""); // honeypot
  const [captcha, setCaptcha] = useState(() => (siteKey ? "" : "dev"));

  const captchaBox = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const top = useRef<HTMLElement>(null);

  // The review form is long and the other stages are short, so on a phone a
  // stage change can leave the visitor looking at the bottom of the page
  // with no sign anything happened. Bring the form's top back into view.
  const showTop = () =>
    requestAnimationFrame(() => {
      const el = top.current;
      if (el && el.getBoundingClientRect().top < 0) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });

  // Start waking the bot while the visitor is still finding their poster.
  useEffect(() => {
    fetch("/api/submissions/warm").catch(() => {});
  }, []);

  // Cloudflare Turnstile. "interaction-only" keeps it invisible unless
  // Cloudflare actually wants the visitor to tick something.
  useEffect(() => {
    if (!siteKey) return;
    let cancelled = false;

    const render = () => {
      if (cancelled || !captchaBox.current || !window.turnstile) return;
      if (widgetId.current) return;
      widgetId.current = window.turnstile.render(captchaBox.current, {
        sitekey: siteKey,
        appearance: "interaction-only",
        theme: "auto",
        callback: (t: string) => setCaptcha(t),
        "expired-callback": () => setCaptcha(""),
        "error-callback": () => setCaptcha(""),
      });
    };

    let script = document.querySelector<HTMLScriptElement>(
      `script[src="${TURNSTILE_SRC}"]`
    );
    if (window.turnstile) {
      render();
    } else {
      if (!script) {
        script = document.createElement("script");
        script.src = TURNSTILE_SRC;
        script.async = true;
        document.head.appendChild(script);
      }
      script.addEventListener("load", render);
    }

    return () => {
      cancelled = true;
      script?.removeEventListener("load", render);
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
      }
      widgetId.current = null;
    };
  }, [siteKey]);

  const resetCaptcha = () => {
    if (siteKey && window.turnstile && widgetId.current) {
      setCaptcha("");
      window.turnstile.reset(widgetId.current);
    }
  };

  const choose = async (file: File | undefined) => {
    setError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image of the poster (JPG or PNG).");
      return;
    }
    try {
      setPoster(await toJpeg(file));
    } catch (e) {
      setError(
        e instanceof Error && e.message === "too large"
          ? "That image is too detailed to send. Please take a screenshot of the poster and upload that."
          : "That image couldn't be opened. Please try a JPG or PNG, or take a screenshot of the poster."
      );
    }
  };

  const read = async () => {
    if (!poster || stage === "reading") return;
    setError("");
    setStage("reading");
    try {
      const { ok, data } = await postJson("/api/submissions/extract", {
        image: poster.split(",", 2)[1],
        caption,
        turnstileToken: captcha,
        company,
      });
      // A Turnstile token works once, so get a fresh one either way.
      resetCaptcha();
      if (!ok || !data.fields || !data.token) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setStage("choose");
        return;
      }
      const readRepeat = cleanRepeat(data.repeat);
      setFields(data.fields);
      setRepeat(readRepeat);
      setEndMode(readRepeat.count ? "count" : readRepeat.until ? "until" : "open");
      setToken(data.token);
      setStage("review");
      showTop();
    } catch {
      resetCaptcha();
      setError("We couldn't reach the server. Please try again.");
      setStage("choose");
    }
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fields || stage === "sending") return;
    setError("");
    setStage("sending");
    const repeats = repeat.frequency !== "none";
    try {
      const { ok, data } = await postJson("/api/submissions", {
        token,
        image: poster.split(",", 2)[1],
        // A series' "last day" is its last session, chosen under Repeats;
        // the event's own end is on the day it starts.
        fields: repeats ? { ...fields, end_date: "" } : fields,
        repeat: repeats
          ? {
              ...repeat,
              until: endMode === "until" ? repeat.until : "",
              count: endMode === "count" ? repeat.count : null,
            }
          : NO_REPEAT,
        description: caption,
        company,
      });
      if (ok) {
        setStage("done");
        showTop();
      } else {
        setError(data.error ?? "Something went wrong. Please try again.");
        // An expired or spent token needs a fresh read; anything else is
        // fixable in the form.
        const restart = /expired|already been submitted/i.test(data.error ?? "");
        setStage(restart ? "choose" : "review");
        if (restart) showTop();
      }
    } catch {
      setError("We couldn't reach the server. Please try again.");
      setStage("review");
    }
  };

  const startAgain = () => {
    setStage("choose");
    setPoster("");
    setCaption("");
    setFields(null);
    setRepeat(NO_REPEAT);
    setEndMode("open");
    setToken("");
    setError("");
    if (fileInput.current) fileInput.current.value = "";
    showTop();
  };

  const set = (key: keyof Fields) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => setFields((f) => (f ? { ...f, [key]: e.target.value } : f));

  const busy = stage === "reading" || stage === "sending";

  return (
    <section
      ref={top}
      className="mt-10 scroll-mt-6 border-t border-rule-strong pt-8"
    >
      {stage === "done" ? (
        <div className="flex flex-col gap-3">
          <h2 className="font-display text-[24px] font-medium tracking-[-0.3px]">
            Thank you, your event has been sent in
          </h2>
          <p className="max-w-lg text-[14px] leading-[1.6] text-muted">
            It will be checked by a person and usually appears on the calendar
            the same day. There&rsquo;s nothing else you need to do.
          </p>
          <button
            type="button"
            onClick={startAgain}
            className="mt-2 h-11 w-fit cursor-pointer bg-fill px-5 text-[14px] font-medium text-fill-text transition-opacity hover:opacity-85"
          >
            Add another event
          </button>
        </div>
      ) : stage === "review" || stage === "sending" ? (
        <form
          onSubmit={send}
          className="grid gap-8 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)] md:gap-10"
        >
          <div>
            <img
              src={poster}
              alt="Your poster"
              className="mx-auto max-h-[50vh] w-auto max-w-full rounded-[2px] border border-rule object-contain md:sticky md:top-6 md:max-h-none md:w-full"
            />
          </div>

          <div className="flex flex-col gap-5">
            <div>
              <h2 className="font-display text-[22px] font-medium tracking-[-0.3px]">
                Check the details
              </h2>
              <p className="mt-1.5 text-[14px] leading-[1.6] text-muted">
                These were read from your poster. Please check each one against
                it and correct anything that&rsquo;s wrong, especially the date
                and time.
              </p>
            </div>

            <Field id="f-title" label="Event title">
              <input
                id="f-title"
                required
                value={fields?.title ?? ""}
                onChange={set("title")}
                placeholder="Not found on the poster"
                className={inputClass}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="col-span-2 sm:col-span-1">
                <Field id="f-date" label="Date">
                  <input
                    id="f-date"
                    type="date"
                    required
                    value={fields?.start_date ?? ""}
                    onChange={set("start_date")}
                    className={inputClass}
                  />
                </Field>
              </div>
              <Field id="f-start" label="Starts">
                <input
                  id="f-start"
                  type="time"
                  value={fields?.start_time ?? ""}
                  onChange={set("start_time")}
                  className={inputClass}
                />
              </Field>
              <Field id="f-end" label="Ends">
                <input
                  id="f-end"
                  type="time"
                  value={fields?.end_time ?? ""}
                  onChange={set("end_time")}
                  className={inputClass}
                />
              </Field>
            </div>

            {repeat.frequency === "none" ? (
              <Field
                id="f-end-date"
                label="Last day"
                hint="Only if it runs over more than one day."
              >
                <input
                  id="f-end-date"
                  type="date"
                  value={fields?.end_date ?? ""}
                  onChange={set("end_date")}
                  className={inputClass}
                />
              </Field>
            ) : null}

            <RepeatFields
              repeat={repeat}
              setRepeat={setRepeat}
              endMode={endMode}
              setEndMode={setEndMode}
              startDate={fields?.start_date ?? ""}
            />

            <Field id="f-venue" label="Venue">
              <input
                id="f-venue"
                value={fields?.venue_name ?? ""}
                onChange={set("venue_name")}
                placeholder="Not found on the poster"
                className={inputClass}
              />
            </Field>

            <Field id="f-city" label="Town or city">
              <input
                id="f-city"
                value={fields?.city ?? ""}
                onChange={set("city")}
                placeholder="Not found on the poster"
                className={inputClass}
              />
            </Field>

            <Field id="f-organiser" label="Organised by">
              <input
                id="f-organiser"
                value={fields?.organiser ?? ""}
                onChange={set("organiser")}
                placeholder="Not found on the poster"
                className={inputClass}
              />
            </Field>

            <Field
              id="f-description"
              label="Description"
              hint="Optional. Shown on the event's page."
            >
              <textarea
                id="f-description"
                rows={4}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full border border-rule-strong bg-paper px-3 py-2.5 text-[14px] leading-[1.55] text-ink placeholder:text-faint"
              />
            </Field>

            {error ? (
              <p role="alert" className="text-[13px] text-accent">
                {error}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-4 pt-1">
              <button
                type="submit"
                disabled={busy}
                className="h-12 cursor-pointer bg-fill px-6 text-[14px] font-medium text-fill-text transition-opacity hover:opacity-85 disabled:opacity-50"
              >
                {stage === "sending" ? "Sending…" : "Send for review"}
              </button>
              <button
                type="button"
                onClick={startAgain}
                disabled={busy}
                className="cursor-pointer text-[13px] text-muted underline-offset-4 hover:text-ink hover:underline"
              >
                Start again with a different poster
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="flex max-w-[680px] flex-col gap-5">
          <input
            ref={fileInput}
            id="poster-file"
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={busy}
            onChange={(e) => choose(e.target.files?.[0])}
          />

          {poster ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <img
                src={poster}
                alt="Your poster"
                className="max-h-[320px] w-auto self-start rounded-[2px] border border-rule object-contain"
              />
              {stage === "reading" ? (
                <div className="flex flex-col gap-1.5" aria-live="polite">
                  <span className="font-display text-[19px] font-medium">
                    Reading your poster&hellip;
                  </span>
                  <span className="max-w-sm text-[13px] leading-[1.55] text-muted">
                    This usually takes 15 to 30 seconds, and can take up to a
                    minute if the site has been quiet.
                  </span>
                </div>
              ) : (
                <label
                  htmlFor="poster-file"
                  className="w-fit cursor-pointer text-[13px] text-muted underline underline-offset-4 hover:text-ink"
                >
                  Choose a different image
                </label>
              )}
            </div>
          ) : (
            <label
              htmlFor="poster-file"
              className="flex cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-shade px-6 py-12 text-center transition-colors hover:border-rule-strong"
            >
              <span className="font-display text-[20px] font-medium">
                Choose your poster
              </span>
              <span className="text-[13px] text-muted">
                The same image you&rsquo;d share on WhatsApp or Instagram
              </span>
            </label>
          )}

          {stage !== "reading" ? (
            <>
              <Field
                id="poster-caption"
                label="Caption or extra details"
                hint="Optional. Paste the text you'd post with it, if there is any."
              >
                <textarea
                  id="poster-caption"
                  rows={3}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full border border-rule-strong bg-paper px-3 py-2.5 text-[14px] leading-[1.55] text-ink placeholder:text-faint"
                />
              </Field>

              {error ? (
                <p role="alert" className="text-[13px] text-accent">
                  {error}
                </p>
              ) : null}

              <button
                type="button"
                onClick={read}
                disabled={!poster || !captcha || busy}
                className="h-12 w-fit cursor-pointer bg-fill px-6 text-[14px] font-medium text-fill-text transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Read the poster
              </button>
              {poster && !captcha ? (
                <p className="text-[12px] text-faint">
                  Checking you&rsquo;re not a robot&hellip;
                </p>
              ) : null}
            </>
          ) : null}
        </div>
      )}

      {/* Honeypot: real people never fill this in. */}
      <div aria-hidden className="hidden">
        <label htmlFor="submit-company">Company</label>
        <input
          id="submit-company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </div>

      {/* Stays mounted through every stage so the widget is never torn down. */}
      <div ref={captchaBox} className="mt-4" />
    </section>
  );
}
