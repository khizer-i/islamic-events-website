import type { NextConfig } from "next";

/**
 * Sent with every page. They stop other sites framing the calendar (a
 * clickjacking trick), stop browsers guessing file types, keep full URLs
 * out of the Referer sent to other sites, and switch off browser features
 * the site never uses. HTTPS itself is enforced by Vercel.
 */
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  // No "X-Powered-By: Next.js" advert on every response.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
