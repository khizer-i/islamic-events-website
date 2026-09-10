import Link from "next/link";

const NAV = [
  { href: "/", label: "Calendar" },
  { href: "/events", label: "Upcoming" },
  { href: "/cities", label: "Cities" },
];

export default function SiteHeader() {
  return (
    <header className="border-b border-rule-strong">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-5 py-4 md:px-10 md:py-5">
        <div className="flex items-baseline gap-5 md:gap-7">
          <Link
            href="/"
            className="font-display text-[20px] font-semibold tracking-[-0.3px] md:text-[25px]"
          >
            Islamic Events
          </Link>

          <nav className="hidden items-baseline gap-5 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-[13px] text-muted transition-colors hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <Link
          href="/submit"
          className="shrink-0 bg-fill px-3.5 py-2.5 text-[12px] font-medium text-fill-text transition-opacity hover:opacity-85 md:px-4 md:text-[13px]"
        >
          Add your event
        </Link>
      </div>
    </header>
  );
}
