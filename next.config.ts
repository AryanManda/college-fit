import type { NextConfig } from "next";
import path from "path";

const ferpaMode = process.env.NEXT_PUBLIC_FERPA_MODE === "1";
const isDev = process.env.NODE_ENV === "development";

/** FERPA mode: the browser may load from and send to this app's own origin only. */
const ferpaCsp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  `connect-src 'self'${isDev ? " ws:" : ""}`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  turbopack: {
    root: path.join(__dirname),
  },
  async redirects() {
    return [
      { source: "/", destination: "/home", permanent: false },
      { source: "/subscribe", destination: "/home", permanent: false },
      ...(ferpaMode ? [] : [{ source: "/privacy", destination: "/home", permanent: false }]),
    ];
  },
  async headers() {
    if (!ferpaMode) return [];
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: ferpaCsp },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), interest-cohort=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
