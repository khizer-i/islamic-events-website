import { LOGO_PATH, LOGO_VIEWBOX } from "@/lib/brand";

/**
 * The crescent-and-calendar mark, inline so it takes the text colour it sits
 * in. Give it `text-accent` for oxblood by day and brass at night.
 * Decorative by default; pass `title` when it stands alone without a label.
 */
export default function LogoMark({
  className = "",
  title,
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox={LOGO_VIEWBOX}
      className={className}
      fill="currentColor"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      <path fillRule="evenodd" d={LOGO_PATH} />
    </svg>
  );
}
