"use client";

import { useEffect, useState } from "react";

const TIPS = [
  "Your wallet won't be charged during this wait — billing starts when they join.",
  "Most astrologers connect within 1–2 minutes. Stay on this screen.",
  "Take a quiet breath — your session is queued securely.",
  "Keep this tab open. We'll move you in automatically.",
  "Feel free to share your question once the live session begins.",
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
      }, 350);
    }, 5000);
    return () => window.clearInterval(id);
  }, []);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="flex flex-col items-center text-center px-2 py-8">
      <style>{`
        @keyframes vgw-rot   { to { transform: rotate(360deg); } }
        @keyframes vgw-shimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>

      {/* ── Animated rings ── */}
      <div className="relative mb-8 flex size-32 items-center justify-center">
        {/* Outer ping */}
        <span className="absolute size-32 rounded-full border border-amber-300/40 animate-ping [animation-duration:3s]" />
        {/* Ring 1 */}
        <div
          className="absolute size-[6.5rem] rounded-full border-2 border-dashed border-amber-300/50"
          style={{ animation: "vgw-rot 12s linear infinite" }}
        />
        {/* Ring 2 */}
        <div
          className="absolute size-20 rounded-full border-2 border-dashed border-amber-400/40"
          style={{ animation: "vgw-rot 8s linear infinite reverse" }}
        />
        {/* Dot markers */}
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <div
            key={deg}
            className="absolute size-1.5 rounded-full bg-amber-400/60"
            style={{
              top: "50%", left: "50%",
              transform: `rotate(${deg}deg) translateX(52px) translateY(-50%)`,
            }}
          />
        ))}
        {/* Centre orb */}
        <div className="relative flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-xl shadow-amber-400/30">
          <span className="text-2xl" aria-hidden>🔮</span>
          <span className="absolute inset-0 rounded-full bg-white/10 animate-pulse" />
        </div>
      </div>

      {/* Text */}
      <p className="text-[13px] font-medium text-gray-400 uppercase tracking-widest mb-1">
        Connecting you with
      </p>
      <p className="text-[22px] font-bold text-gray-900 leading-tight">{astrologerName}</p>

      {/* Timer */}
      <div className="mt-5 flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2 shadow-sm">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-70" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
        </span>
        <span className="font-mono text-[15px] font-bold tabular-nums text-gray-900">{mm}:{ss}</span>
        <span className="text-[12px] text-gray-400">waiting</span>
      </div>

      {/* Rate note */}
      {rateInrPerMin ? (
        <p className="mt-3 text-[12px] text-gray-400">
          ₹{rateInrPerMin}/min · billing starts when they join
        </p>
      ) : null}

      {/* Progress shimmer bar */}
      <div className="mt-5 h-1 w-40 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-300 via-amber-500 to-amber-300 bg-[length:200%_100%]"
          style={{ animation: "vgw-shimmer 2s linear infinite" }}
        />
      </div>

      {/* Rotating tip */}
      <p
        className="mt-6 max-w-[260px] text-[13px] leading-relaxed text-gray-500 transition-opacity duration-300"
        style={{ opacity: tipVisible ? 1 : 0 }}
      >
        {TIPS[tipIndex]}
      </p>

      {/* Order code */}
      {orderCode ? (
        <p className="mt-5 font-mono text-[10px] tracking-widest text-gray-300">{orderCode}</p>
      ) : null}
    </div>
  );
}
