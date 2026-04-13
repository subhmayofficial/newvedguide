"use client";

import { useEffect } from "react";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

    if (!key) return;

    let cancelled = false;

    import("posthog-js")
      .then(({ default: posthog }) => {
        if (cancelled) return;
        posthog.init(key, {
          api_host: host ?? "https://app.posthog.com",
          capture_pageview: true,
          capture_pageleave: true,
          persistence: "localStorage",
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  return <>{children}</>;
}
