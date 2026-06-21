import type { NextConfig } from "next";
import path from "path";
import { shouldEnableStrictTransportSecurity } from "./src/lib/deployment/safety";

export const useravaaBaseSecurityHeaders = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff"
  },
  {
    key: "X-Frame-Options",
    value: "DENY"
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin"
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()"
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin"
  }
];

export function getUseravaaSecurityHeaders(source: NodeJS.ProcessEnv = process.env) {
  const headers = [...useravaaBaseSecurityHeaders];

  if (shouldEnableStrictTransportSecurity(source)) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload"
    });
  }

  return headers;
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: getUseravaaSecurityHeaders()
      }
    ];
  },
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
