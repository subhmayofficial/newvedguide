"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gtag?: (...args: any[]) => void;
  }
}

/** Sends GA4 virtual page_view on client navigations */
export function GaRouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const gaId = process.env.NEXT_PUBLIC_GA_ID;
    if (!gaId || typeof window === "undefined" || !window.gtag) return;
    const q = searchParams?.toString();
    const page_path = q ? `${pathname}?${q}` : pathname;
    window.gtag("config", gaId, { page_path });
  }, [pathname, searchParams]);

  return null;
}
