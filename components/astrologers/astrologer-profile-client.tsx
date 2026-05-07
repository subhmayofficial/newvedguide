"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Clock,
  Globe2,
  Loader2,
  MessageCircle,
  Shield,
  Star,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ChatAvatar } from "@/components/chat/chat-avatar";
import type { LiveChatAstrologer } from "@/lib/data/live-chat-astrologers";
import { formatInrFromPaise } from "@/lib/format-money";

type Props = {
  astrologer: LiveChatAstrologer;
  isLoggedIn: boolean;
  balancePaise: number;
};

const SPECIALTY_ICONS: Record<string, string> = {
  "Love & marriage": "💍",
  "Career": "📈",
  "Wealth & business": "💰",
  "Vedic & kundli": "🔮",
  "Vastu": "🏠",
  "Tarot & intuition": "✨",
};

// ── fake review data per astrologer ─────────────────────────────────────────
const REVIEWS = [
  { name: "Rahul M.", text: "Very accurate reading. Helped me understand my career path clearly.", stars: 5, ago: "2 days ago" },
  { name: "Priya S.", text: "Answered all my questions with clarity. Will consult again!", stars: 5, ago: "5 days ago" },
  { name: "Ankit T.", text: "Very insightful. The remedies actually worked for me.", stars: 5, ago: "1 week ago" },
  { name: "Deepa R.", text: "Detailed analysis of my birth chart. Highly recommended.", stars: 4, ago: "2 weeks ago" },
];

function StarRow({ rating, small }: { rating: number; small?: boolean }) {
  return (
    <div className={`flex items-center gap-0.5 ${small ? "" : ""}`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${small ? "size-3" : "size-4"} ${s <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-gray-200 fill-gray-200"}`}
        />
      ))}
    </div>
  );
}

