import { ImageResponse } from "next/og";

import {
  eventLocationLine,
  eventTitle,
  formatDateLong,
  formatTime,
  getEventBySlug,
} from "@/lib/events";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "UK Islamic Events Calendar";

export const revalidate = 900;

/**
 * The share card people see when a link is pasted into WhatsApp, Instagram
 * DMs or X. Without this, a shared event is a bare blue URL.
 */
export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let event = null;
  try {
    event = await getEventBySlug(slug);
  } catch {
    event = null;
  }

  const title = event ? eventTitle(event) : "UK Islamic Events Calendar";
  const when = event ? formatDateLong(event.start_datetime_utc) : "";
  const time = event ? formatTime(event.start_datetime_utc) : null;
  const where = event ? eventLocationLine(event) : "";
  const poster = event?.poster_url ?? null;

  try {
    return await renderCard({ title, when, time, where, poster });
  } catch {
    // A poster that fails to fetch must not break the share card entirely.
    return await renderCard({ title, when, time, where, poster: null });
  }
}

async function renderCard({
  title,
  when,
  time,
  where,
  poster,
}: {
  title: string;
  when: string;
  time: string | null;
  where: string;
  poster: string | null;
}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #1e1b4b 0%, #0f172a 60%)",
          color: "#f8fafc",
          fontFamily: "sans-serif",
        }}
      >
        {/* Text column */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "56px 48px",
            width: poster ? "700px" : "1200px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: 22,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: "#a5b4fc",
                marginBottom: 24,
              }}
            >
              UK Islamic Events Calendar
            </div>

            <div
              style={{
                display: "flex",
                fontSize: title.length > 60 ? 48 : 60,
                fontWeight: 700,
                lineHeight: 1.15,
                maxHeight: 280,
                overflow: "hidden",
              }}
            >
              {title.length > 110 ? `${title.slice(0, 107)}...` : title}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {when ? (
              <div style={{ display: "flex", fontSize: 30, color: "#c7d2fe" }}>
                {when}
                {time ? ` · ${time}` : ""}
              </div>
            ) : null}
            {where ? (
              <div style={{ display: "flex", fontSize: 26, color: "#94a3b8" }}>
                {where.length > 60 ? `${where.slice(0, 57)}...` : where}
              </div>
            ) : null}
          </div>
        </div>

        {/* Poster column */}
        {poster ? (
          <div
            style={{
              display: "flex",
              width: "500px",
              height: "630px",
              overflow: "hidden",
            }}
          >
            <img
              src={poster}
              alt=""
              width={500}
              height={630}
              style={{ objectFit: "cover", width: "500px", height: "630px" }}
            />
          </div>
        ) : null}
      </div>
    ),
    size
  );
}
