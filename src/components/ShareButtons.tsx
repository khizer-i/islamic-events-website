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
    <div className="flex gap-2.5">
      <a
        href={whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-12 flex-1 items-center justify-center border border-rule-strong text-[14px] font-medium transition-colors hover:bg-paper-sunk"
      >
        Share on WhatsApp
      </a>

      <button
        type="button"
        onClick={handleCopy}
        className="flex h-12 flex-1 cursor-pointer items-center justify-center border border-rule-strong text-[14px] font-medium transition-colors hover:bg-paper-sunk"
      >
        {copied ? "Link copied" : "Copy link"}
      </button>
    </div>
  );
}
