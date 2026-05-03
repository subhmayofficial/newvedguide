"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  MessageCircle,
  Search,
  Star,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { track } from "@/lib/analytics/events";
import {
  formatInrWhole,
  LIVE_CHAT_ASTROLOGERS,
  LIVE_CHAT_CATEGORIES,
  type LiveChatAstrologer,
  type LiveChatCategory,
} from "@/lib/data/live-chat-astrologers";

// ─── Astrology Loader ─────────────────────────────────────────────────────────

function AstrologyLoader() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-5">
      <div className="relative size-20">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-2 border-brand/20 border-t-brand animate-spin [animation-duration:1.6s]" />
        {/* Middle ring */}
        <div className="absolute inset-2 rounded-full border-2 border-gold/20 border-b-gold animate-spin [animation-duration:2.4s] [animation-direction:reverse]" />
        {/* Center orb */}
        <div className="absolute inset-[18%] rounded-full bg-gradient-to-br from-brand/40 to-gold/30 animate-pulse" />
        {/* Star dots */}
        {[0, 60, 120, 180, 240, 300].map((deg, i) => (
          <div
            key={deg}
            className="absolute size-1.5 rounded-full bg-gold"
            style={{
              top: "50%",
              left: "50%",
              transform: `rotate(${deg}deg) translateX(34px) translateY(-50%)`,
              opacity: 0.6 + (i % 2) * 0.4,
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
      <div className="flex flex-col items-center gap-1">
        <p className="text-sm font-medium text-foreground">Finding your guide…</p>
        <p className="text-xs text-muted-foreground">Aligning the stars</p>
      </div>
      <div className="flex gap-1.5">
        {[0, 140, 280].map((delay) => (
          <span
            key={delay}
            className="h-1.5 w-1.5 rounded-full bg-brand/60 animate-bounce"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Skeleton Card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 animate-pulse">
      <div className="size-16 shrink-0 rounded-full bg-muted" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-4 w-28 rounded-md bg-muted" />
          <div className="h-4 w-12 rounded-full bg-muted" />
        </div>
        <div className="h-3 w-36 rounded-md bg-muted" />
        <div className="h-3 w-24 rounded-md bg-muted" />
        <div className="flex items-center gap-3">
          <div className="h-3 w-16 rounded-md bg-muted" />
          <div className="h-3 w-20 rounded-md bg-muted" />
        </div>
      </div>
      <div className="shrink-0 flex flex-col items-end gap-2">
        <div className="h-4 w-16 rounded-md bg-muted" />
        <div className="h-9 w-20 rounded-xl bg-muted" />
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
  const ordersLabel =
    a.reviewCount >= 10000
      ? `${Math.floor(a.reviewCount / 1000)}k+`
      : a.reviewCount >= 1000
        ? `${(a.reviewCount / 1000).toFixed(1)}k`
        : `${a.reviewCount}`;

  return (
    <div className="group relative flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3.5 shadow-sm transition-all duration-200 hover:border-brand/30 hover:shadow-md active:scale-[0.99]">
      {/* Avatar */}
      <div className="relative shrink-0">
        {a.imageSrc ? (
          <div className="size-16 overflow-hidden rounded-full ring-2 ring-gold/30 ring-offset-1 ring-offset-card">
            <Image
              src={a.imageSrc}
              alt={a.name}
              width={128}
              height={128}
              className="size-full object-cover object-top"
            />
          </div>
        ) : (
          <div
            className={`flex size-16 items-center justify-center rounded-full bg-gradient-to-br ${a.avatarGradient} text-base font-bold text-white ring-2 ring-white/20 ring-offset-1 ring-offset-card`}
          >
            {a.initials}
          </div>
        )}
        {/* Online dot */}
        <span
          className={`absolute bottom-0.5 right-0.5 size-3.5 rounded-full border-2 border-card ${
            a.isOnline ? "bg-emerald-500" : "bg-muted-foreground/40"
          }`}
          aria-label={a.isOnline ? "Online" : "Offline"}
        />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-heading text-[15px] font-semibold leading-tight text-foreground truncate">
            {a.name}
          </span>
          {a.isOnline && (
            <span className="shrink-0 inline-flex items-center gap-0.5 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
              ● Online
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[12px] text-muted-foreground leading-tight truncate">
          {a.specialties.slice(0, 3).join(", ")}
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground/80 truncate">
          {a.languages.join(", ")}
        </p>
        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-0.5 text-[12px] font-semibold text-amber-600 dark:text-amber-400">
            <Star className="size-3 fill-current" aria-hidden />
            {a.rating.toFixed(1)}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {ordersLabel} orders
          </span>
          <span className="text-[11px] text-muted-foreground">
            Exp: {a.experienceYears} Yrs
          </span>
        </div>
      </div>

      {/* Rate + CTA */}
      <div className="shrink-0 flex flex-col items-end gap-2">
        <p className="text-[13px] font-bold text-foreground tabular-nums">
          ₹{formatInrWhole(a.chatRateInrPerMin)}
          <span className="text-[10px] font-normal text-muted-foreground">/min</span>
        </p>
        <button
          type="button"
          disabled={isStarting}
          onClick={onChat}
          className="flex items-center gap-1.5 rounded-xl border border-brand bg-brand px-3 py-2 text-[12px] font-semibold text-white shadow-sm transition hover:bg-brand-hover disabled:opacity-60 active:scale-95"
        >
          {isStarting ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <MessageCircle className="size-3.5" />
          )}
          Chat
        </button>
      </div>
    </div>
  );
}

function sortAstrologers(list: LiveChatAstrologer[]): LiveChatAstrologer[] {
  return [...list].sort((a, b) => {
    if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
    if (b.rating !== a.rating) return b.rating - a.rating;
    return a.chatRateInrPerMin - b.chatRateInrPerMin;
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AstrologersDirectory() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<LiveChatCategory>("All");
  const [startingId, setStartingId] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const [chatErrorWalletHint, setChatErrorWalletHint] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    track.astrologersDirectoryViewed();
    // Brief delay to show skeleton then animate in
    const t = setTimeout(() => setIsInitialLoad(false), 600);
    return () => clearTimeout(t);
  }, []);

  async function startChat(a: LiveChatAstrologer) {
    setChatError(null);
    setChatErrorWalletHint(false);
    track.astrologerChatCtaClicked(a.id, a.slug);
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
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
      const data = (await res.json()) as {
        sessionId?: string;
        error?: string;
        code?: string;
      };
      if (!res.ok) {
        setChatErrorWalletHint(data.code === "INSUFFICIENT_BALANCE_FOR_CHAT");
        setChatError(
          data.error ??
            (data.code === "SCHEMA_NOT_READY"
              ? "Database setup pending — run Supabase migration 026, then retry."
              : "Could not start chat. Try again in a moment.")
        );
        return;
      }
      if (data.sessionId) {
        router.push(
          `/astrologers/chats/waiting/${encodeURIComponent(data.sessionId)}`
        );
      }
    } catch {
      setChatError("Network error — check your connection and try again.");
    } finally {
      setStartingId(null);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = LIVE_CHAT_ASTROLOGERS;
    if (category !== "All") {
      list = list.filter((a) => a.specialties.includes(category));
    }
    if (q) {
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.title.toLowerCase().includes(q) ||
          a.specialties.some((s) => s.toLowerCase().includes(q)) ||
          a.languages.some((l) => l.toLowerCase().includes(q))
      );
    }
    return sortAstrologers(list);
  }, [query, category]);

  return (
    <>
      <style>{`
        @keyframes vg-dir-fadein {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .vg-dir-card-enter {
          animation: vg-dir-fadein 0.32s ease both;
        }
        @keyframes vg-chakra-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="min-h-screen bg-background">
        {/* ── Sticky top bar ── */}
        <div className="sticky top-0 z-30 border-b border-border/60 bg-background/95 backdrop-blur-md">
          {/* Title row */}
          <div className="px-4 pt-4 pb-2">
            <h1 className="font-heading text-xl font-bold tracking-tight text-foreground">
              Chat with Astrologer
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Verified experts · Pay per minute · Private sessions
            </p>
          </div>

          {/* Search */}
          <div className="relative px-4 pb-3">
            <Search className="pointer-events-none absolute left-7 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search name, topic, or language…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-muted/40 pl-10 pr-4 text-sm outline-none ring-brand/20 transition placeholder:text-muted-foreground focus:border-brand/40 focus:bg-background focus:ring-2"
              aria-label="Search astrologers"
            />
          </div>

          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto px-4 pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {LIVE_CHAT_CATEGORIES.map((cat) => {
              const active = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-all duration-150 ${
                    active
                      ? "bg-brand text-white shadow-sm shadow-brand/30"
                      : "border border-border bg-card text-muted-foreground hover:border-brand/30 hover:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Error banner ── */}
        {chatError && (
          <div
            role="alert"
            className={`mx-4 mt-4 flex gap-3 rounded-2xl border px-4 py-3 text-sm text-foreground ${
              chatErrorWalletHint
                ? "border-red-400/50 bg-red-50 dark:bg-red-950/30"
                : "border-amber-500/40 bg-amber-500/10"
            }`}
          >
            <div className="min-w-0 flex-1">
              <p className="leading-relaxed">{chatError}</p>
              {chatErrorWalletHint ? (
                <Link
                  href="/astrologers/wallet"
                  className="mt-2 inline-flex items-center rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700"
                >
                  Recharge wallet
                </Link>
              ) : null}
            </div>
            <button
              type="button"
              className="shrink-0 rounded-lg p-1 text-muted-foreground hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
              aria-label="Dismiss"
              onClick={() => {
                setChatError(null);
                setChatErrorWalletHint(false);
              }}
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        {/* ── List ── */}
        <div className="mx-auto max-w-2xl px-4 py-4 pb-24">
          {/* Count */}
          {!isInitialLoad && (
            <p className="mb-3 text-xs font-medium text-muted-foreground">
              {filtered.length} astrologer{filtered.length === 1 ? "" : "s"} available
            </p>
          )}

          {isInitialLoad ? (
            /* Skeleton */
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                <Search className="size-7 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">No astrologers match</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try another topic or clear your search.
                </p>
              </div>
              <button
                type="button"
                className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                onClick={() => { setQuery(""); setCategory("All"); }}
              >
                Reset filters
              </button>
            </div>
          ) : startingId && !filtered.some((a) => a.id === startingId) ? (
            <AstrologyLoader />
          ) : (
            /* Cards */
            <div className="space-y-3">
              {filtered.map((a, idx) => (
                <div
                  key={a.id}
                  className="vg-dir-card-enter"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <AstrologerCard
                    a={a}
                    isStarting={startingId === a.id}
                    onChat={() => void startChat(a)}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Global spinner when starting a chat */}
          {startingId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
              <AstrologyLoader />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
