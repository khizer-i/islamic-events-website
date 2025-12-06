import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import { GA4PageView } from "./ga4-pageview";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UK Islamic Events Calendar",
  description: "AI-assisted UK Islamic events calendar from community posters.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
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

        <footer className="mt-10 border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
          © {new Date().getFullYear()} Islamic Events Calendar UK
        </footer>

        {/* Vercel Analytics */}
        <Analytics />
      </body>
    </html>
  );
}
