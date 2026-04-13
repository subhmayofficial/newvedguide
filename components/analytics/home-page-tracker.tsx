"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics/events";

export function HomePageTracker() {
  useEffect(() => {
    track.homePageView();
  }, []);

  return null;
}
