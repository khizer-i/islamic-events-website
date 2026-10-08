import { ImageResponse } from "next/og";

import { BRAND, LOGO_PATH, LOGO_VIEWBOX } from "@/lib/brand";

export const OG_SIZE = { width: 1200, height: 630 };

/**
 * The share card people see when a link is pasted into WhatsApp, Instagram
 * DMs or X. Paper, ink and oxblood with the crescent mark, so a shared link
 * looks like the site it opens. (It used the old indigo palette until Oct
 * 2026.) Used by event pages and, with no poster, by every other page.
 */
export async function renderShareCard({
  title,
  when = "",
  time = null,
  where = "",
  poster = null,
}: {
  title: string;
  when?: string;
  time?: string | null;
  where?: string;
  poster?: string | null;
}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: BRAND.paper,
          color: BRAND.ink,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "52px 56px",
            width: "700px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                paddingBottom: 22,
                marginBottom: 30,
                borderBottom: `2px solid ${BRAND.ink}`,
              }}
            >
              <svg width="64" height="64" viewBox={LOGO_VIEWBOX}>
                <path fill={BRAND.oxblood} fillRule="evenodd" d={LOGO_PATH} />
              </svg>
              <div
                style={{
                  display: "flex",
                  fontSize: 24,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  color: BRAND.oxblood,
                }}
              >
                UK Islamic Events Calendar
              </div>
            </div>

            <div
              style={{
                display: "flex",
                fontSize: title.length > 60 ? 50 : 62,
                fontWeight: 700,
                lineHeight: 1.12,
                maxHeight: 290,
                overflow: "hidden",
              }}
            >
              {title.length > 110 ? `${title.slice(0, 107)}...` : title}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {when ? (
              <div style={{ display: "flex", fontSize: 30, color: BRAND.oxblood }}>
                {when}
                {time ? ` · ${time}` : ""}
              </div>
            ) : null}
            {where ? (
              <div style={{ display: "flex", fontSize: 26, color: BRAND.muted }}>
                {where.length > 64 ? `${where.slice(0, 61)}...` : where}
              </div>
            ) : null}
          </div>
        </div>

        {poster ? (
          <div
            style={{
              display: "flex",
              width: "500px",
              height: "630px",
              overflow: "hidden",
              borderLeft: `2px solid ${BRAND.ink}`,
            }}
          >
            {/* next/image cannot run inside ImageResponse; a plain img is the only option. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={poster}
              alt=""
              width={498}
              height={630}
              style={{ objectFit: "cover", width: "498px", height: "630px" }}
            />
          </div>
        ) : (
          // No poster (the site-wide card, or an event without one): the
          // mark fills the space instead of leaving half the card empty.
          <div
            style={{
              display: "flex",
              width: "500px",
              height: "630px",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="380" height="380" viewBox={LOGO_VIEWBOX}>
              <path fill={BRAND.oxblood} fillRule="evenodd" d={LOGO_PATH} />
            </svg>
          </div>
        )}
      </div>
    ),
    OG_SIZE
  );
}
