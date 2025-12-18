"use client";

import { useMemo, useState } from "react";

type FiltersBarProps = {
    cities: string[];
    tags: string[];
    selectedCity: string;
    selectedTags: string[];
    onCityChange: (city: string) => void;
    onTagsChange: (tags: string[]) => void;
    onReset: () => void;
};

export default function FiltersBar({
    cities,
    tags,
    selectedCity,
    selectedTags,
    onCityChange,
    onTagsChange,
    onReset,
}: FiltersBarProps) {
    const TAG_LIMIT = 16;
    const [showAllTags, setShowAllTags] = useState(false);

    const toggleTag = (tag: string) => {
        if (selectedTags.includes(tag)) {
            onTagsChange(selectedTags.filter((t) => t !== tag));
        } else {
            onTagsChange([...selectedTags, tag]);
        }
    };

    const formatTagLabel = (tag: string) =>
        tag
            .split(" ")
            .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
            .join(" ");

    const visibleTags = useMemo(() => {
        if (showAllTags) return tags;

        const top = tags.slice(0, TAG_LIMIT);
        const selectedOutsideTop = selectedTags.filter((t) => !top.includes(t));
        return [...top, ...selectedOutsideTop];
    }, [tags, selectedTags, showAllTags]);

    return (
        <section className="mb-3 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 md:mb-4 md:p-4">
            <div className="grid gap-3 md:grid-cols-[220px,1fr,120px] md:items-start">
                {/* City select */}
                <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                        City
                    </label>
                    <select
                        className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-xs text-slate-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                        value={selectedCity}
                        onChange={(e) => onCityChange(e.target.value)}
                    >
                        <option value="ALL">All cities</option>
                        {cities.map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Tags */}
                <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                        Tags
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                        {visibleTags.map((tag) => {
                            const active = selectedTags.includes(tag);
                            return (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => toggleTag(tag)}
                                    className={
                                        "rounded-full border px-2.5 py-1 text-[11px] transition " +
                                        (active
                                            ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-900/40 dark:text-indigo-100"
                                            : "border-slate-300 bg-slate-50 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/60 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-indigo-400 dark:hover:bg-indigo-900/40 dark:hover:text-indigo-100")
                                    }
                                >
                                    {formatTagLabel(tag)}
                                </button>
                            );
                        })}
                        {tags.length > TAG_LIMIT && (
                            <button
                                type="button"
                                onClick={() => setShowAllTags((v) => !v)}
                                className="mt-2 inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-200 dark:bg-slate-900 dark:text-indigo-200 dark:hover:bg-slate-800"
                            >
                                {showAllTags ? "Show fewer" : `Show more (${Math.max(0, tags.length - TAG_LIMIT)})`}
                            </button>
                        )}
                    </div>
                </div>

                {/* Reset */}
                <div className="flex items-end justify-start md:justify-end">
                    <button
                        type="button"
                        onClick={onReset}
                        className="inline-flex items-center rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:border-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-800"
                    >
                        Reset filters
                    </button>
                </div>
            </div>
        </section>
    );
}
