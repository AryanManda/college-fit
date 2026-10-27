import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  turbopack: {
    root: path.join(__dirname),
  },
  async redirects() {
    return [
      { source: "/", destination: "/home", permanent: false },
      { source: "/subscribe", destination: "/home", permanent: false },
    ];
  },
};

export default nextConfig;
