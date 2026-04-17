import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  async redirects() {
    return [
      {
        source: "/admin",
        destination: "/admindeoghar",
        permanent: false,
      },
      {
        source: "/admin/:path*",
        destination: "/admindeoghar/:path*",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/admindeoghar",
        destination: "/admin",
      },
      {
        source: "/admindeoghar/:path*",
        destination: "/admin/:path*",
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "primedit-cdn.b-cdn.net",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
