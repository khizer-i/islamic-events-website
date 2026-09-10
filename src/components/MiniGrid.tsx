"use client";

import type { CalendarWeek } from "@/lib/calendar";

const INITIALS = ["M", "T", "W", "T", "F", "S", "S"];

/**
 * The grid on a phone. Seven columns on a 390px screen leaves ~50px a cell,
 * which fits a number and nothing else — so here the grid is navigation
 * (density marks show where the events are) and the selected day opens as a
 * reading list underneath.
 */
export default function MiniGrid({
  weeks,
  selectedKey,
  onSelect,
}: {
  weeks: CalendarWeek[];
  selectedKey: string;
  onSelect: (dayKey: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="grid grid-cols-7">
        {INITIALS.map((letter, i) => (
          <div
            key={i}
            className="text-center text-[10px] tracking-[0.08em] text-faint"
          >
            {letter}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {weeks.map((week) =>
          week.days.map((day) => {
            const selected = day.key === selectedKey;
            const marks = Math.min(day.events.length, 3);

            return (
              <button
                key={day.key}
                type="button"
                onClick={() => onSelect(day.key)}
                aria-pressed={selected}
                className={[
                  "flex h-11 cursor-pointer flex-col items-center justify-center gap-1 transition-colors",
                  selected ? "bg-accent" : "hover:bg-paper-sunk",
                ].join(" ")}
              >
                <span
                  className={[
                    "font-display text-[15px] leading-none",
                    selected
                      ? "font-semibold text-accent-contrast"
                      : day.isPast
                        ? "text-shade"
                        : day.isToday
                          ? "font-semibold text-accent"
                          : "text-ink",
                  ].join(" ")}
                >
                  {day.dayOfMonth}
                </span>

                <span className="flex h-[3px] items-center gap-[2px]">
                  {Array.from({ length: marks }).map((_, i) => (
                    <span
                      key={i}
                      className="block h-[3px] w-[3px]"
                      style={{
                        backgroundColor: selected
                          ? "var(--accent-contrast)"
                          : "var(--accent)",
                      }}
                    />
                  ))}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
