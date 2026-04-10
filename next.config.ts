import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
