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
    .slice(0, 14);

  return (
    <main className="mx-auto max-w-[860px] px-5 py-10 md:px-10 md:py-12">
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

      <nav aria-label="Breadcrumb" className="mb-6 text-[12px] text-faint">
        <Link href="/" className="hover:text-ink">
          Home
        </Link>
        <span aria-hidden> / </span>
        <Link href="/cities" className="hover:text-ink">
          Cities
        </Link>
        <span aria-hidden> / </span>
        <span>{city.name}</span>
      </nav>

      <h1 className="font-display text-[30px] font-medium leading-[1.1] tracking-[-0.6px] md:text-[38px]">
        Islamic events in {city.name}
      </h1>
      <p className="mt-3 max-w-xl text-[14px] leading-[1.6] text-muted md:text-[15px]">
        {upcoming.length > 0
          ? `${upcoming.length} upcoming event${upcoming.length === 1 ? "" : "s"} in ${city.name}, taken from posters shared by the community.`
          : `No upcoming events are listed in ${city.name} at the moment.`}
      </p>

      {months.map(([month, monthEvents]) => (
        <section key={month} className="mt-11">
          <h2 className="font-display text-[21px] font-medium tracking-[-0.3px]">
            {month}
          </h2>
          <ul className="mt-3">
            {monthEvents.map((ev) => (
              <EventCard key={ev.id} event={ev} />
            ))}
          </ul>
        </section>
      ))}

      {past.length > 0 ? (
        <section className="mt-14">
          <h2 className="label">Previously in {city.name}</h2>
          <ul className="mt-3 opacity-70">
            {past.slice(0, 10).map((ev) => (
              <EventCard key={ev.id} event={ev} />
            ))}
          </ul>
        </section>
      ) : null}

      {otherCities.length > 0 ? (
        <section className="mt-14 border-t border-rule pt-8">
          <h2 className="label">Other cities</h2>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {otherCities.map((c) => (
              <Link
                key={c.slug}
                href={cityUrl(c.name)}
                className="border border-rule px-3 py-1.5 text-[12px] text-muted transition-colors hover:border-rule-strong hover:text-ink"
              >
                {c.name}
                <span className="ml-1.5 text-faint">{c.upcoming}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
