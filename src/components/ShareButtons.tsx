"use client";

import { useState } from "react";

/**
 * WhatsApp is how UK Islamic community events actually spread. This makes
 * forwarding an event one tap, and gives us a shareable canonical URL.
 */
export default function ShareButtons({
  url,
  title,
}: {
  url: string;
  title: string;
}) {
  const [copied, setCopied] = useState(false);

  const shareText = `${title}\n${url}`;
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  const nativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
        return true;
      } catch {
        // User dismissed the sheet — fall through to copy.
      }
    }
    return false;
  };

  const handleCopy = async () => {
    if (await nativeShare()) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-emerald-700"
      >
        Share on WhatsApp
      </a>

      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-300 px-3.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        {copied ? "Link copied" : "Copy link"}
      </button>
    </div>
  );
}
