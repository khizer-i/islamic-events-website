import type { Metadata } from "next";
import "./globals.css";
import "../styles/fullcalendar.css";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Link from "next/link";
import Script from "next/script";
import { GA4PageView } from "./ga4-pageview";
import { SITE_URL } from "@/lib/events";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "UK Islamic Events Calendar — lectures, classes and community events",
    template: "%s | UK Islamic Events Calendar",
  },
  description:
    "A free calendar of Islamic events across the UK — lectures, halaqas, classes, fundraisers and community events, collected from community posters.",
  applicationName: "UK Islamic Events Calendar",
  keywords: [
    "islamic events",
    "islamic events UK",
    "muslim events near me",
    "islamic lectures",
    "halaqa",
    "mosque events",
    "islamic calendar UK",
  ],
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    siteName: "UK Islamic Events Calendar",
    locale: "en_GB",
    url: SITE_URL,
    title: "UK Islamic Events Calendar",
    description:
      "Lectures, halaqas, classes, fundraisers and community events across the UK.",
  },
  twitter: {
    card: "summary_large_image",
    title: "UK Islamic Events Calendar",
    description:
      "Lectures, halaqas, classes, fundraisers and community events across the UK.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-GB">
      <body className={inter.className}>

        {/* Google tag scripts */}
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-B1ZKLRVV29"
        />

        <Script
          id="ga4-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-B1ZKLRVV29');
            `,
          }}
        />


        {/* Track route changes */}
        <GA4PageView />

        {children}

        <footer className="mt-10 border-t border-slate-200 py-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <nav className="mb-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <Link href="/" className="hover:text-indigo-600 hover:underline">
              Calendar
            </Link>
            <Link href="/events" className="hover:text-indigo-600 hover:underline">
              Upcoming events
            </Link>
            <Link href="/cities" className="hover:text-indigo-600 hover:underline">
              Browse by city
            </Link>
            <Link href="/support" className="hover:text-indigo-600 hover:underline">
              Support this project
            </Link>
          </nav>
          © {new Date().getFullYear()} Islamic Events Calendar UK
        </footer>

        {/* Vercel Analytics */}
        <Analytics />
      </body>
    </html>
  );
}
