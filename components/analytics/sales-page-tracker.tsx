"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics/events";

export function SalesPageTracker({ sourcePage }: { sourcePage: string }) {
  useEffect(() => {
    track.salesPageView(sourcePage);
  }, [sourcePage]);
  return null;
}
