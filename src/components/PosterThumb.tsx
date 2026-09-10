/* eslint-disable @next/next/no-img-element */

/**
 * A poster, or a deterministic tinted monogram when there isn't one.
 * The tint is derived from the event id so a given event always looks the
 * same, and the palette is drawn from the tones posters in this community
 * actually use — deep greens, browns and inks rather than grey boxes.
 */

const TINTS = [
  "#2E3A2C",
  "#5B4A3A",
  "#3B3A55",
  "#6B3A2E",
  "#322028",
  "#1F2A2C",
  "#24301F",
  "#413049",
];

function tintFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return TINTS[h % TINTS.length];
}

function monogram(source: string): string {
  const words = source
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export default function PosterThumb({
  id,
  title,
  organiser,
  posterUrl,
  className = "",
  rounded = false,
}: {
  id: string;
  title: string;
  organiser?: string | null;
  posterUrl?: string | null;
  className?: string;
  rounded?: boolean;
}) {
  const radius = rounded ? "rounded-[2px]" : "";

  if (posterUrl) {
    return (
      <img
        src={posterUrl}
        alt=""
        loading="lazy"
        decoding="async"
        className={`object-cover ${radius} ${className}`}
      />
    );
  }

  const tint = tintFor(id);
  const letters = monogram(organiser || title);

  return (
    <div
      aria-hidden
      style={{ backgroundColor: tint }}
      className={`flex items-end justify-start ${radius} ${className}`}
    >
      <span className="font-display px-1.5 pb-1 text-[11px] font-medium leading-none text-white/55">
        {letters}
      </span>
    </div>
  );
}
