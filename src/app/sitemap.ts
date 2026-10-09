import type { MetadataRoute } from "next";

import {
  SITE_URL,
  cityUrl,
  eventUrl,
  getAllEvents,
  getCitySummaries,
  getUpcomingEvents,
  toDate,
} from "@/lib/events";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [allEvents, upcoming, cities] = await Promise.all([
    getAllEvents(),
    getUpcomingEvents(),
    getCitySummaries(),
  ]);

  const upcomingIds = new Set(upcoming.map((e) => e.id));

  // lastModified is left off pages whose change date is not known. It used
  // to be "now" on every regeneration, and an event's own start date (in
  // the future for upcoming events); Google stops trusting lastmod that
  // claims changes which did not happen.
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/events`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/cities`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/submit`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${SITE_URL}/support`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const cityRoutes: MetadataRoute.Sitemap = cities.map((city) => ({
    url: `${SITE_URL}${cityUrl(city.name)}`,
    changeFrequency: city.upcoming > 0 ? "daily" : "monthly",
    priority: city.upcoming > 0 ? 0.8 : 0.4,
  }));

  // When the row was created: the nearest thing to "last changed" the table
  // records.
  const eventRoutes: MetadataRoute.Sitemap = allEvents.map((ev) => ({
    url: `${SITE_URL}${eventUrl(ev)}`,
    ...(toDate(ev.created_at) ? { lastModified: toDate(ev.created_at)! } : {}),
    changeFrequency: "weekly",
    priority: upcomingIds.has(ev.id) ? 0.9 : 0.3,
  }));

  return [...staticRoutes, ...cityRoutes, ...eventRoutes];
}
