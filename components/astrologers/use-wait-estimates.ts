"use client";

import { useEffect, useState } from "react";

/** `null` = first load not finished; then a map (missing id ⇒ treat as 0). */
export function useAstrologerWaitEstimates(pollMs = 30_000) {
  const [estimates, setEstimates] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/astrologers/wait-estimates", { cache: "no-store" });
        const j = (await res.json()) as { estimates?: Record<string, number> };
        if (!cancelled) setEstimates(j.estimates ?? {});
      } catch {
        if (!cancelled) setEstimates({});
      }
    }
    void load();
    const id = window.setInterval(() => void load(), pollMs);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [pollMs]);

  return estimates;
}
