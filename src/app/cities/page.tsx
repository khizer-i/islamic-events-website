import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd, breadcrumbJsonLd } from "@/lib/structured-data";
import { SITE_URL, cityUrl, getCitySummaries } from "@/lib/events";

export const revalidate = 900;

export const metadata: Metadata = {
  title: "Islamic events by city",
  description:
    "Browse Islamic events by UK city — London, Birmingham, Manchester, Leicester, Bradford and more.",
  alternates: { canonical: `${SITE_URL}/cities` },
};

export default async function CitiesPage() {
  const cities = await getCitySummaries();
  const active = cities.filter((c) => c.upcoming > 0);
  const quiet = cities.filter((c) => c.upcoming === 0);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-50 md:px-6">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Cities", path: "/cities" },
        ])}
      />

      <div className="mx-auto max-w-4xl">
        <nav
          aria-label="Breadcrumb"
          className="mb-4 text-xs text-slate-500 dark:text-slate-400"
        >
          <Link href="/" className="hover:text-indigo-600 hover:underline">
            Home
          </Link>
          <span aria-hidden> › </span>
          <span>Cities</span>
        </nav>

        <h1 className="text-xl font-semibold md:text-2xl">
          Islamic events by city
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Pick a city to see what is coming up near you.
        </p>

        {active.length > 0 ? (
          <section className="mt-6">
            <h2 className="mb-3 text-sm font-semibold">With upcoming events</h2>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {active.map((city) => (
                <li key={city.slug}>
                  <Link
                    href={cityUrl(city.name)}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium shadow-sm transition hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500"
                  >
                    <span>{city.name}</span>
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                      {city.upcoming}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {quiet.length > 0 ? (
          <section className="mt-8">
            <h2 className="mb-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
              Nothing upcoming right now
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {quiet.map((city) => (
                <Link
                  key={city.slug}
                  href={cityUrl(city.name)}
                  className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-600 transition hover:border-indigo-400 hover:text-indigo-700 dark:border-slate-700 dark:text-slate-300 dark:hover:text-indigo-300"
                >
                  {city.name}
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
