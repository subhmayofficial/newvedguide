"use client";

import { useEffect, useState } from "react";

/** Asymptotic cap — never 100% until the route actually swaps (avoids “stuck at full”). */
const CAP = 88;
/** Higher = stronger early rush (fast start, long slow tail). */
const K = 2.65;

function easeProgress(elapsedSec: number): number {
  return Math.min(CAP, CAP * (1 - Math.exp(-elapsedSec * K)));
}

function phaseLabel(pct: number): string {
  if (pct < 32) return "Loading…";
  if (pct < 58) return "Getting things ready…";
  if (pct < 78) return "Almost there…";
  return "Finishing up…";
}

type EngagingRouteProgressProps = {
  /** Screen-reader status */
  ariaLabel?: string;
  children?: React.ReactNode;
  className?: string;
  /** Show caption + numeric percent under the bar */
  showCaption?: boolean;
};

export function EngagingRouteProgress({
  ariaLabel = "Page loading",
  children,
  className = "",
  showCaption = true,
}: EngagingRouteProgressProps) {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const loop = () => {
      const elapsed = (performance.now() - t0) / 1000;
      const next = easeProgress(elapsed);
      setPct(next);
      if (next < CAP - 0.08) {
        raf = requestAnimationFrame(loop);
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const caption = phaseLabel(pct);
  const rounded = Math.min(99, Math.round(pct));

  return (
    <div className={className}>
      <span className="sr-only" aria-live="polite">
        {ariaLabel} {rounded} percent
      </span>
      <div
        className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted/70 shadow-inner dark:bg-muted/35"
        aria-hidden
      >
        <div
          className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-gradient-to-r from-brand via-amber-500 to-brand shadow-[0_0_14px_-2px_var(--color-brand)]"
          style={{
            transform: `scaleX(${Math.max(0.02, pct / 100)})`,
            transition: "none",
          }}
        />
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/35 to-transparent opacity-80 vg-progress-shimmer-animate dark:via-white/12"
        />
      </div>
      {showCaption ? (
        <p className="mt-2.5 text-center text-[13px] font-medium text-muted-foreground">
          <span className="text-foreground/90">{caption}</span>
          <span className="ml-1.5 tabular-nums text-foreground/55">{rounded}%</span>
        </p>
      ) : null}
      {children}
    </div>
  );
}
