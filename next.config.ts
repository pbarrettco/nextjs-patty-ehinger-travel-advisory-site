import type { NextConfig } from "next";
import { withBotId } from "botid/next/config";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.sanity.io" },
      // Feedframer rehosts Instagram media on its own CDN with non-expiring
      // URLs, so the Instagram CDN hosts are deliberately not allowlisted.
      { protocol: "https", hostname: "cdn.feedframer.com" },
    ],
  },
  experimental: {
    serverActions: {
      // Job applications post a resume (max 4MB) through a Server Action.
      // Vercel functions cap request bodies at 4.5MB, so this is the ceiling.
      bodySizeLimit: "4.5mb",
    },
  },
};

export default withBotId(nextConfig);
