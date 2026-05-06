"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Search, SlidersHorizontal, X } from "lucide-react";
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

  const ordersLabel =
    a.reviewCount >= 10000
      ? `${Math.floor(a.reviewCount / 1000)}k+`
      : a.reviewCount >= 1000
        ? `${(a.reviewCount / 1000).toFixed(1)}k`
        : `${a.reviewCount}`;

  return (
    <div className="relative flex gap-3.5 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-transform active:scale-[0.99]">
      {/* ── Left col: avatar + stars + orders ─────────────── */}
      <div className="flex shrink-0 flex-col items-center gap-1">
        {/* Avatar */}
        <div className="relative" style={{ width: 72, height: 72 }}>
          {a.badge && <BadgeRibbon label={a.badge} />}
          <div className="absolute inset-0 rounded-full ring-2 ring-amber-400 ring-offset-[2.5px] ring-offset-white" />
          {a.imageSrc && !imageFailed ? (
            <Image
              src={a.imageSrc}
              alt={a.name}
              width={144}
              height={144}
              className="size-[72px] rounded-full object-cover object-top"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div
              className={`flex size-[72px] items-center justify-center rounded-full bg-gradient-to-br ${a.avatarGradient} text-base font-bold text-white`}
            >
              {a.initials}
            </div>
          )}
        </div>

        <StarRow rating={a.rating} />
        <span className="text-[10px] text-gray-500 whitespace-nowrap">{ordersLabel} orders</span>
      </div>

      {/* ── Right col: info + CTA ──────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          {/* Name + verified */}
          <div className="flex items-center gap-1">
            <span className="truncate text-[15px] font-bold leading-tight text-gray-900">
              {a.name}
            </span>
            <CheckCircle2
              className="size-[14px] shrink-0 text-green-500"
              aria-label="Verified"
            />
          </div>

          <p className="mt-0.5 truncate text-[12px] text-gray-500">{a.specialties.slice(0, 3).join(", ")}</p>
          <p className="text-[12px] text-gray-500">{a.languages.join(", ")}</p>
          <p className="text-[12px] text-gray-500">Exp- {a.experienceYears} Years</p>
        </div>

        {/* Price + Chat */}
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[14px] font-bold text-gray-900">
            ₹ {a.chatRateInrPerMin}
            <span className="text-[11px] font-normal text-gray-400">/min</span>
          </span>

          <div className="flex flex-col items-end gap-0.5">
            <button
              type="button"
              disabled={isStarting}
              onClick={onChat}
              className={`min-w-[72px] rounded-full border px-4 py-1.5 text-[13px] font-semibold transition active:scale-95 disabled:opacity-60 ${
                a.waitMinutes
                  ? "border-red-400 text-red-500 hover:bg-red-50"
                  : "border-green-500 text-green-600 hover:bg-green-50"
              }`}
            >
              {isStarting ? (
                <span className="flex items-center justify-center gap-1">
                  <svg className="size-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                </span>
              ) : "Chat"}
            </button>
            {a.waitMinutes ? (
              <span className="text-[10px] text-red-400">wait ~ {a.waitMinutes}m</span>
            ) : a.isOnline ? (
              <span className="text-[10px] text-green-500">Available</span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Banner carousel ──────────────────────────────────────────────────────────
const BANNERS = [
  { q: "Will my ex come back?",     cta: "Ask an astrologer now" },
  { q: "Career growth this year?",  cta: "Get Vedic guidance today" },
  { q: "When will I get married?",  cta: "Chat with an expert" },
];

function BannerCarousel() {
  const [idx, setIdx] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timer.current = setTimeout(() => setIdx((p) => (p + 1) % BANNERS.length), 3800);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [idx]);

  return (
    <div
      className="relative mx-4 mb-3 overflow-hidden rounded-2xl"
      style={{ background: "linear-gradient(130deg,#FEF9C3 0%,#FDE68A 100%)" }}
    >
      <div className="flex h-[88px] items-center px-5">
        <div className="flex-1 pr-4">
          <p className="text-[15px] font-bold leading-snug text-gray-800">
            {BANNERS[idx].q}
          </p>
          <p className="mt-1 text-[11px] font-semibold text-amber-700">
            {BANNERS[idx].cta} →
          </p>
        </div>
        {/* Decorative */}
        <div className="size-16 shrink-0 opacity-25">
          <svg viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="12" fill="#D97706" />
            {[0,45,90,135,180,225,270,315].map((d,i)=>{
              const r=(d*Math.PI)/180;
              return <line key={i} x1={32+14*Math.cos(r)} y1={32+14*Math.sin(r)} x2={32+22*Math.cos(r)} y2={32+22*Math.sin(r)} stroke="#D97706" strokeWidth="3.5" strokeLinecap="round"/>;
            })}
          </svg>
        </div>
        <div className="pointer-events-none absolute -right-6 top-0 h-full w-24 rounded-full"
          style={{ background:"rgba(253,230,138,0.5)", filter:"blur(20px)" }} />
      </div>
      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
        {BANNERS.map((_,i)=>(
          <button key={i} type="button" onClick={()=>setIdx(i)}
            className={`rounded-full transition-all duration-300 ${i===idx?"size-2 bg-gray-800":"size-1.5 bg-gray-400/50"}`}
            aria-label={`Banner ${i+1}`}
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

        {/* ── Error ── */}
        {chatError && (
          <div className={`mx-4 mb-3 flex gap-3 rounded-2xl border px-4 py-3 text-sm ${
            chatErrorWalletHint ? "border-red-200 bg-red-50 text-red-700" : "border-amber-200 bg-amber-50 text-amber-800"
          }`} role="alert">
            <div className="flex-1">
              <p>{chatError}</p>
              {chatErrorWalletHint && (
                <Link href="/astrologers/wallet" className="mt-2 inline-flex rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700">
                  Recharge wallet
                </Link>
              )}
            </div>
            <button type="button" onClick={() => { setChatError(null); setChatErrorWalletHint(false); }} aria-label="Dismiss">
              <X className="size-4 text-gray-400" />
            </button>
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
