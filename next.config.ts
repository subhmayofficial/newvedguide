import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

/** Resolves reliably even when the config path contains spaces (see `__dirname` quirks). */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  /**
   * Turbopack defaults to spawning many **child processes** for plugin work on Windows,
   * which can look like dozens of node.exe tasks and spike RAM. `workerThreads` keeps
   * that work in-process. Prefer `npm run dev` (webpack) locally; use `dev:turbo` if needed.
   */
  experimental: {
    turbopackPluginRuntimeStrategy: "workerThreads",
    /** Soft cap (~1.5 GiB) — raises pressure before the OS swaps/crashes on smaller machines */
    turbopackMemoryLimit: 1536 * 1024 * 1024,
    /** Deliver-dialog uploads send the file via a server action; default limit rejects many PDFs. */
    serverActions: {
      bodySizeLimit: "40mb",
    },
  },
  turbopack: {
    root: projectRoot,
    resolveAlias: {
      tailwindcss: path.join(projectRoot, "node_modules", "tailwindcss"),
      "@tailwindcss/postcss": path.join(
        projectRoot,
        "node_modules",
        "@tailwindcss",
        "postcss"
      ),
    },
  },
  webpack: (config, { dev }) => {
    const localNodeModules = path.join(projectRoot, "node_modules");
    config.resolve = config.resolve ?? {};
    config.resolve.modules = [localNodeModules, "node_modules"];
    config.resolveLoader = config.resolveLoader ?? {};
    config.resolveLoader.modules = [localNodeModules, "node_modules"];
    if (dev) {
      config.parallelism = 2;
    }
    return config;
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
