"use client";

import { useEffect, useState } from "react";

const TIPS = [
  "Your wallet won't be charged during this wait — billing starts when they join.",
  "Most astrologers connect within 1–2 minutes. Stay on this screen.",
  "Take a quiet breath — your session is queued securely.",
  "Keep this tab open. We'll move you in automatically.",
  "Free to share your question once the live session begins.",
];

type ConsultationWaitingRoomProps = {
  astrologerName: string;
  rateInrPerMin?: number;
  orderCode?: string | null;
};

export function ConsultationWaitingRoom({
  astrologerName,
  rateInrPerMin,
  orderCode,
}: ConsultationWaitingRoomProps) {
  const [tipIndex, setTipIndex] = useState(0);
  const [tipVisible, setTipVisible] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const tick = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTipVisible(false);
      setTimeout(() => {
        setTipIndex((i) => (i + 1) % TIPS.length);
        setTipVisible(true);
      }, 400);
    }, 5000);
    return () => window.clearInterval(id);
  }, []);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-3xl px-6 py-10 text-center">
      {/* ── Background glow orbs ── */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute left-1/2 top-1/2 size-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/10 blur-3xl animate-pulse" />
        <div className="absolute right-0 top-0 size-40 rounded-full bg-amber-400/10 blur-3xl animate-pulse [animation-delay:800ms]" />
        <div className="absolute bottom-0 left-0 size-40 rounded-full bg-violet-400/8 blur-3xl animate-pulse [animation-delay:1400ms]" />
      </div>

      {/* ── Animated chakra rings ── */}
      <div className="relative mb-7 flex size-28 items-center justify-center">
        {/* Outermost ping */}
        <span className="absolute size-28 rounded-full border border-brand/15 animate-ping [animation-duration:3s]" />
        {/* Ring 1 - slow rotate */}
        <div
          className="absolute size-24 rounded-full border border-dashed border-brand/25"
          style={{ animation: "vgw-rot 12s linear infinite" }}
        />
        {/* Ring 2 - counter rotate */}
        <div
          className="absolute size-[4.5rem] rounded-full border border-dashed border-gold/35"
          style={{ animation: "vgw-rot 8s linear infinite reverse" }}
        />
        {/* Dot markers on outer ring */}
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <div
            key={deg}
            className="absolute size-1.5 rounded-full bg-brand/50"
            style={{
              top: "50%",
              left: "50%",
              transform: `rotate(${deg}deg) translateX(46px) translateY(-50%)`,
            }}
          />
        ))}
        {/* Center orb */}
        <div className="relative flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-brand via-brand to-indigo-600 shadow-xl shadow-brand/30">
          <span className="text-xl" aria-hidden>🔮</span>
          <span className="absolute inset-0 rounded-full bg-white/10 animate-pulse" />
        </div>
      </div>

      <style>{`
        @keyframes vgw-rot { to { transform: rotate(360deg); } }
      `}</style>

      {/* ── Text ── */}
      <h2 className="font-heading text-xl font-bold text-foreground">
        Connecting you with
      </h2>
      <p className="mt-0.5 font-heading text-2xl font-bold text-brand">
        {astrologerName}
      </p>

      {/* ── Timer ── */}
      <div className="mt-4 flex items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-4 py-1.5">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-70" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
        </span>
        <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
          {mm}:{ss}
        </span>
        <span className="text-xs text-muted-foreground">waiting</span>
      </div>

      {/* ── Rate pill ── */}
      {rateInrPerMin ? (
        <p className="mt-3 text-xs text-muted-foreground">
          ₹{rateInrPerMin}/min · billing starts when they join
        </p>
      ) : null}

      {/* ── Progress bar ── */}
      <div className="mt-5 h-1 w-48 overflow-hidden rounded-full bg-muted/60">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand via-amber-400 to-brand bg-[length:200%_100%]"
          style={{ animation: "vgw-shimmer 2s linear infinite" }}
        />
      </div>
      <style>{`
        @keyframes vgw-shimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>

      {/* ── Rotating tip ── */}
      <p
        className="mt-6 max-w-xs text-sm leading-relaxed text-muted-foreground transition-opacity duration-400"
        style={{ opacity: tipVisible ? 1 : 0 }}
      >
        {TIPS[tipIndex]}
      </p>

      {/* ── Order code ── */}
      {orderCode ? (
        <p className="mt-4 font-mono text-[10px] tracking-wider text-muted-foreground/60">
          {orderCode}
        </p>
      ) : null}
    </div>
  );
}
