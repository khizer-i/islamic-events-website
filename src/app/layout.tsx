import type { Metadata } from "next";
import "./globals.css";
import { Archivo, Newsreader } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Link from "next/link";
import Script from "next/script";
import { GA4PageView } from "./ga4-pageview";
import SiteHeader from "@/components/SiteHeader";
import { SITE_URL } from "@/lib/events";

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-newsreader",
  display: "swap",
});

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-archivo",
  display: "swap",
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
    <html
      lang="en-GB"
      className={`${newsreader.variable} ${archivo.variable}`}
    >
      <body className="flex min-h-full flex-col">
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
        <GA4PageView />

        <SiteHeader />

        <div className="flex-1">{children}</div>

        <footer className="mt-16 border-t border-rule">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-5 py-8 text-[12px] text-faint md:flex-row md:items-center md:justify-between md:px-10">
            <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <Link href="/events" className="hover:text-ink">
                Upcoming events
              </Link>
              <Link href="/cities" className="hover:text-ink">
                Browse by city
              </Link>
              <Link href="/submit" className="hover:text-ink">
                Add your event
              </Link>
              <Link href="/support" className="hover:text-ink">
                Support this project
              </Link>
            </nav>
            <p>© {new Date().getFullYear()} Islamic Events Calendar UK</p>
          </div>
        </footer>

        <Analytics />
      </body>
    </html>
  );
}
