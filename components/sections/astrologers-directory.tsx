"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Search, SlidersHorizontal, Wallet, X, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { track } from "@/lib/analytics/events";
import {
  LIVE_CHAT_ASTROLOGERS,
  LIVE_CHAT_CATEGORIES,
  type LiveChatAstrologer,
  type LiveChatCategory,
} from "@/lib/data/live-chat-astrologers";

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="flex gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm animate-pulse">
      <div className="flex flex-col items-center gap-1.5 shrink-0">
        <div className="size-[72px] rounded-full bg-gray-200" />
        <div className="h-2.5 w-16 rounded bg-gray-200" />
        <div className="h-2 w-14 rounded bg-gray-200" />
      </div>
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-4 w-32 rounded bg-gray-200" />
        <div className="h-3 w-24 rounded bg-gray-200" />
        <div className="h-3 w-20 rounded bg-gray-200" />
        <div className="h-3 w-28 rounded bg-gray-200" />
        <div className="flex justify-between items-center pt-1">
          <div className="h-4 w-20 rounded bg-gray-200" />
          <div className="h-8 w-20 rounded-full bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

// ─── Stars ────────────────────────────────────────────────────────────────────
function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-[1px]">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 12 12" className="size-[11px]" aria-hidden>
          <path
            d="M6 1l1.33 2.69 2.97.43-2.15 2.09.51 2.96L6 7.77l-2.66 1.4.51-2.96L1.7 4.12l2.97-.43z"
            fill={i < Math.floor(rating) ? "#F59E0B" : "#E5E7EB"}
            stroke={i < Math.floor(rating) ? "#F59E0B" : "#E5E7EB"}
            strokeWidth="0.5"
          />
        </svg>
      ))}
    </div>
  );
}

// ─── Badge ribbon ─────────────────────────────────────────────────────────────
function BadgeRibbon({ label }: { label: string }) {
  return (
    <div className="absolute left-0 top-3 z-10 w-[80px] overflow-hidden">
      <div className="bg-gray-900 text-white text-[7.5px] font-bold py-[3.5px] text-center tracking-wide shadow-sm rotate-[-38deg] -translate-x-5 translate-y-0 w-full">
        {label}
      </div>
    </div>
  );
}

