import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import EventCard from "@/components/EventCard";
import { JsonLd, breadcrumbJsonLd, eventListJsonLd } from "@/lib/structured-data";
import {
  SITE_URL,
  cityUrl,
  getCityBySlug,
  getCitySummaries,
  getEventsInCity,
  groupByMonth,
} from "@/lib/events";

export const revalidate = 900;
export const dynamicParams = true;

type Props = { params: Promise<{ city: string }> };

export async function generateStaticParams() {
  const cities = await getCitySummaries();
  return cities.map((c) => ({ city: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: slug } = await params;
  const city = await getCityBySlug(slug);

  if (!city) {
    return { title: "City not found", robots: { index: false, follow: true } };
  }

  const title = `Islamic events in ${city.name}`;
  const description = `Upcoming Islamic events, lectures, classes and community gatherings in ${city.name}. ${
    city.upcoming > 0
      ? `${city.upcoming} event${city.upcoming === 1 ? "" : "s"} currently listed.`
      : "Updated as new events are shared."
  }`;

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}${cityUrl(city.name)}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}${cityUrl(city.name)}`,
    },
  };
}

export default async function CityPage({ params }: Props) {
  const { city: slug } = await params;
  const city = await getCityBySlug(slug);

  if (!city) notFound();

  const { upcoming, past } = await getEventsInCity(city.name);
  const months = groupByMonth(upcoming);
  const otherCities = (await getCitySummaries())
    .filter((c) => c.slug !== city.slug && c.upcoming > 0)
    .slice(0, 12);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-50 md:px-6">
      <JsonLd
        data={[
          eventListJsonLd(upcoming, `Islamic events in ${city.name}`),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Cities", path: "/cities" },
            { name: city.name, path: cityUrl(city.name) },
          ]),
        ]}
      />

      <div className="mx-auto max-w-5xl">
        <nav
          aria-label="Breadcrumb"
          className="mb-4 text-xs text-slate-500 dark:text-slate-400"
        >
          <Link href="/" className="hover:text-indigo-600 hover:underline">
            Home
          </Link>
          <span aria-hidden> › </span>
          <Link href="/cities" className="hover:text-indigo-600 hover:underline">
            Cities
          </Link>
          <span aria-hidden> › </span>
          <span>{city.name}</span>
        </nav>

        <header className="mb-6">
          <h1 className="text-xl font-semibold md:text-2xl">
            Islamic events in {city.name}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
            {upcoming.length > 0
              ? `${upcoming.length} upcoming event${upcoming.length === 1 ? "" : "s"} in ${city.name}, taken from posters shared by the community.`
              : `No upcoming events are listed in ${city.name} at the moment. Past events are shown below.`}
          </p>
        </header>

        {months.map(([month, monthEvents]) => (
          <section key={month} className="mb-8">
            <h2 className="mb-3 border-b border-slate-200 pb-1 text-sm font-semibold dark:border-slate-800">
              {month}
            </h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {monthEvents.map((ev) => (
                <EventCard key={ev.id} event={ev} />
              ))}
            </ul>
          </section>
        ))}

        {past.length > 0 ? (
          <section className="mb-8">
            <h2 className="mb-3 border-b border-slate-200 pb-1 text-sm font-semibold text-slate-500 dark:border-slate-800 dark:text-slate-400">
              Previously in {city.name}
            </h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {past.slice(0, 12).map((ev) => (
                <EventCard key={ev.id} event={ev} />
              ))}
            </ul>
          </section>
        ) : null}

        {otherCities.length > 0 ? (
          <section>
            <h2 className="mb-2 text-sm font-semibold">Other cities</h2>
            <div className="flex flex-wrap gap-1.5">
              {otherCities.map((c) => (
                <Link
                  key={c.slug}
                  href={cityUrl(c.name)}
                  className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-indigo-400 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:text-indigo-300"
                >
                  {c.name}
                  <span className="ml-1 text-slate-400">{c.upcoming}</span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
