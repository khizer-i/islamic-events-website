import Link from "next/link";

import PosterThumb from "./PosterThumb";
import type { CalendarDay } from "@/lib/calendar";

const DAY_LABEL = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  weekday: "long",
  day: "numeric",
  month: "long",
});

function headingFor(day: CalendarDay, todayKey: string, tomorrowKey: string) {
  if (day.key === todayKey) return "Today";
  if (day.key === tomorrowKey) return "Tomorrow";
  return DAY_LABEL.format(day.date);
}

export default function AgendaList({
  days,
  todayKey,
  tomorrowKey,
}: {
  days: CalendarDay[];
  todayKey: string;
  tomorrowKey: string;
}) {
  const withEvents = days.filter((d) => d.events.length > 0);

  if (withEvents.length === 0) {
    return (
      <div className="border-t border-rule py-16 text-center">
        <p className="font-display text-lg text-muted">
          Nothing listed in the next six weeks.
        </p>
        <p className="mt-2 text-sm text-faint">
          Know of an event? Send us the poster and it will be listed.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {withEvents.map((day, i) => (
        <section
          key={day.key}
          id={`day-${day.key}`}
          className={
            i === 0 ? "scroll-mt-24" : "mt-10 scroll-mt-24 border-t border-rule pt-8"
          }
        >
          <div className="mb-6 flex flex-col gap-1">
            <h2 className="font-display text-[27px] font-medium leading-none tracking-[-0.5px] md:text-[32px]">
              {headingFor(day, todayKey, tomorrowKey)}
            </h2>
            <p className="text-[13px] text-faint">
              {day.key === todayKey || day.key === tomorrowKey
                ? `${DAY_LABEL.format(day.date)} · ${day.hijriShort}`
                : day.hijriShort}
            </p>
          </div>

          <ul className="flex flex-col gap-7">
            {day.events.map((ev) => (
              <li key={ev.id}>
                <Link
                  href={`/events/${ev.slug}`}
                  className="group flex items-start gap-4"
                >
                  <PosterThumb
                    id={ev.id}
                    title={ev.title}
                    organiser={ev.organiser}
                    posterUrl={ev.posterUrl}
                    rounded
                    className="h-[76px] w-[60px] shrink-0"
                  />

                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <h3 className="font-display text-[20px] font-medium leading-[1.22] tracking-[-0.2px] text-pretty group-hover:text-accent">
                      {ev.title}
                    </h3>
                    <p className="text-[13px] leading-[1.45] text-muted">
                      {ev.time ? <span className="tnum">{ev.time}</span> : null}
                      {ev.time && ev.location ? " · " : ""}
                      {ev.location}
                    </p>
                    {ev.organiser ? (
                      <p className="text-[13px] leading-none text-faint">
                        {ev.organiser}
                      </p>
                    ) : null}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
