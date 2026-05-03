"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronRight, MessageCircle, Settings, Sparkles, Wallet } from "lucide-react";
import { AccountSignOutButton } from "@/components/account/account-sign-out-button";

// ─── Count-up hook ─────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 800) {
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

// ─── Format paise → ₹ whole ──────────────────────────────────────────────────

function fmtRupees(paise: number): string {
  const inr = Math.floor(paise / 100);
  return `₹${inr.toLocaleString("en-IN")}`;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface UserProfileClientProps {
  name: string;
  initials: string;
  balancePaise: number;
  chatCount: number;
}

// ─── Stat card with count-up ─────────────────────────────────────────────────

function StatCard({
  label,
  children,
  href,
  linkLabel,
  delay,
}: {
  label: string;
  children: React.ReactNode;
  href: string;
  linkLabel: string;
  delay: number;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      className="rounded-2xl border border-border/60 bg-card p-4 shadow-lg transition-all duration-500"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
      }}
    >
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 font-heading text-2xl font-bold tabular-nums text-foreground">
        {children}
      </div>
      <Link
        href={href}
        className="mt-2 block text-xs font-semibold text-brand hover:underline"
      >
        {linkLabel} →
      </Link>
    </div>
  );
}

// ─── Nav item ─────────────────────────────────────────────────────────────────

const NAV_ICONS = {
  wallet: Wallet,
  chats: MessageCircle,
  astrologers: Sparkles,
  settings: Settings,
};

function NavItem({
  href,
  icon: Icon,
  label,
  value,
  highlight,
  delay,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  value?: string;
  highlight?: boolean;
  delay: number;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3.5 shadow-sm transition-all duration-200 hover:border-brand/30 hover:shadow-md active:scale-[0.985]"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(-12px)",
        transition: `opacity 0.4s ease ${delay}ms, transform 0.4s ease ${delay}ms, border-color 0.2s, box-shadow 0.2s`,
      }}
    >
      <div
        className={`flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
          highlight ? "bg-brand/12 text-brand" : "bg-muted/60 text-muted-foreground"
        }`}
      >
        <Icon className="size-5" />
      </div>
      <span className="flex-1 text-sm font-semibold text-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        {value && (
          <span className="text-sm font-medium text-muted-foreground">{value}</span>
        )}
        <ChevronRight className="size-4 text-muted-foreground/40" />
      </div>
    </Link>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function UserProfileClient({
  name,
  initials,
  balancePaise,
  chatCount,
}: UserProfileClientProps) {
  const animatedBalance = useCountUp(Math.floor(balancePaise / 100), 1000);
  const animatedChats = useCountUp(chatCount, 700);
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const navItems = [
    { href: "/astrologers/wallet", icon: Wallet, label: "Wallet", value: fmtRupees(balancePaise), highlight: true },
    { href: "/astrologers/chats", icon: MessageCircle, label: "My Chats", value: `${chatCount} session${chatCount !== 1 ? "s" : ""}`, highlight: false },
    { href: "/astrologers", icon: Sparkles, label: "Talk to Astrologers", value: "Browse", highlight: false },
    { href: "/users/settings", icon: Settings, label: "Settings", value: "", highlight: false },
  ];

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* ── Hero ── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, oklch(0.38 0.18 260) 0%, oklch(0.30 0.22 280) 40%, oklch(0.25 0.15 300) 100%)",
        }}
      >
        {/* Grid overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle at 1.5px 1.5px, rgba(255,255,255,0.08) 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        {/* Glow orbs */}
        <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 left-1/4 size-48 rounded-full bg-indigo-400/10 blur-2xl" />

        <div
          className="relative px-5 pb-20 pt-8 transition-all duration-700"
          style={{
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? "translateY(0)" : "translateY(-8px)",
          }}
        >
          {/* Avatar */}
          <div className="mb-4 flex size-18 items-center justify-center rounded-full bg-white/15 text-2xl font-bold text-white shadow-xl ring-2 ring-white/25 backdrop-blur-sm"
            style={{ width: 72, height: 72 }}>
            {initials}
          </div>
          <p className="text-sm font-medium text-white/60">Welcome back</p>
          <h1 className="mt-0.5 font-heading text-3xl font-bold text-white leading-tight">
            {name}
          </h1>
          {/* Decorative stars */}
          <div className="mt-4 flex gap-1" aria-hidden>
            {["✦", "✦", "✦"].map((s, i) => (
              <span
                key={i}
                className="text-white/20 text-xs"
                style={{ animationDelay: `${i * 200}ms` }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Floating stat cards ── */}
      <div className="mx-auto -mt-10 max-w-2xl px-4">
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Balance" href="/astrologers/wallet" linkLabel="Add funds" delay={150}>
            <span>₹{animatedBalance.toLocaleString("en-IN")}</span>
          </StatCard>
          <StatCard label="Sessions" href="/astrologers/chats" linkLabel="View chats" delay={250}>
            <span>{animatedChats}</span>
          </StatCard>
        </div>
      </div>

      {/* ── Nav ── */}
      <div className="mx-auto mt-5 max-w-2xl space-y-2.5 px-4">
        {navItems.map((item, i) => (
          <NavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            value={item.value}
            highlight={item.highlight}
            delay={300 + i * 70}
          />
        ))}
      </div>

      {/* ── Sign out ── */}
      <div className="mx-auto mt-6 max-w-2xl px-4">
        <AccountSignOutButton
          className="w-full rounded-2xl border border-border/60 bg-card py-3 text-sm font-medium text-muted-foreground shadow-sm hover:text-foreground"
          variant="outline"
          redirectTo="/login"
        />
      </div>
    </div>
  );
}
