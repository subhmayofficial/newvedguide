"use client";

import { useEffect, useRef, useState } from "react";
import { TrendingDown, Wallet } from "lucide-react";
import { WalletTopupLauncher } from "@/components/astrologers/wallet-topup-launcher";

// ─── Count-up hook ─────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 900) {
  const [val, setVal] = useState(0);
  const raf = useRef<number | null>(null);
  const start = useRef<number | null>(null);

  useEffect(() => {
    if (raf.current) cancelAnimationFrame(raf.current);
    start.current = null;
    function step(ts: number) {
      if (!start.current) start.current = ts;
      const p = Math.min((ts - start.current) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * eased));
      if (p < 1) raf.current = requestAnimationFrame(step);
    }
    raf.current = requestAnimationFrame(step);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration]);

  return val;
}

type WalletBalanceCardProps = {
  balancePaise: number;
  totalSpentPaise: number;
  sessionCount: number;
  userId: string;
};

export function WalletBalanceCard({
  balancePaise,
  totalSpentPaise,
  sessionCount,
  userId,
}: WalletBalanceCardProps) {
  const balanceRupees = Math.floor(balancePaise / 100);
  const spentRupees   = Math.floor(totalSpentPaise / 100);

  const animBalance = useCountUp(balanceRupees, 900);
  const animSpent   = useCountUp(spentRupees, 1100);
  const animSessions = useCountUp(sessionCount, 700);

  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 60); return () => clearTimeout(t); }, []);

  return (
    <div
      className="relative overflow-hidden rounded-3xl text-white shadow-2xl transition-all duration-500"
      style={{
        background: "linear-gradient(135deg, oklch(0.40 0.19 262) 0%, oklch(0.30 0.22 278) 50%, oklch(0.24 0.16 300) 100%)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(16px) scale(0.97)",
      }}
    >
      {/* Dot grid overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(circle at 1.5px 1.5px, rgba(255,255,255,0.07) 1px, transparent 0)",
          backgroundSize: "26px 26px",
        }}
        aria-hidden
      />
      {/* Glow orbs */}
      <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-white/5 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute bottom-0 left-0 size-40 rounded-full bg-indigo-400/10 blur-2xl" aria-hidden />

      <div className="relative px-6 pb-6 pt-7">
        {/* Header row */}
        <div className="flex items-center gap-2 mb-1">
          <div className="flex size-8 items-center justify-center rounded-xl bg-white/15">
            <Wallet className="size-4 text-white" />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-white/60">
            Available Balance
          </p>
        </div>

        {/* Big animated number */}
        <p
          className="font-heading text-5xl font-bold tabular-nums tracking-tight"
          style={{ textShadow: "0 2px 20px rgba(0,0,0,0.3)" }}
        >
          ₹{animBalance.toLocaleString("en-IN")}
        </p>

        {/* Stats row */}
        <div className="mt-5 flex items-center gap-5 border-t border-white/10 pt-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">
              Total spent
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-sm font-bold tabular-nums text-white">
              <TrendingDown className="size-3.5 text-red-300" />
              ₹{animSpent.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="h-8 w-px bg-white/15" />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">
              Sessions
            </p>
            <p className="mt-0.5 text-sm font-bold text-white">
              {animSessions}
            </p>
          </div>
        </div>

        {/* Top-up area */}
        <div className="mt-5 rounded-2xl border border-white/20 bg-black/20 px-4 py-3.5 backdrop-blur-md">
          <WalletTopupLauncher
            userId={userId}
            isLoggedIn
            initialBalancePaise={balancePaise}
            onDarkSurface
          />
        </div>
      </div>
    </div>
  );
}