export function AstrologerProfileClient({ astrologer: a, isLoggedIn, balancePaise }: Props) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChat() {
    setError(null);
    if (!isLoggedIn) {
      router.push(`/login?redirect=${encodeURIComponent(`/astrologers/${a.slug}`)}`);
      return;
    }
    setStarting(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }

      const res = await fetch("/api/user/chat-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ astrologerId: a.id }),
      });
      const data = (await res.json()) as { sessionId?: string; error?: string; code?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not start chat.");
        return;
      }
      if (data.sessionId) {
        router.push(`/astrologers/chats/waiting/${encodeURIComponent(data.sessionId)}`);
      }
    } catch {
      setError("Network error — check your connection.");
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">

      {/* ── Hero header ── */}
      <div
        className="relative overflow-hidden pt-10 pb-8 px-4"
        style={{ background: "linear-gradient(160deg,#1a0533 0%,#2d0a52 60%,#3b0f6e 100%)" }}
      >
        {/* Back button */}
        <Link
          href="/astrologers"
          className="absolute left-4 top-4 flex size-9 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 transition"
          aria-label="Back"
        >
          <ArrowLeft className="size-5" />
        </Link>

        {/* Decorative */}
        <div className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-violet-500/10 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -left-10 bottom-0 size-36 rounded-full bg-amber-400/8 blur-2xl" aria-hidden />
        <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" aria-hidden />

        {/* SVG constellation deco */}
        <svg className="pointer-events-none absolute right-4 top-8 opacity-20" width="80" height="80" viewBox="0 0 80 80" fill="none">
          <circle cx="20" cy="20" r="2" fill="white"/>
          <circle cx="60" cy="15" r="1.5" fill="white"/>
          <circle cx="70" cy="50" r="2" fill="white"/>
          <circle cx="40" cy="65" r="1.5" fill="white"/>
          <circle cx="10" cy="60" r="1" fill="white"/>
          <line x1="20" y1="20" x2="60" y2="15" stroke="white" strokeWidth="0.5" opacity="0.6"/>
          <line x1="60" y1="15" x2="70" y2="50" stroke="white" strokeWidth="0.5" opacity="0.6"/>
          <line x1="70" y1="50" x2="40" y2="65" stroke="white" strokeWidth="0.5" opacity="0.6"/>
          <line x1="40" y1="65" x2="10" y2="60" stroke="white" strokeWidth="0.5" opacity="0.6"/>
          <line x1="10" y1="60" x2="20" y2="20" stroke="white" strokeWidth="0.5" opacity="0.6"/>
        </svg>

        <div className="mx-auto max-w-lg flex flex-col items-center text-center">
          {/* Badge */}
          {a.badge && (
            <span className="mb-3 rounded-full border border-amber-300/40 bg-amber-400/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-300">
              ⭐ {a.badge}
            </span>
          )}

          {/* Avatar */}
          <div className="mb-4 ring-4 ring-white/20 rounded-full">
            <ChatAvatar
              src={a.imageSrc}
              alt={a.name}
              initials={a.initials}
              gradientClass={a.avatarGradient}
              size={88}
              objectPosition={a.imageSrc ? "center 10%" : "center"}
            />
          </div>

          <h1 className="text-[24px] font-black text-white leading-tight">{a.name}</h1>
          <p className="mt-1 text-[13px] font-medium text-white/70">{a.title}</p>

          {/* Rating row */}
          <div className="mt-3 flex items-center gap-2">
            <StarRow rating={a.rating} />
            <span className="text-[13px] font-bold text-amber-300">{a.rating}</span>
            <span className="text-[12px] text-white/50">({a.reviewCount.toLocaleString("en-IN")} reviews)</span>
          </div>

          {/* Status pill */}
          <div className="mt-3 flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5">
            <span className={`size-2 rounded-full ${a.isOnline ? "bg-emerald-400 animate-pulse" : "bg-gray-400"}`} />
            <span className="text-[12px] font-semibold text-white/80">
              {a.isOnline ? "Online now" : "Offline"}
              {a.waitMinutes ? ` · ~${a.waitMinutes}m wait` : ""}
            </span>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="mx-auto max-w-lg px-4 py-4 space-y-3 pb-44">

        {/* Error */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
            {error}
            {error.includes("balance") && (
              <Link href="/astrologers/wallet" className="ml-2 font-bold underline">
                Recharge →
              </Link>
            )}
          </div>
        )}

        {/* ── Stats row ── */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Clock, label: "Experience", value: `${a.experienceYears} yrs` },
            { icon: Users, label: "Reviews", value: a.reviewCount.toLocaleString("en-IN") },
            { icon: Shield, label: "Verified", value: "Expert" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex flex-col items-center gap-1 rounded-2xl border border-gray-100 bg-white py-3.5 shadow-sm text-center">
              <Icon className="size-4 text-amber-500" />
              <p className="text-[14px] font-black text-gray-900">{value}</p>
              <p className="text-[10px] text-gray-400">{label}</p>
            </div>
          ))}
        </div>

        {/* ── About ── */}
        <div className="rounded-2xl border border-gray-100 bg-white px-4 py-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">About</p>
          <p className="text-[14px] leading-relaxed text-gray-700">{a.shortBio}</p>
        </div>

        {/* ── Specialties ── */}
        <div className="rounded-2xl border border-gray-100 bg-white px-4 py-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">Specialties</p>
          <div className="flex flex-wrap gap-2">
            {a.specialties.map((s) => (
              <span key={s} className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[12px] font-semibold text-amber-800">
                <span>{SPECIALTY_ICONS[s] ?? "●"}</span>
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* ── Languages ── */}
        <div className="rounded-2xl border border-gray-100 bg-white px-4 py-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Globe2 className="size-4 text-gray-400" />
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Languages</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {a.languages.map((l) => (
              <span key={l} className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-[12px] font-medium text-gray-700">
                {l}
              </span>
            ))}
          </div>
        </div>

        {/* ── Pricing ── */}
        <div
          className="relative overflow-hidden rounded-2xl px-4 py-4 text-white shadow-sm"
          style={{ background: "linear-gradient(130deg,#3d1a00 0%,#78350f 100%)" }}
        >
          <div className="pointer-events-none absolute -right-6 -top-6 size-28 rounded-full bg-amber-400/10 blur-2xl" aria-hidden />
          <p className="text-[11px] font-bold uppercase tracking-widest text-amber-300/70 mb-1">Chat Rate</p>
          <div className="flex items-end gap-1">
            <span className="text-[34px] font-black leading-none">₹{a.chatRateInrPerMin}</span>
            <span className="mb-1 text-[14px] font-medium text-white/60">/minute</span>
          </div>
          <p className="mt-1 text-[11px] text-white/50">Billing starts only after astrologer joins</p>
          {isLoggedIn && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2">
              <Wallet className="size-3.5 text-amber-300" />
              <span className="text-[12px] text-white/80">
                Your wallet: <span className="font-bold text-white">{formatInrFromPaise(balancePaise)}</span>
              </span>
              <Link href="/astrologers/wallet" className="ml-auto text-[11px] font-bold text-amber-300 hover:text-amber-200">
                + Add
              </Link>
            </div>
          )}
        </div>

        {/* ── Reviews ── */}
        <div className="rounded-2xl border border-gray-100 bg-white px-4 py-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Recent Reviews</p>
            <div className="flex items-center gap-1">
              <Star className="size-3.5 fill-amber-400 text-amber-400" />
              <span className="text-[12px] font-bold text-gray-700">{a.rating} · {a.reviewCount.toLocaleString("en-IN")}</span>
            </div>
          </div>
          <div className="space-y-3">
            {REVIEWS.map((r, i) => (
              <div key={i} className="border-t border-gray-50 pt-3 first:border-t-0 first:pt-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13px] font-semibold text-gray-800">{r.name}</span>
                  <span className="text-[10px] text-gray-400">{r.ago}</span>
                </div>
                <StarRow rating={r.stars} small />
                <p className="mt-1 text-[12px] leading-relaxed text-gray-600">{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Sticky CTA — sits above the 60px AppBottomNav ── */}
      <div
        className="fixed bottom-[60px] left-0 right-0 z-50 border-t border-gray-100 bg-white/95 px-4 py-3 backdrop-blur-sm"
      >
        <div className="mx-auto max-w-lg">
          <button
            type="button"
            disabled={starting}
            onClick={() => void handleChat()}
            className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-[16px] font-black transition active:scale-[0.98] shadow-lg ${
              a.isOnline
                ? "text-gray-900"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
            style={a.isOnline ? {
              background: "linear-gradient(130deg,#fbbf24 0%,#f59e0b 100%)",
              boxShadow: "0 4px 20px rgba(251,191,36,0.35)",
            } : {}}
          >
            {starting ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <>
                {a.isOnline ? <Zap className="size-5" /> : <MessageCircle className="size-5" />}
                {a.isOnline ? `Chat Now · ₹${a.chatRateInrPerMin}/min` : "Currently Offline"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
