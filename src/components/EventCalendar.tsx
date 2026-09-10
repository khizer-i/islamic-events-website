"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import AgendaList from "./AgendaList";
import MiniGrid from "./MiniGrid";
import MonthGrid from "./MonthGrid";
import PosterThumb from "./PosterThumb";
import {
  type CalendarEvent,
  addDays,
  buildRollingWeeks,
  categoryCounts,
  dateFromDayKey,
  ukDayKey,
  weekRangeLabel,
} from "@/lib/calendar";

type View = "auto" | "list" | "calendar";

const SELECTED_DAY_LABEL = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  weekday: "long",
  day: "numeric",
  month: "long",
});

export default function EventCalendar({
  events,
  cities,
  weekCount = 6,
}: {
  events: CalendarEvent[];
  cities: string[];
  weekCount?: number;
}) {
  const [view, setView] = useState<View>("auto");
  const [city, setCity] = useState("ALL");
  const [category, setCategory] = useState<string | null>(null);
  const pendingScroll = useRef<string | null>(null);

  // Fixed for the life of the page so the grid can't shift under the user.
  const [now] = useState(() => new Date());
  const todayKey = useMemo(() => ukDayKey(now), [now]);
  const tomorrowKey = useMemo(
    () => ukDayKey(addDays(dateFromDayKey(todayKey), 1)),
    [todayKey]
  );

  const [selectedDay, setSelectedDay] = useState(todayKey);

  const filtered = useMemo(
    () =>
      events.filter((ev) => {
        if (city !== "ALL" && ev.city !== city) return false;
        if (category && !ev.categories.includes(category)) return false;
        return true;
      }),
    [events, city, category]
  );

  const weeks = useMemo(
    () => buildRollingWeeks(filtered, weekCount, now),
    [filtered, weekCount, now]
  );

  const days = useMemo(() => weeks.flatMap((w) => w.days), [weeks]);
  const categories = useMemo(() => categoryCounts(events), [events]);
  // Counted from the window, not the filter, so it matches what is on screen.
  const total = useMemo(
    () => days.reduce((n, d) => n + d.events.length, 0),
    [days]
  );

  const selected = days.find((d) => d.key === selectedDay);

  // Runs after the view switch has rendered the list, so the target exists.
  useEffect(() => {
    const key = pendingScroll.current;
    if (!key) return;
    pendingScroll.current = null;
    document
      .getElementById(`day-${key}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [view]);

  const listClass =
    view === "list" ? "block" : view === "calendar" ? "hidden" : "lg:hidden";
  const calendarClass =
    view === "calendar" ? "block" : view === "list" ? "hidden" : "hidden lg:block";

  const filtersActive = city !== "ALL" || category !== null;

  return (
    <div className="flex flex-col">
      {/* Control bar */}
      <div className="flex flex-col gap-4 border-b border-rule py-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
        <div className="flex items-baseline gap-3">
          <h2 className="font-display text-[19px] font-medium tracking-[-0.2px] lg:text-[21px]">
            Next six weeks
          </h2>
          <span className="hidden text-[13px] text-faint lg:inline">
            {weekRangeLabel(weeks)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:gap-3">
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            aria-label="Filter by city"
            className="h-9 cursor-pointer border border-rule bg-paper px-2.5 text-[12px] text-ink"
          >
            <option value="ALL">All of the UK</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <div className="flex overflow-hidden border border-rule-strong">
            <button
              type="button"
              onClick={() => setView("list")}
              className={`cursor-pointer px-3.5 py-2 text-[12px] font-medium ${
                view === "list"
                  ? "bg-fill text-fill-text"
                  : "text-ink-soft hover:bg-paper-sunk"
              }`}
            >
              List
            </button>
            <button
              type="button"
              onClick={() => setView("calendar")}
              className={`cursor-pointer px-3.5 py-2 text-[12px] font-medium ${
                view === "calendar"
                  ? "bg-fill text-fill-text"
                  : "text-ink-soft hover:bg-paper-sunk"
              }`}
            >
              Calendar
            </button>
          </div>
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5 border-b border-rule py-3">
          <button
            type="button"
            onClick={() => setCategory(null)}
            className={`cursor-pointer border px-3 py-1.5 text-[12px] ${
              category === null
                ? "border-rule-strong font-medium text-ink"
                : "border-rule text-muted hover:text-ink"
            }`}
          >
            All
          </button>
          {categories.slice(0, 8).map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id === category ? null : cat.id)}
              className={`cursor-pointer border px-3 py-1.5 text-[12px] ${
                category === cat.id
                  ? "border-rule-strong font-medium text-ink"
                  : "border-rule text-muted hover:text-ink"
              }`}
            >
              {cat.label}
              <span className="ml-1.5 text-faint">{cat.count}</span>
            </button>
          ))}
        </div>
      ) : null}

      {/* Result summary */}
      <p className="py-3 text-[12px] text-faint">
        {total === 0
          ? "No events match these filters."
          : `${total} event${total === 1 ? "" : "s"}`}
        {filtersActive ? (
          <button
            type="button"
            onClick={() => {
              setCity("ALL");
              setCategory(null);
            }}
            className="ml-2 cursor-pointer font-medium text-accent hover:text-accent-hover"
          >
            Clear filters
          </button>
        ) : null}
      </p>

      {/* List */}
      <div className={listClass}>
        <AgendaList
          days={days}
          todayKey={todayKey}
          tomorrowKey={tomorrowKey}
        />
      </div>

      {/* Calendar */}
      <div className={calendarClass}>
        <div className="hidden lg:block">
          <MonthGrid
            weeks={weeks}
            onShowDay={(key) => {
              pendingScroll.current = key;
              setView("list");
            }}
          />
        </div>

        <div className="lg:hidden">
          <MiniGrid
            weeks={weeks}
            selectedKey={selectedDay}
            onSelect={setSelectedDay}
          />

          <div className="mt-5 border-t border-rule-strong pt-4">
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <h3 className="font-display text-[17px] font-medium">
                {selected ? SELECTED_DAY_LABEL.format(selected.date) : ""}
              </h3>
              <span className="text-[11px] text-faint">
                {selected?.hijriShort}
              </span>
            </div>

            {selected && selected.events.length > 0 ? (
              <ul className="flex flex-col gap-5">
                {selected.events.map((ev) => (
                  <li key={ev.id}>
                    <Link
                      href={`/events/${ev.slug}`}
                      className="group flex items-start gap-3.5"
                    >
                      <PosterThumb
                        id={ev.id}
                        title={ev.title}
                        organiser={ev.organiser}
                        posterUrl={ev.posterUrl}
                        rounded
                        className="h-[62px] w-[50px] shrink-0"
                      />
                      <div className="flex min-w-0 flex-col gap-1">
                        <span className="font-display text-[17px] font-medium leading-[1.24] text-pretty group-hover:text-accent">
                          {ev.title}
                        </span>
                        <span className="text-[12px] text-muted">
                          {ev.time ? (
                            <span className="tnum">{ev.time}</span>
                          ) : null}
                          {ev.time && ev.location ? " · " : ""}
                          {ev.location}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-[13px] text-faint">
                Nothing listed on this day.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
