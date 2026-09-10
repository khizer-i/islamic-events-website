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
    <main className="mx-auto max-w-[860px] px-5 py-10 md:px-10 md:py-12">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Cities", path: "/cities" },
        ])}
      />

      <nav aria-label="Breadcrumb" className="mb-6 text-[12px] text-faint">
        <Link href="/" className="hover:text-ink">
          Home
        </Link>
        <span aria-hidden> / </span>
        <span>Cities</span>
      </nav>

      <h1 className="font-display text-[30px] font-medium leading-[1.1] tracking-[-0.6px] md:text-[38px]">
        Islamic events by city
      </h1>
      <p className="mt-3 text-[14px] text-muted md:text-[15px]">
        Pick a city to see what is coming up near you.
      </p>

      {active.length > 0 ? (
        <section className="mt-10">
          <h2 className="label">With upcoming events</h2>
          <ul className="mt-4 grid gap-x-8 sm:grid-cols-2">
            {active.map((city) => (
              <li key={city.slug}>
                <Link
                  href={cityUrl(city.name)}
                  className="flex items-baseline justify-between gap-4 border-t border-rule py-3.5 transition-colors hover:text-accent"
                >
                  <span className="font-display text-[18px] font-medium">
                    {city.name}
                  </span>
                  <span className="tnum text-[13px] text-faint">
                    {city.upcoming}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {quiet.length > 0 ? (
        <section className="mt-12">
          <h2 className="label">Nothing upcoming right now</h2>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {quiet.map((city) => (
              <Link
                key={city.slug}
                href={cityUrl(city.name)}
                className="border border-rule px-3 py-1.5 text-[12px] text-muted transition-colors hover:border-rule-strong hover:text-ink"
              >
                {city.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
