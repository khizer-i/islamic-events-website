"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import type { EventApi, EventInput, MoreLinkArg } from "@fullcalendar/core";
import enGbLocale from "@fullcalendar/core/locales/en-gb";
import moment from "moment-hijri";


type CalendarViewProps = {
    events: EventInput[];
    onEventClick?: (event: EventApi) => void;
    onMoreClick?: (date: Date, events: EventApi[]) => void;
};

const HIJRI_MONTHS = [
    "Muh.",
    "Saf.",
    "Rab. I",
    "Rab. II",
    "Jum. I",
    "Jum. II",
    "Raj.",
    "Sha.",
    "Ram.",
    "Shaw.",
    "Dhu’l-Q.",
    "Dhu’l-H.",
];

export default function CalendarView({ events, onEventClick, onMoreClick }: CalendarViewProps) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
            <div className="fc-wrap">
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                    initialView="dayGridMonth"
                    firstDay={1}
                    locales={[enGbLocale]}
                    locale="en-gb"
                    headerToolbar={{
                        start: "today prev,next",
                        center: "title",
                        end: "dayGridMonth,timeGridWeek,listWeek",
                    }}
                    buttonText={{
                        today: "Today",
                        month: "Month",
                        week: "Week",
                        list: "List",
                    }}
                    events={events}
                    slotEventOverlap={false}
                    height="auto"
                    timeZone="Europe/London"
                    nowIndicator={true}
                    eventTimeFormat={{
                        hour: "numeric",
                        minute: "2-digit",
                        meridiem: "short",
                    }}
                    dayHeaderContent={(arg) => {
                        if (arg.view.type === "timeGridWeek") {
                            return arg.date.toLocaleDateString("en-GB", {
                                weekday: "short",
                                day: "2-digit",
                                month: "2-digit",
                            });
                        }
                        return arg.text;
                    }}
                    views={{
                        dayGridMonth: {
                            dayMaxEventRows: 3,
                            titleFormat: { month: "long", year: "numeric" },
                        },
                        timeGridWeek: {
                            slotMinTime: "08:00:00",
                            slotMaxTime: "23:00:00",
                        },
                        listWeek: {
                            listDaySideFormat: {
                                weekday: "short",
                                day: "2-digit",
                                month: "2-digit",
                            },
                        },
                    }}
                    // Hijri overlay (month view)
                    dayCellDidMount={(info) => {
                        if (info.view.type !== "dayGridMonth") return;

                        const m = moment(info.date).locale("en");
                        const hijriDay = m.format("iD");
                        const hijriMonthIndex = Number(m.format("iM")) - 1;
                        const hijriMonthName = HIJRI_MONTHS[hijriMonthIndex] ?? "";

                        const hijriStr =
                            hijriDay === "1" && hijriMonthName
                                ? `${hijriMonthName}`
                                : hijriDay;

                        const cellEl = info.el as HTMLElement | null;
                        if (!cellEl) return;

                        cellEl.style.position = "relative";
                        const hijriEl = document.createElement("div");
                        hijriEl.textContent = hijriStr;
                        hijriEl.style.position = "absolute";
                        hijriEl.style.bottom = "2px";
                        hijriEl.style.left = "4px";
                        hijriEl.style.fontSize = "0.65rem";
                        hijriEl.style.opacity = "0.8";
                        hijriEl.style.pointerEvents = "none";
                        hijriEl.style.color = "rgb(148 163 184)"; // slate-400
                        cellEl.appendChild(hijriEl);
                    }}
                    // Event styling: indigo, with pill vs block per view
                    eventClassNames={(arg) => {
                        const base = [
                            "!border-none",
                            "!px-2",
                            "!py-1",
                            "text-xs",
                            "font-medium",
                            "bg-indigo-100",
                            "text-indigo-900",
                            "dark:bg-indigo-900/40",
                            "dark:text-indigo-100",
                        ];

                        // Month + list = pill
                        if (arg.view.type === "dayGridMonth" || arg.view.type === "listWeek") {
                            base.push("rounded-full");
                        }

                        // Week (time grid) = rectangular block
                        if (arg.view.type === "timeGridWeek") {
                            base.push("rounded-md");
                        }

                        return base;
                    }}
                    eventMouseEnter={(info) => {
                        (info.el as HTMLElement).classList.add("shadow-sm");
                    }}
                    eventMouseLeave={(info) => {
                        (info.el as HTMLElement).classList.remove("shadow-sm");
                    }}
                    eventClick={(info) => {
                        info.jsEvent.preventDefault();
                        onEventClick?.(info.event);
                    }}
                    moreLinkClick={(arg: MoreLinkArg) => {
                        // If parent didn’t provide a handler, keep FullCalendar’s default behaviour
                        if (!onMoreClick) return "popover";

                        const dayEvents = arg.allSegs.map((seg) => seg.event); // events for that day
                        onMoreClick(arg.date, dayEvents);

                        return "none"; // prevents the default bottom popover/modal
                    }}
                />
            </div>
        </div>
    );
}
