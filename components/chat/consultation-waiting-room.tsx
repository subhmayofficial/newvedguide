"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

const TIPS = [
  "Most astrologers connect within 1–2 minutes — thanks for your patience.",
  "Stay on this screen. We’ll start your timer only after they join.",
  "Your wallet is not charged for this wait — billing begins with the live timer.",
  "You can share your question in the box below once the session goes live.",
  "Take a quiet breath — your consultation is queued securely.",
];

type ConsultationWaitingRoomProps = {
  astrologerName: string;
  orderCode?: string | null;
};

export function ConsultationWaitingRoom({
  astrologerName,
  orderCode,
}: ConsultationWaitingRoomProps) {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTipIndex((i) => (i + 1) % TIPS.length);
    }, 4800);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="relative flex min-h-[220px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-brand/20 bg-gradient-to-b from-brand-light/40 via-card to-indigo-950/10 px-4 py-8 dark:from-brand/20 dark:to-card">
      <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden>
        <div className="absolute left-1/2 top-1/2 size-48 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-brand/25 blur-3xl" />
        <div className="absolute left-1/4 top-1/3 size-32 animate-pulse rounded-full bg-amber-300/20 blur-2xl [animation-delay:500ms]" />
        <div className="absolute bottom-1/4 right-1/4 size-40 animate-pulse rounded-full bg-violet-400/15 blur-2xl [animation-delay:1s]" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="relative mb-5 flex size-20 items-center justify-center">
          <span
            className="absolute inline-flex size-full rounded-full border-2 border-brand/40 opacity-60 motion-safe:animate-ping [animation-duration:2.2s]"
            aria-hidden
          />
          <span
            className="absolute inline-flex size-[88%] rounded-full border border-amber-400/50 motion-safe:animate-ping [animation-duration:2.8s] [animation-delay:400ms]"
            aria-hidden
          />
          <div className="relative flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-brand to-indigo-700 shadow-lg shadow-brand/25">
            <Sparkles className="size-7 text-white motion-safe:animate-pulse" aria-hidden />
          </div>
        </div>

        <p className="font-heading text-lg font-semibold text-foreground md:text-xl">
          Connecting you with {astrologerName}
        </p>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          Typical wait is about{" "}
          <span className="font-semibold text-foreground">1–2 minutes</span>.
          Keep this tab open — we’ll begin your paid session as soon as they
          arrive.
        </p>

        {orderCode ? (
          <p className="mt-3 font-mono text-[11px] text-muted-foreground">
            Order {orderCode}
          </p>
        ) : null}

        <div className="mt-6 min-h-[3.5rem] w-full max-w-md px-2">
          <p className="text-[13px] leading-snug text-foreground/90 transition-opacity duration-500">
            {TIPS[tipIndex]}
          </p>
        </div>

        <div
          className="mt-2 h-1 w-56 max-w-[85%] overflow-hidden rounded-full bg-muted"
          aria-hidden
        >
          <div className="h-full w-2/5 animate-pulse rounded-full bg-gradient-to-r from-brand via-amber-400 to-brand" />
        </div>
      </div>
    </div>
  );
}
