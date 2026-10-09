import { SITE_NAME } from "@/lib/brand";
import { OG_SIZE, renderShareCard } from "@/lib/og-card";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = SITE_NAME;

/**
 * The share card for every page without its own: the homepage, /events,
 * /cities and /submit (the link sent to organisers). Event pages override it
 * with events/[slug]/opengraph-image.tsx.
 */
export default async function OpengraphImage() {
  return renderShareCard({
    title: "Islamic events, classes and talks across the UK",
    where: "Free to browse, free to list your event",
  });
}