// ─── Astrologer Card ──────────────────────────────────────────────────────────
function AstrologerCard({
  a,
  isStarting,
  onChat,
}: {
  a: LiveChatAstrologer;
  isStarting: boolean;
  onChat: () => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const featured = !!a.featured;

  const ordersLabel =
    a.reviewCount >= 10000
      ? `${Math.floor(a.reviewCount / 1000)}k+`
      : a.reviewCount >= 1000
        ? `${(a.reviewCount / 1000).toFixed(1)}k`
        : `${a.reviewCount}`;

  return (
    <div
      className={`relative overflow-hidden flex flex-col rounded-2xl transition-transform active:scale-[0.99] ${
        featured
          ? "border-2 border-amber-400 bg-white shadow-lg shadow-amber-100"
          : "border border-gray-100 bg-white shadow-sm"
      }`}
    >
      {/* ── Featured gold header strip ── */}
      {featured && (
        <div
          className="flex items-center justify-between px-4 py-2"
          style={{ background: "linear-gradient(90deg,#78350f 0%,#b45309 40%,#d97706 70%,#f59e0b 100%)" }}
        >
          <div className="flex items-center gap-1.5">
            <span className="text-[13px]">👑</span>
            <span className="text-[11px] font-black uppercase tracking-widest text-amber-100">Top Expert · Featured</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-300">Online</span>
          </div>
        </div>
      )}

      {/* Subtle golden shimmer line */}
      {featured && (
        <div className="pointer-events-none h-px w-full bg-gradient-to-r from-transparent via-amber-300/60 to-transparent" aria-hidden />
      )}

      <div className={`flex gap-3.5 ${featured ? "p-4 pt-3.5 bg-gradient-to-b from-amber-50/50 to-white" : "p-4"}`}>
        {/* ── Left col: avatar + stars + orders ─────────────── */}
        <div className="flex shrink-0 flex-col items-center gap-1">
          {/* Avatar */}
          <div className="relative" style={{ width: featured ? 80 : 72, height: featured ? 80 : 72 }}>
            {a.badge && <BadgeRibbon label={a.badge} />}
            <div className={`absolute inset-0 rounded-full ${featured ? "ring-[3px] ring-amber-400 ring-offset-[3px] ring-offset-white" : "ring-2 ring-amber-400 ring-offset-[2.5px] ring-offset-white"}`} />
            {featured && (
              <div className="absolute inset-0 rounded-full ring-[6px] ring-amber-200/40 ring-offset-0" />
            )}
            {a.imageSrc && !imageFailed ? (
              <Image
                src={a.imageSrc}
                alt={a.name}
                width={160}
                height={160}
                className={`rounded-full object-cover object-top ${featured ? "size-[80px]" : "size-[72px]"}`}
                onError={() => setImageFailed(true)}
              />
            ) : (
              <div
                className={`flex items-center justify-center rounded-full bg-gradient-to-br ${a.avatarGradient} text-base font-bold text-white ${featured ? "size-[80px]" : "size-[72px]"}`}
              >
                {a.initials}
              </div>
            )}
          </div>

          <StarRow rating={a.rating} />
          <span className={`whitespace-nowrap ${featured ? "text-[10px] font-semibold text-amber-700" : "text-[10px] text-gray-500"}`}>{ordersLabel} orders</span>
        </div>

        {/* ── Right col: info + CTA ──────────────────────────── */}
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div>
            {/* Name + verified */}
            <div className="flex items-center gap-1">
              <Link
                href={`/astrologers/${a.slug}`}
                className={`truncate font-bold leading-tight transition ${featured ? "text-[16px] text-amber-900 hover:text-amber-700" : "text-[15px] text-gray-900 hover:text-amber-700"}`}
              >
                {a.name}
              </Link>
              <CheckCircle2
                className={`size-[14px] shrink-0 ${featured ? "text-amber-500" : "text-green-500"}`}
                aria-label="Verified"
              />
            </div>

            <p className="mt-0.5 truncate text-[12px] text-gray-500">{a.specialties.slice(0, 3).join(", ")}</p>
            <p className="text-[12px] text-gray-500">{a.languages.join(", ")}</p>
            <p className="text-[12px] text-gray-500">Exp- {a.experienceYears} Years</p>
          </div>

          {/* Price + Chat */}
          <div className="mt-2 flex items-center justify-between">
            <span className={`font-bold ${featured ? "text-[15px] text-amber-900" : "text-[14px] text-gray-900"}`}>
              ₹ {a.chatRateInrPerMin}
              <span className="text-[11px] font-normal text-gray-400">/min</span>
            </span>

            <div className="flex flex-col items-end gap-0.5">
              <button
                type="button"
                disabled={isStarting}
                onClick={onChat}
                className={`min-w-[72px] rounded-full px-4 py-1.5 text-[13px] font-semibold transition active:scale-95 disabled:opacity-60 ${
                  featured
                    ? "bg-amber-400 text-gray-900 hover:bg-amber-500 shadow-sm shadow-amber-200"
                    : a.waitMinutes
                      ? "border border-red-400 text-red-500 hover:bg-red-50"
                      : "border border-green-500 text-green-600 hover:bg-green-50"
                }`}
              >
                {isStarting ? (
                  <span className="flex items-center justify-center gap-1">
                    <svg className="size-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  </span>
                ) : featured ? "Chat Now" : "Chat"}
              </button>
              {a.waitMinutes ? (
                <span className="text-[10px] text-red-400">wait ~ {a.waitMinutes}m</span>
              ) : a.isOnline ? (
                <span className={`text-[10px] ${featured ? "font-semibold text-amber-600" : "text-green-500"}`}>
                  {featured ? "🟢 Available" : "Available"}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Banner carousel ──────────────────────────────────────────────────────────
type Banner = {
  tag: string;
  headline: string;
  sub: string;
  bg: string;
  tagColor: string;
  subColor: string;
  svg: React.ReactNode;
};

const BANNERS: Banner[] = [
  {
    tag: "🎁 Limited Offer",
    headline: "100% Cashback on ₹100+",
    sub: "Recharge now — get double balance!",
    bg: "linear-gradient(130deg,#052e16 0%,#14532d 60%,#166534 100%)",
    tagColor: "text-emerald-300",
    subColor: "text-emerald-200/80",
    svg: (
      <svg viewBox="0 0 64 64" fill="none" className="size-full">
        {/* Gift box */}
        <rect x="10" y="28" width="44" height="26" rx="3" fill="#4ade80" opacity="0.25"/>
        <rect x="8" y="22" width="48" height="9" rx="3" fill="#4ade80" opacity="0.35"/>
        <rect x="29" y="22" width="6" height="32" rx="2" fill="#86efac" opacity="0.5"/>
        <path d="M32 22 C32 22 22 16 20 10 C18 4 28 2 32 10 C36 2 46 4 44 10 C42 16 32 22 32 22Z" fill="#86efac" opacity="0.6"/>
        {/* Stars */}
        <circle cx="52" cy="14" r="2" fill="#bbf7d0" opacity="0.7"/>
        <circle cx="14" cy="12" r="1.5" fill="#bbf7d0" opacity="0.5"/>
        <circle cx="56" cy="36" r="1.5" fill="#86efac" opacity="0.4"/>
      </svg>
    ),
  },
  {
    tag: "💸 Best Value",
    headline: "Chat from just ₹29/min",
    sub: "Expert guidance at pocket-friendly rates",
    bg: "linear-gradient(130deg,#1e1b4b 0%,#312e81 60%,#3730a3 100%)",
    tagColor: "text-violet-300",
    subColor: "text-violet-200/80",
    svg: (
      <svg viewBox="0 0 64 64" fill="none" className="size-full">
        {/* Coin stack */}
        <ellipse cx="32" cy="48" rx="18" ry="6" fill="#818cf8" opacity="0.3"/>
        <ellipse cx="32" cy="42" rx="18" ry="6" fill="#818cf8" opacity="0.35"/>
        <ellipse cx="32" cy="36" rx="18" ry="6" fill="#818cf8" opacity="0.4"/>
        <ellipse cx="32" cy="30" rx="18" ry="6" fill="#a5b4fc" opacity="0.45"/>
        <text x="32" y="34" textAnchor="middle" fill="#c7d2fe" fontSize="7" fontWeight="bold">₹</text>
        {/* Sparkles */}
        <circle cx="10" cy="20" r="2" fill="#c7d2fe" opacity="0.6"/>
        <circle cx="54" cy="16" r="1.5" fill="#a5b4fc" opacity="0.5"/>
        <path d="M50 44 L52 40 L54 44 L52 48Z" fill="#c7d2fe" opacity="0.4"/>
      </svg>
    ),
  },
  {
    tag: "❓ Love & Relationships",
    headline: "Will my ex come back?",
    sub: "Ask an astrologer now →",
    bg: "linear-gradient(130deg,#4c0519 0%,#881337 60%,#9f1239 100%)",
    tagColor: "text-rose-300",
    subColor: "text-rose-200/80",
    svg: (
      <svg viewBox="0 0 64 64" fill="none" className="size-full">
        {/* Heart */}
        <path d="M32 50 C32 50 8 36 8 20 C8 12 14 8 20 8 C25 8 29 11 32 15 C35 11 39 8 44 8 C50 8 56 12 56 20 C56 36 32 50 32 50Z" fill="#fb7185" opacity="0.35"/>
        <path d="M32 44 C32 44 14 33 14 20 C14 15 17 12 20 12 C24 12 28 15 32 20 C36 15 40 12 44 12 C47 12 50 15 50 20 C50 33 32 44 32 44Z" fill="#fda4af" opacity="0.3"/>
        {/* Small hearts */}
        <circle cx="50" cy="40" r="3" fill="#fb7185" opacity="0.4"/>
        <circle cx="12" cy="42" r="2" fill="#fda4af" opacity="0.35"/>
      </svg>
    ),
  },
  {
    tag: "📈 Career & Growth",
    headline: "Career growth this year?",
    sub: "Get Vedic guidance today →",
    bg: "linear-gradient(130deg,#0c1a2e 0%,#0c2340 60%,#0e3460 100%)",
    tagColor: "text-blue-300",
    subColor: "text-blue-200/80",
    svg: (
      <svg viewBox="0 0 64 64" fill="none" className="size-full">
        {/* Rising arrow chart */}
        <polyline points="8,50 20,40 30,44 44,26 56,14" stroke="#60a5fa" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
        <circle cx="8" cy="50" r="3" fill="#60a5fa" opacity="0.5"/>
        <circle cx="44" cy="26" r="3" fill="#60a5fa" opacity="0.5"/>
        <circle cx="56" cy="14" r="4" fill="#93c5fd" opacity="0.55"/>
        {/* Stars */}
        <circle cx="16" cy="16" r="2" fill="#bfdbfe" opacity="0.5"/>
        <circle cx="50" cy="46" r="1.5" fill="#93c5fd" opacity="0.4"/>
      </svg>
    ),
  },
  {
    tag: "💍 Marriage & Timing",
    headline: "When will I get married?",
    sub: "Chat with a Vedic expert →",
    bg: "linear-gradient(130deg,#2d1b00 0%,#78350f 60%,#92400e 100%)",
    tagColor: "text-amber-300",
    subColor: "text-amber-200/80",
    svg: (
      <svg viewBox="0 0 64 64" fill="none" className="size-full">
        {/* Ring */}
        <circle cx="32" cy="30" r="16" stroke="#fbbf24" strokeWidth="4" opacity="0.4" fill="none"/>
        <circle cx="32" cy="30" r="10" stroke="#fcd34d" strokeWidth="2.5" opacity="0.35" fill="none"/>
        {/* Diamond on top */}
        <path d="M32 14 L26 20 L32 26 L38 20Z" fill="#fde68a" opacity="0.5"/>
        <path d="M26 20 L32 26 L38 20" fill="#fcd34d" opacity="0.3"/>
        {/* Stars */}
        <circle cx="10" cy="12" r="2" fill="#fde68a" opacity="0.5"/>
        <circle cx="52" cy="50" r="1.5" fill="#fbbf24" opacity="0.45"/>
        <circle cx="54" cy="18" r="2.5" fill="#fde68a" opacity="0.4"/>
      </svg>
    ),
  },
  {
    tag: "🔮 Vedic Insights",
    headline: "Know your destiny today",
    sub: "Kundli reading with top astrologers →",
    bg: "linear-gradient(130deg,#14062a 0%,#2d1154 60%,#3b1764 100%)",
    tagColor: "text-purple-300",
    subColor: "text-purple-200/80",
    svg: (
      <svg viewBox="0 0 64 64" fill="none" className="size-full">
        {/* Crystal ball */}
        <circle cx="32" cy="30" r="18" fill="#a78bfa" opacity="0.2"/>
        <circle cx="32" cy="30" r="18" stroke="#c4b5fd" strokeWidth="1.5" opacity="0.4" fill="none"/>
        <ellipse cx="26" cy="22" rx="5" ry="3" fill="white" opacity="0.12" transform="rotate(-30 26 22)"/>
        {/* Stand */}
        <path d="M20 48 Q32 44 44 48" stroke="#a78bfa" strokeWidth="2.5" opacity="0.45" fill="none" strokeLinecap="round"/>
        {/* Stars inside ball */}
        <circle cx="28" cy="28" r="1.5" fill="#ddd6fe" opacity="0.6"/>
        <circle cx="36" cy="24" r="1" fill="#ede9fe" opacity="0.5"/>
        <circle cx="34" cy="34" r="1.5" fill="#c4b5fd" opacity="0.55"/>
        {/* Outer stars */}
        <circle cx="8" cy="10" r="1.5" fill="#ddd6fe" opacity="0.5"/>
        <circle cx="56" cy="14" r="2" fill="#c4b5fd" opacity="0.45"/>
      </svg>
    ),
  },
];

function BannerCarousel() {
  const [idx, setIdx] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timer.current = setTimeout(() => setIdx((p) => (p + 1) % BANNERS.length), 3800);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [idx]);

  const b = BANNERS[idx];

  return (
    <div
      className="relative mx-4 mb-3 overflow-hidden rounded-2xl cursor-pointer select-none"
      style={{ background: b.bg, minHeight: 96 }}
    >
      {/* Glow orb */}
      <div className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-white/5 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" aria-hidden />

      <div className="flex items-center gap-3 px-5 py-4">
        <div className="flex-1 min-w-0">
          <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${b.tagColor}`}>
            {b.tag}
          </p>
          <p className="text-[16px] font-black text-white leading-snug">
            {b.headline}
          </p>
          <p className={`mt-1 text-[11px] font-semibold ${b.subColor}`}>
            {b.sub}
          </p>
        </div>
        <div className="size-[72px] shrink-0 opacity-80">
          {b.svg}
        </div>
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
        {BANNERS.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIdx(i)}
            className={`rounded-full transition-all duration-300 ${i === idx ? "w-4 h-1.5 bg-white" : "size-1.5 bg-white/40"}`}
            aria-label={`Banner ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Category label shorten ───────────────────────────────────────────────────
const CAT_ICON: Record<string, string> = {
  "All": "⊞",
  "Love & marriage": "♡",
  "Career": "💼",
  "Wealth & business": "₹",
  "Vedic & kundli": "🔮",
  "Vastu": "🏠",
  "Tarot & intuition": "✦",
};
const CAT_LABEL: Record<string, string> = {
  "Love & marriage": "Love",
  "Wealth & business": "Wealth",
  "Tarot & intuition": "Tarot",
  "Vedic & kundli": "Vedic",
};

function sortAstrologers(list: LiveChatAstrologer[]): LiveChatAstrologer[] {
  return [...list].sort((a, b) => {
    // Featured always pin to top
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
    if (b.rating !== a.rating) return b.rating - a.rating;
    return a.chatRateInrPerMin - b.chatRateInrPerMin;
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function AstrologersDirectory() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [category, setCategory] = useState<LiveChatCategory>("All");
  const [startingId, setStartingId] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const [chatErrorWalletHint, setChatErrorWalletHint] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    track.astrologersDirectoryViewed();
    const t = setTimeout(() => setIsInitialLoad(false), 500);
    return () => clearTimeout(t);
  }, []);

  async function startChat(a: LiveChatAstrologer) {
    setChatError(null);
    setChatErrorWalletHint(false);
    track.astrologerChatCtaClicked(a.id, a.slug);
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push(`/login?redirect=${encodeURIComponent("/astrologers")}`);
      return;
    }
    setStartingId(a.id);
    try {
      const res = await fetch("/api/user/chat-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ astrologerId: a.id }),
      });
      const data = (await res.json()) as { sessionId?: string; error?: string; code?: string };
      if (!res.ok) {
        setChatErrorWalletHint(data.code === "INSUFFICIENT_BALANCE_FOR_CHAT");
        setChatError(data.error ?? "Could not start chat. Try again.");
        return;
      }
      if (data.sessionId) {
        router.push(`/astrologers/chats/waiting/${encodeURIComponent(data.sessionId)}`);
      }
    } catch {
      setChatError("Network error — check your connection.");
    } finally {
      setStartingId(null);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = LIVE_CHAT_ASTROLOGERS;
    if (category !== "All") list = list.filter((a) => a.specialties.includes(category));
    if (q) list = list.filter((a) =>
      a.name.toLowerCase().includes(q) ||
      a.specialties.some((s) => s.toLowerCase().includes(q)) ||
      a.languages.some((l) => l.toLowerCase().includes(q))
    );
    return sortAstrologers(list);
  }, [query, category]);

  return (
    <>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}`}</style>

      <div className="min-h-screen bg-gray-50">
        {/* ── Sticky filter row ── */}
        <div className="sticky top-0 z-30 bg-white shadow-[0_1px_0_rgba(0,0,0,0.06)]">
          {showSearch && (
            <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-2.5">
              <Search className="size-4 shrink-0 text-gray-400" />
              <input
                autoFocus
                type="search"
                placeholder="Search name, topic, or language…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
              />
              <button type="button" onClick={() => { setShowSearch(false); setQuery(""); }} aria-label="Close search">
                <X className="size-4 text-gray-400" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 overflow-x-auto px-4 py-2.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {/* Filter button */}
            <button
              type="button"
              onClick={() => setShowSearch((s) => !s)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${
                showSearch ? "border-amber-400 text-amber-700 bg-amber-50" : "border-gray-200 text-gray-600 bg-white"
              }`}
            >
              <SlidersHorizontal className="size-3.5" />
              Filter
            </button>

            {LIVE_CHAT_CATEGORIES.map((cat) => {
              const active = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition-all ${
                    active
                      ? "border-amber-400 bg-white text-gray-900 shadow-sm"
                      : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`}
                >
                  <span aria-hidden className="text-[11px]">{CAT_ICON[cat] ?? "●"}</span>
                  {CAT_LABEL[cat] ?? cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Banner ── */}
        <div className="pt-3">
          <BannerCarousel />
        </div>

        {/* ── Generic (non-wallet) error toast ── */}
        {chatError && !chatErrorWalletHint && (
          <div className="mx-4 mb-3 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800" role="alert">
            <p className="flex-1">{chatError}</p>
            <button type="button" onClick={() => setChatError(null)} aria-label="Dismiss">
              <X className="size-4 text-gray-400" />
            </button>
          </div>
        )}

        {/* ── Insufficient balance popup ── */}
        {chatErrorWalletHint && chatError && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => { setChatError(null); setChatErrorWalletHint(false); }}
          >
            <div
              className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header — deep dark bg for max contrast */}
              <div className="relative overflow-hidden px-5 pt-5 pb-4 text-white" style={{background:"linear-gradient(135deg,#1a0533 0%,#2d0a52 60%,#3b0f6e 100%)"}}>
                <div className="pointer-events-none absolute -right-6 -top-6 size-28 rounded-full bg-violet-400/10 blur-2xl" aria-hidden />
                <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-violet-300/30 to-transparent" aria-hidden />
                <button
                  type="button"
                  onClick={() => { setChatError(null); setChatErrorWalletHint(false); }}
                  className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-full bg-white/15 text-white/70 hover:bg-white/25 transition"
                  aria-label="Close"
                >
                  <X className="size-3.5" />
                </button>

                {/* Icon + title */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-400/20 border border-amber-300/30">
                    <svg viewBox="0 0 40 40" fill="none" className="size-7">
                      <circle cx="20" cy="20" r="18" fill="#fbbf24" opacity="0.15"/>
                      <rect x="8" y="17" width="24" height="16" rx="3" fill="#fcd34d" opacity="0.6"/>
                      <rect x="6" y="12" width="28" height="7" rx="2.5" fill="#fde68a" opacity="0.7"/>
                      <rect x="18" y="12" width="4" height="21" rx="1.5" fill="#fff" opacity="0.4"/>
                      <path d="M20 12 C20 12 15 9 14 6 C13 3 17 2 20 6 C23 2 27 3 26 6 C25 9 20 12 20 12Z" fill="#fff" opacity="0.5"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-violet-300/80">Low Balance</p>
                    <p className="text-[19px] font-black leading-tight text-white">Add min. 5 min balance</p>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/8 px-3 py-2.5">
                  <p className="text-[12px] leading-relaxed text-white/85">{chatError}</p>
                </div>
              </div>

              {/* Body */}
              <div className="px-5 py-4 space-y-3">
                {/* 100% cashback offer */}
                <div className="relative overflow-hidden flex items-center gap-3 rounded-2xl px-4 py-3.5" style={{background:"linear-gradient(130deg,#052e16 0%,#14532d 100%)"}}>
                  <div className="pointer-events-none absolute -right-4 -top-4 size-16 rounded-full bg-emerald-400/15 blur-xl" aria-hidden />
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/20 border border-emerald-400/30 text-lg">🎁</div>
                  <div>
                    <p className="text-[13px] font-black text-emerald-300">100% Cashback on ₹100+</p>
                    <p className="text-[11px] text-emerald-400/80">Recharge ₹100 — get ₹200 balance free!</p>
                  </div>
                  <span className="ml-auto shrink-0 rounded-full bg-emerald-400 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-950">Live</span>
                </div>

                <Link
                  href="/astrologers/wallet"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-[15px] font-black text-gray-900 shadow-lg transition active:scale-[0.98]"
                  style={{background:"linear-gradient(130deg,#fbbf24 0%,#f59e0b 100%)", boxShadow:"0 4px 20px rgba(251,191,36,0.4)"}}
                  onClick={() => { setChatError(null); setChatErrorWalletHint(false); }}
                >
                  <Zap className="size-4" />
                  Recharge Wallet Now
                </Link>
                <button
                  type="button"
                  onClick={() => { setChatError(null); setChatErrorWalletHint(false); }}
                  className="w-full text-center text-[12px] font-medium text-gray-400 underline-offset-2 hover:text-gray-600 hover:underline transition"
                >
                  Maybe later
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── List ── */}
        <div className="mx-auto max-w-2xl space-y-3 px-4 pb-28">
          {!isInitialLoad && filtered.length > 0 && (
            <p className="pb-1 text-[11px] font-medium text-gray-400">
              {filtered.length} astrologer{filtered.length !== 1 ? "s" : ""} available
            </p>
          )}

          {isInitialLoad ? (
            Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-gray-100">
                <Search className="size-7 text-gray-400" />
              </div>
              <p className="font-semibold text-gray-800">No astrologers found</p>
              <button
                type="button"
                className="rounded-full border border-gray-200 bg-white px-5 py-2 text-sm font-medium hover:bg-gray-50"
                onClick={() => { setQuery(""); setCategory("All"); }}
              >
                Reset filters
              </button>
            </div>
          ) : filtered.map((a, i) => (
            <div key={a.id} style={{ animation: `fadeUp 0.3s ease ${i * 35}ms both` }}>
              <AstrologerCard a={a} isStarting={startingId === a.id} onChat={() => void startChat(a)} />
            </div>
          ))}
        </div>

        {/* Chat start overlay */}
        {startingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="size-12 rounded-full border-2 border-amber-200 border-t-amber-500 animate-spin" />
              <p className="text-sm font-medium text-gray-600">Connecting…</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
