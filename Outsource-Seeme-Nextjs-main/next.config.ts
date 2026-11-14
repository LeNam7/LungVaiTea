import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker build bật biến này để sinh .next/standalone.
  // Build thường (local/Vercel) không bị ảnh hưởng.
  output: process.env.NEXT_OUTPUT_STANDALONE === "true" ? "standalone" : undefined,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/imageSlide/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
