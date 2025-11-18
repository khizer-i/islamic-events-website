import Link from "next/link";

const email = "contact@islamiceventscalendar.co.uk";

export default function SupportPage() {
    return (
        <main className="mx-auto max-w-4xl px-4 pb-16 pt-12">
            {/* Header */}
            <section className="mb-10 rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
                <h1 className="text-xl font-semibold">Support this project</h1>
                <p className="mt-2 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    This calendar is built and maintained as a community service to make it easier to
                    discover Islamic events across the UK. Your support helps keep this calendar online, accurate, and free for everyone to use.
                </p>
            </section>

            {/* Donation + Contact */}
            <section className="grid gap-4 md:grid-cols-2">
                {/* Donate */}
                <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
                    <h2 className="text-sm font-semibold">Donate</h2>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                        A simple way to contribute towards hosting and running costs.
                    </p>

                    <a
                        href="https://paypal.me/islamiceventsuk"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex w-full items-center justify-center rounded-full
              bg-indigo-600 px-4 py-2 text-xs font-medium text-white shadow-sm
              hover:bg-indigo-700 transition dark:bg-indigo-500 dark:hover:bg-indigo-400"
                    >
                        Donate via PayPal
                    </a>

                    <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                        You will be taken to a secure PayPal page to complete your donation.
                    </p>
                </div>

                {/* Contact */}
                <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
                    <h2 className="text-sm font-semibold">Get in touch</h2>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                        To add your events, or if you need help using the calendar, you can reach out:
                    </p>

                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                        Email:{" "}
                        <a
                            href={`mailto:${email}`}
                            className="font-mono underline decoration-dotted underline-offset-2"
                        >
                            {email}
                        </a>
                    </p>
                </div>
            </section>

            {/* Sponsor section */}
            <section className="mt-6 rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
                <h2 className="text-sm font-semibold">Sponsor an event slot</h2>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    If you run an organisation, business, or project and would like to visibly support this
                    service, you can sponsor a slot on the calendar website. Sponsor messages help cover
                    monthly running costs while keeping the calendar free for everyone.
                </p>

                <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                    For details on pricing and availability, get in touch:
                </p>

                <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                    Email:{" "}
                    <a
                        href={`mailto:${email}`}
                        className="font-mono underline decoration-dotted underline-offset-2"
                    >
                        {email}
                    </a>
                </p>
            </section>


            {/* Back button */}
            <div className="mt-10 flex justify-center">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2
            text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700
            dark:bg-indigo-500 dark:hover:bg-indigo-400"
                >
                    ← Back to Calendar
                </Link>
            </div>
        </main>
    );
}
