"use client";

import Link from "next/link";

import type { CalendarWeek } from "@/lib/calendar";

const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const MAX_PER_CELL = 2;

export default function MonthGrid({
  weeks,
  onShowDay,
}: {
  weeks: CalendarWeek[];
  onShowDay: (dayKey: string) => void;
}) {
  // The prompt earns its place once, in the first genuinely empty week.
  const firstEmptyWeek = weeks.find((w) =>
    w.days.every((d) => d.events.length === 0)
  )?.key;

  return (
    <div className="border-t border-rule-strong">
      <div className="grid grid-cols-7">
        {WEEKDAYS.map((day) => (
          <div key={day} className="label border-b border-rule py-2.5">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {weeks.map((week) =>
          week.days.map((day, i) => {
            const shown = day.events.slice(0, MAX_PER_CELL);
            const overflow = day.events.length - shown.length;
            const showPrompt =
              week.key === firstEmptyWeek && i === 3 && day.events.length === 0;

            return (
              <div
                key={day.key}
                className={[
                  "flex min-h-[132px] flex-col gap-1.5 border-b border-rule p-2 md:p-2.5",
                  i === 6 ? "" : "border-r",
                  day.isToday ? "bg-paper-sunk" : "",
                  day.isPast ? "opacity-55" : "",
                ].join(" ")}
              >
                <div className="flex items-baseline gap-1.5">
                  <span
                    className={[
                      "font-display text-[17px] leading-none",
                      day.isToday
                        ? "font-semibold text-accent"
                        : "text-ink-soft",
                    ].join(" ")}
                  >
                    {day.dayOfMonth}
                  </span>
                  {day.isFirstOfMonth ? (
                    <span className="text-[9px] text-faint">
                      {day.monthShort}
                    </span>
                  ) : null}
                  {day.isToday ? (
                    <span className="text-[9px] text-faint">
                      {day.hijriShort}
                    </span>
                  ) : null}
                </div>

                {shown.map((ev) => (
                  <Link
                    key={ev.id}
                    href={`/events/${ev.slug}`}
                    className={[
                      "flex flex-col border-l-2 pl-1.5 transition-colors",
                      ev.isCourse
                        ? "border-shade hover:border-accent"
                        : "border-accent",
                    ].join(" ")}
                  >
                    <span className="truncate text-[10px] leading-tight text-muted">
                      {ev.time ? <span className="tnum">{ev.time}</span> : null}
                      {ev.time && ev.city ? " " : ""}
                      {ev.city}
                    </span>
                    <span className="font-display line-clamp-2 text-[12px] font-medium leading-[1.25] hover:text-accent">
                      {ev.title}
                    </span>
                  </Link>
                ))}

                {overflow > 0 ? (
                  <button
                    type="button"
                    onClick={() => onShowDay(day.key)}
                    className="cursor-pointer text-left text-[10px] font-medium text-accent hover:text-accent-hover"
                  >
                    + {overflow} more
                  </button>
                ) : null}

                {showPrompt ? (
                  <div className="mt-0.5 flex flex-col gap-1 border border-dashed border-shade p-2">
                    <span className="text-[10px] leading-[1.35] text-muted">
                      Nothing listed this week.
                    </span>
                    <Link
                      href="/submit"
                      className="text-[10px] font-semibold text-accent hover:text-accent-hover"
                    >
                      Know of an event? Add it →
                    </Link>
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
