/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import {
  eventLocationLine,
  eventTitle,
  eventUrl,
  formatDateShort,
  formatTagLabel,
  formatTime,
  type EventRow,
} from "@/lib/events";

/**
 * A server-rendered event row. Everything here is real HTML in the initial
 * response, which is what the calendar view (client-rendered) never gave us.
 */
export default function EventCard({ event }: { event: EventRow }) {
  const time = formatTime(event.start_datetime_utc);
  const where = eventLocationLine(event);

  return (
    <li className="list-none">
      <Link
        href={eventUrl(event)}
        className="group flex gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500"
      >
        <div className="hidden h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800 sm:block">
          {event.poster_url ? (
            <img
              src={event.poster_url}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
            {formatDateShort(event.start_datetime_utc)}
            {time ? ` · ${time}` : ""}
          </p>

          <h3 className="mt-0.5 line-clamp-2 text-sm font-semibold text-slate-900 group-hover:text-indigo-700 dark:text-slate-50 dark:group-hover:text-indigo-300">
            {eventTitle(event)}
          </h3>

          {where ? (
            <p className="mt-0.5 line-clamp-1 text-xs text-slate-600 dark:text-slate-300">
              {where}
            </p>
          ) : null}

          {event.organiser ? (
            <p className="mt-0.5 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
              {event.organiser}
            </p>
          ) : null}

          {event.tags && event.tags.length > 0 ? (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {event.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  {formatTagLabel(tag)}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </Link>
    </li>
  );
}
