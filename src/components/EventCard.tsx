import Link from "next/link";

import PosterThumb from "./PosterThumb";
import {
  eventLocationLine,
  eventTitle,
  eventUrl,
  formatDateShort,
  formatTime,
  type EventRow,
} from "@/lib/events";

/**
 * A server-rendered event row for the index and city pages. Real HTML in the
 * initial response, which is what a client-rendered calendar never gave us.
 */
export default function EventCard({ event }: { event: EventRow }) {
  const time = formatTime(event.start_datetime_utc);
  const where = eventLocationLine(event);

  return (
    <li>
      <Link
        href={eventUrl(event)}
        className="group flex items-start gap-4 border-t border-rule py-5"
      >
        <PosterThumb
          id={event.id}
          title={eventTitle(event)}
          organiser={event.organiser}
          posterUrl={event.poster_url}
          rounded
          className="h-[76px] w-[60px] shrink-0"
        />

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-accent">
            <span className="tnum">{formatDateShort(event.start_datetime_utc)}</span>
            {time ? <span className="tnum"> · {time}</span> : null}
          </p>

          <h3 className="font-display text-[19px] font-medium leading-[1.22] tracking-[-0.2px] text-pretty group-hover:text-accent">
            {eventTitle(event)}
          </h3>

          {where ? (
            <p className="text-[13px] leading-[1.45] text-muted">{where}</p>
          ) : null}

          {event.organiser ? (
            <p className="text-[13px] leading-none text-faint">
              {event.organiser}
            </p>
          ) : null}
        </div>
      </Link>
    </li>
  );
}
