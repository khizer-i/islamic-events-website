import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-[760px] flex-col items-start px-5 py-20 md:px-10 md:py-28">
      <p className="label">404</p>
      <h1 className="mt-3 font-display text-[30px] font-medium leading-[1.1] tracking-[-0.6px] md:text-[38px]">
        We couldn&rsquo;t find that page
      </h1>
      <p className="mt-3 text-[15px] leading-[1.6] text-muted">
        It may have been an event that has since been removed.
      </p>
      <div className="mt-7 flex flex-wrap gap-2.5">
        <Link
          href="/"
          className="flex h-12 items-center justify-center bg-fill px-5 text-[14px] font-medium text-fill-text transition-opacity hover:opacity-85"
        >
          Open the calendar
        </Link>
        <Link
          href="/events"
          className="flex h-12 items-center justify-center border border-rule-strong px-5 text-[14px] font-medium transition-colors hover:bg-paper-sunk"
        >
          Upcoming events
        </Link>
      </div>
    </main>
  );
}
