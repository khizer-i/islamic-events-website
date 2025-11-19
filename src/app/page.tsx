import { supabase } from "@/lib/supabaseClient";
import CalendarWithModal from "@/components/CalendarWithModal";
import type { EventInput } from "@fullcalendar/core";

type EventRow = {
  id: string;
  title: string | null;
  organiser: string | null;
  start_datetime_utc: string | null;
  end_datetime_utc: string | null;
  venue_name: string | null;
  city: string | null;
  tags: string[] | null;
  notes: string | null;
  poster_url: string | null;
  source_caption: string | null;
  status: string | null;
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("status", "published")
    .order("start_datetime_utc", { ascending: true });

  if (error) {
    console.error("Supabase error:", error);
  }

  const rows: EventRow[] = (data ?? []) as EventRow[];

  const events: EventInput[] =
    rows.map((ev) => ({
      id: ev.id,
      title: ev.title ?? "Untitled event",
      // FullCalendar expects DateInput | undefined, not null
      start: ev.start_datetime_utc ?? undefined,
      end: ev.end_datetime_utc ?? undefined,
      extendedProps: {
        city: ev.city,
        venue_name: ev.venue_name,
        organiser: ev.organiser,
        tags: ev.tags,
        notes: ev.notes,
        poster_url: ev.poster_url,
        caption: ev.source_caption,
      },
    })) || [];

  const cities = Array.from(
    new Set(rows.map((ev) => ev.city).filter((c): c is string => Boolean(c)))
  ).sort();

  const tags = Array.from(
    new Set(
      rows.flatMap((ev) => (ev.tags && ev.tags.length > 0 ? ev.tags : []))
    )
  ).sort();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-4 text-slate-900 dark:bg-slate-950 dark:text-slate-50 md:px-6 md:py-6">
      {/* HEADER */}
      <header className="mb-4 md:mb-6">
        <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/90 md:px-5 md:py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-lg font-semibold md:text-xl">
                UK Islamic Events Calendar
              </h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                A curated view of Islamic events across the UK, extracted
                automatically from community posters.
              </p>
            </div>

            <div className="flex flex-col items-start gap-1 md:items-end">
              <a
                href="/support"
                className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-indigo-700 md:px-3.5 md:py-1.5 md:text-sm dark:bg-indigo-400 dark:text-slate-900 dark:hover:bg-indigo-300"
              >
                <span className="mr-1 text-indigo-100 dark:text-indigo-900">
                  ♥
                </span>
                <span>Support this project</span>
              </a>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Built &amp; maintained as a community service.
              </span>
            </div>
          </div>
        </div>
      </header>

      <CalendarWithModal events={events} cities={cities} tags={tags} />
    </main>
  );
}
