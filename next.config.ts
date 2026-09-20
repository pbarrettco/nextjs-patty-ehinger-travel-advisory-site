import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.sanity.io" },
      // Feedframer rehosts Instagram media on its own CDN with non-expiring
      // URLs, so the Instagram CDN hosts are deliberately not allowlisted.
      { protocol: "https", hostname: "cdn.feedframer.com" },
    ],
  },
};

export default nextConfig;
