import type { NextConfig } from "next";

const WG_MESSAGING_URL = (process.env.WG_MESSAGING_URL || "http://localhost:20080").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: [
    "sedate-immunity-amid.ngrok-free.dev",
    "porous-waviness-shrunk.ngrok-free.dev",
  ],
  async rewrites() {
    return [
      // Transparent reverse-proxy to wg-messaging backend on port 20080
      {
        source: "/partner/:path*",
        destination: `${WG_MESSAGING_URL}/partner/:path*`,
      },
      {
        source: "/management/:path*",
        destination: `${WG_MESSAGING_URL}/management/:path*`,
      },
      {
        source: "/v1/:path*",
        destination: `${WG_MESSAGING_URL}/v1/:path*`,
      },
      {
        source: "/webhooks",
        destination: `${WG_MESSAGING_URL}/webhooks`,
      },
      {
        source: "/webhooks/:path*",
        destination: `${WG_MESSAGING_URL}/webhooks/:path*`,
      },
    ];
  },
};

export default nextConfig;
