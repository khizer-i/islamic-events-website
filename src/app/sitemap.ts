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
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/events`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/cities`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/support`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const cityRoutes: MetadataRoute.Sitemap = cities.map((city) => ({
    url: `${SITE_URL}${cityUrl(city.name)}`,
    lastModified: now,
    changeFrequency: city.upcoming > 0 ? "daily" : "monthly",
    priority: city.upcoming > 0 ? 0.8 : 0.4,
  }));

  const eventRoutes: MetadataRoute.Sitemap = allEvents.map((ev) => ({
    url: `${SITE_URL}${eventUrl(ev)}`,
    lastModified: toDate(ev.start_datetime_utc) ?? now,
    changeFrequency: "weekly",
    priority: upcomingIds.has(ev.id) ? 0.9 : 0.3,
  }));

  return [...staticRoutes, ...cityRoutes, ...eventRoutes];
}
