import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

/** Resolves reliably even when the config path contains spaces (see `__dirname` quirks). */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const SEGMENT_RE = /^[a-z0-9][a-z0-9-]{2,62}$/i;

function panelSegment(fallback: string): string {
  const raw =
    process.env.NEXT_PUBLIC_ADMIN_PANEL_PATH?.trim() ??
    process.env.ADMIN_PANEL_PATH?.trim() ??
    "";
  const seg = raw.replace(/^\/+|\/+$/g, "");
  return seg && SEGMENT_RE.test(seg) ? seg : fallback;
}

function astroSegment(): string {
  const raw =
    process.env.NEXT_PUBLIC_ASTRO_OPS_PATH?.trim() ??
    process.env.ASTRO_OPS_PATH?.trim() ??
    "";
  const seg = raw.replace(/^\/+|\/+$/g, "");
  return seg && SEGMENT_RE.test(seg) ? seg : "vg-astral-9m4q1x";
}

const adminPanelSegment = panelSegment("vg-console-8f3k2p");
const astroOpsSegment = astroSegment();

const nextConfig: NextConfig = {
  /**
   * Turbopack defaults to spawning many **child processes** for plugin work on Windows,
   * which can look like dozens of node.exe tasks and spike RAM. `workerThreads` keeps
   * that work in-process. Prefer `npm run dev` (webpack) locally; use `dev:turbo` if needed.
   */
  experimental: {
    /** Tree-shake lucide icon imports (smaller client bundles on chat / astrologers routes). */
    optimizePackageImports: ["lucide-react"],
    /** Large multipart uploads can stall/fail before Route Handler when proxy is enabled. */
    proxyClientMaxBodySize: "50mb",
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
      // Legacy guessable admin URLs → home (do not reveal new path)
      { source: "/admin", destination: "/", permanent: false },
      { source: "/admin/:path*", destination: "/", permanent: false },
      { source: "/admindeoghar", destination: "/", permanent: false },
      { source: "/admindeoghar/:path*", destination: "/", permanent: false },
      // Legacy astro-ops URL
      { source: "/astro-ops", destination: `/${astroOpsSegment}`, permanent: false },
      { source: "/astro-ops/:path*", destination: `/${astroOpsSegment}/:path*`, permanent: false },
      // Live consult moved under astro-ops
      {
        source: `/${adminPanelSegment}/live-consult`,
        destination: `/${astroOpsSegment}`,
        permanent: false,
      },
      {
        source: `/${adminPanelSegment}/live-consult/:path*`,
        destination: `/${astroOpsSegment}/:path*`,
        permanent: false,
      },
      {
        source: "/admindeoghar/live-consult",
        destination: `/${astroOpsSegment}`,
        permanent: false,
      },
      {
        source: "/admindeoghar/live-consult/:path*",
        destination: `/${astroOpsSegment}/:path*`,
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: `/${adminPanelSegment}`,
        destination: "/admin",
      },
      {
        source: `/${adminPanelSegment}/:path*`,
        destination: "/admin/:path*",
      },
      {
        source: `/${astroOpsSegment}`,
        destination: "/astro-ops",
      },
      {
        source: `/${astroOpsSegment}/:path*`,
        destination: "/astro-ops/:path*",
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
