/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import type { EventApi, EventInput } from "@fullcalendar/core";
import moment from "moment-hijri";

import CalendarView from "./CalendarView";
import FiltersBar from "./FiltersBar";

type CalendarWithModalProps = {
    events: EventInput[];
    cities: string[];
    tags: string[];
};

const HIJRI_MONTHS = [
    "Muharram",
    "Safar",
    "Rabi al-Awwal",
    "Rabi al-Thani",
    "Jumada al-Awwal",
    "Jumada al-Thani",
    "Rajab",
    "Shaʿban",
    "Ramadan",
    "Shawwal",
    "Dhu al-Qaʿdah",
    "Dhu al-Hijjah",
];

export default function CalendarWithModal({
    events,
    cities,
    tags,
}: CalendarWithModalProps) {
    const [selectedEvent, setSelectedEvent] = useState<EventApi | null>(null);
    const [selectedCity, setSelectedCity] = useState("ALL");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    const [dayListOpen, setDayListOpen] = useState(false);
    const [dayListDate, setDayListDate] = useState<Date | null>(null);
    const [dayListEvents, setDayListEvents] = useState<EventApi[]>([]);

    const handleEventClick = (event: EventApi) => setSelectedEvent(event);
    const closeModal = () => setSelectedEvent(null);

    const handleMoreClick = (date: Date, dayEvents: EventApi[]) => {
        // Sort by start time
        const sorted = [...dayEvents].sort((a, b) => {
            const aT = a.start?.getTime() ?? 0;
            const bT = b.start?.getTime() ?? 0;
            return aT - bT;
        });

        setDayListDate(date);
        setDayListEvents(sorted);
        setDayListOpen(true);
    };

    const filteredEvents: EventInput[] = events.filter((ev) => {
        const ext = (ev as EventInput).extendedProps as
            | { city?: string | null; tags?: string[] | null }
            | undefined;

        const city = ext?.city;
        const eventTags: string[] = ext?.tags ?? [];

        const cityMatch = selectedCity === "ALL" || city === selectedCity;
        const tagMatch =
            selectedTags.length === 0 ||
            selectedTags.every((t) => eventTags.includes(t));

        return cityMatch && tagMatch;
    });

    // Today (Gregorian + Hijri)
    const today = new Date();
    const gregToday = today.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    const mToday = moment(today).locale("en");
    const hijriDay = mToday.format("iD");
    const hijriMonthIndex = Number(mToday.format("iM")) - 1;
    const hijriMonthName = HIJRI_MONTHS[hijriMonthIndex] ?? "";
    const hijriYear = mToday.format("iYYYY");
    const hijriToday = `${hijriDay} ${hijriMonthName} ${hijriYear}`;

    const posterUrl =
        selectedEvent?.extendedProps?.poster_url ||
        selectedEvent?.extendedProps?.posterUrl;

    const title = selectedEvent?.title ?? "Event";
    const city = selectedEvent?.extendedProps?.city as string | null | undefined;
    const venue = selectedEvent?.extendedProps?.venue_name as
        | string
        | null
        | undefined;
    const organiser = selectedEvent?.extendedProps?.organiser as
        | string
        | null
        | undefined;
    const tagsList = selectedEvent?.extendedProps?.tags as string[] | undefined;
    const notes = selectedEvent?.extendedProps?.notes as string | undefined;
    const caption = selectedEvent?.extendedProps?.caption as string | undefined;

    const formatTagLabel = (tag: string) =>
        tag
            .split(" ")
            .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
            .join(" ");

    return (
        <>
            {/* Today label + filter summary */}
            <p className="mb-1 text-xs text-slate-600 dark:text-slate-300">
                Today: {gregToday} · {hijriToday} AH
            </p>
            <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
                Showing:{" "}
                {selectedCity === "ALL" ? "all cities" : selectedCity}{" "}
                {selectedTags.length > 0
                    ? `· tags: ${selectedTags.map(formatTagLabel).join(", ")}`
                    : "· all tags"}
            </p>

            <FiltersBar
                cities={cities}
                tags={tags}
                selectedCity={selectedCity}
                selectedTags={selectedTags}
                onCityChange={setSelectedCity}
                onTagsChange={setSelectedTags}
                onReset={() => {
                    setSelectedCity("ALL");
                    setSelectedTags([]);
                }}
            />

            <CalendarView events={filteredEvents} onEventClick={handleEventClick} onMoreClick={handleMoreClick} />
            {dayListOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-2 py-4 sm:items-center sm:px-4 sm:py-8"
                    onClick={() => setDayListOpen(false)}
                >
                    <div
                        className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/80">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                                    Events on this day
                                </h3>
                                <p className="text-xs text-slate-600 dark:text-slate-300">
                                    {dayListDate
                                        ? dayListDate.toLocaleDateString("en-GB", {
                                            weekday: "long",
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                        })
                                        : ""}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setDayListOpen(false)}
                                className="cursor-pointer rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-200 dark:bg-slate-800 dark:text-indigo-200 dark:hover:bg-slate-700"
                            >
                                Close
                            </button>
                        </div>

                        <div className="max-h-[70vh] overflow-y-auto">
                            {dayListEvents.map((ev) => {
                                const start = ev.start
                                    ? ev.start.toLocaleTimeString("en-GB", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })
                                    : "";

                                return (
                                    <button
                                        key={ev.id}
                                        type="button"
                                        className="flex w-full items-start justify-between gap-3 border-b border-slate-200 px-4 py-3 text-left hover:bg-indigo-50 dark:border-slate-800 dark:hover:bg-slate-800"
                                        onClick={() => {
                                            setSelectedEvent(ev);
                                        }}
                                        style={{ cursor: "pointer" }}
                                    >
                                        <div className="min-w-0">
                                            <div className="truncate text-sm font-medium text-slate-900 dark:text-slate-50">
                                                {ev.title}
                                            </div>
                                            <div className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                                                {start}
                                            </div>
                                        </div>

                                        <span className="shrink-0 rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-medium text-indigo-700 dark:bg-slate-800 dark:text-indigo-200">
                                            View
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal */}
            {selectedEvent && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-2 py-4 sm:px-4 sm:py-8"
                    onClick={closeModal}
                >
                    <div
                        className="relative flex h-full w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 sm:h-auto sm:max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/80 sm:px-5">
                            <h2 className="mr-4 line-clamp-2 text-sm font-semibold text-slate-900 dark:text-slate-50 sm:text-base">
                                {title}
                            </h2>
                            <button
                                onClick={closeModal}
                                className="cursor-pointer rounded-full p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                                aria-label="Close"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Content */}
                        <div className="grid gap-4 overflow-y-auto px-4 py-3 sm:grid-cols-[minmax(0,1.05fr),minmax(0,1.2fr)] sm:px-5 sm:py-4">
                            {/* Poster */}
                            <div className="flex items-start justify-center">
                                {posterUrl ? (
                                    <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
                                        <img
                                            src={posterUrl}
                                            alt={title}
                                            className="max-h-[65vh] w-full object-contain"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex h-40 w-full items-center justify-center rounded-xl border border-dashed border-slate-300 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-300">
                                        No poster available for this event.
                                    </div>
                                )}
                            </div>

                            {/* Caption + details */}
                            <div className="flex flex-col gap-3 text-sm text-slate-800 dark:text-slate-100">
                                {caption && (
                                    <div>
                                        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                            Caption
                                        </div>
                                        <p className="whitespace-pre-line text-sm">{caption}</p>
                                    </div>
                                )}

                                <div className="space-y-1 text-sm">
                                    {venue && (
                                        <div>
                                            <span className="font-medium">Venue: </span>
                                            {venue}
                                        </div>
                                    )}
                                    {city && (
                                        <div>
                                            <span className="font-medium">City: </span>
                                            {city}
                                        </div>
                                    )}
                                    {organiser && (
                                        <div>
                                            <span className="font-medium">Organiser: </span>
                                            {organiser}
                                        </div>
                                    )}
                                </div>

                                {tagsList && tagsList.length > 0 && (
                                    <div className="flex flex-wrap gap-1 text-xs">
                                        {tagsList.map((tag) => (
                                            <span
                                                key={tag}
                                                className="rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                            >
                                                {formatTagLabel(tag)}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {notes && (
                                    <p className="text-xs text-slate-600 dark:text-slate-300">
                                        <span className="font-medium">Notes: </span>
                                        {notes}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/80 sm:px-5">
                            <button
                                onClick={closeModal}
                                className="cursor-pointer rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 dark:bg-indigo-400 dark:text-slate-900 dark:hover:bg-indigo-300"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
