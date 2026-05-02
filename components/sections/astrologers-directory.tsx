"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Banknote,
  CheckCircle2,
  Clock,
  Globe,
  Loader2,
  MessageCircle,
  Search,
  Shield,
  Sparkles,
  Star,
  Wallet,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { track } from "@/lib/analytics/events";
import {
  formatInrWhole,
  LIVE_CHAT_ASTROLOGERS,
  LIVE_CHAT_CATEGORIES,
  type LiveChatAstrologer,
  type LiveChatCategory,
} from "@/lib/data/live-chat-astrologers";

function sortAstrologers(list: LiveChatAstrologer[]): LiveChatAstrologer[] {
  return [...list].sort((a, b) => {
    if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
    if (b.rating !== a.rating) return b.rating - a.rating;
    return a.chatRateInrPerMin - b.chatRateInrPerMin;
  });
}

export function AstrologersDirectory() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<LiveChatCategory>("All");
  const [startingId, setStartingId] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);

  useEffect(() => {
    track.astrologersDirectoryViewed();
  }, []);

  async function startChat(a: LiveChatAstrologer) {
    setChatError(null);
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
    <div className="overflow-x-hidden bg-background text-foreground">
      <style>{`
        @keyframes vg-ast-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes vg-ast-orb {
          0%, 100% { opacity: 0.12; transform: scale(1); }
          50%       { opacity: 0.22; transform: scale(1.06); }
        }
        .vg-ast-gold-text {
          background: linear-gradient(90deg, #b45309 0%, #d97706 35%, #f59e0b 55%, #b45309 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: vg-ast-shimmer 3s linear infinite;
        }
        .vg-ast-orb { animation: vg-ast-orb 7s ease-in-out infinite; }
      `}</style>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[oklch(0.11_0.04_50)] via-[oklch(0.16_0.06_52)] to-[oklch(0.22_0.07_55)] text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, oklch(0.85 0.12 85) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="vg-ast-orb pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-gold/15 blur-3xl" />
        <div className="vg-ast-orb pointer-events-none absolute bottom-0 left-[-16%] h-72 w-72 rounded-full bg-brand/20 blur-3xl [animation-delay:-3.5s]" />

        <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-12 md:pb-16 md:pt-16">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-light/80">
            <Sparkles className="size-3.5 text-gold-light/70" aria-hidden />
            <span>Live guidance</span>
            <span className="text-white/25">·</span>
            <span>Pay per minute</span>
          </div>

          <h1 className="mt-4 max-w-3xl font-heading text-4xl font-semibold leading-[1.08] tracking-tight md:text-5xl lg:text-[3.25rem]">
            Choose your{" "}
            <span className="vg-ast-gold-text">astrologer</span>
            <span className="text-white"> — chat on your terms</span>
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/75 md:text-lg">
            Browse verified readers, see transparent per-minute rates, and pick
            who fits your question — love, career, wealth, vastu, or full chart
            depth. Wallet-based billing is rolling out next; your first stop is
            picking the right guide.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#directory"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-gold px-5 text-sm font-semibold text-stone-950 shadow-lg shadow-black/25 transition hover:bg-gold-light"
            >
              View astrologers
            </a>
            <Link
              href="/consultation"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-white/25 bg-white/5 px-5 text-sm font-semibold text-white backdrop-blur transition hover:border-white/40 hover:bg-white/10"
            >
              Book full session
            </Link>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {[
              {
                icon: Shield,
                title: "Private & confidential",
                desc: "One-to-one chat — no public feeds.",
              },
              {
                icon: Banknote,
                title: "Clear per-minute pricing",
                desc: "Rates shown upfront before you connect.",
              },
              {
                icon: Globe,
                title: "Hindi & English friendly",
                desc: "Many readers offer regional languages too.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold-light">
                  <item.icon className="size-5" aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-0.5 text-xs leading-snug text-white/60">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Wallet teaser — forward-looking, no backend */}
      <section className="border-b border-border/60 bg-gradient-to-r from-brand-light/40 via-surface to-gold-light/30">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 md:flex-row md:items-center md:justify-between md:py-7">
          <div className="flex gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand">
              <Wallet className="size-5" aria-hidden />
            </div>
            <div>
              <p className="font-heading text-lg font-semibold text-foreground md:text-xl">
                VedGuide wallet{" "}
                <span className="text-muted-foreground font-sans text-sm font-normal">
                  (coming soon)
                </span>
              </p>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                Add balance once, chat with any astrologer, and pay only for the
                minutes you use — with session receipts and spend caps.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 md:justify-end">
            <Badge variant="secondary" className="rounded-lg px-2.5 py-1">
              <Clock className="size-3 opacity-70" />
              Minute tracking
            </Badge>
            <Badge variant="secondary" className="rounded-lg px-2.5 py-1">
              <CheckCircle2 className="size-3 opacity-70" />
              Verified readers
            </Badge>
          </div>
        </div>
      </section>

      {/* Directory */}
      <section
        id="directory"
        className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12 md:py-16"
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
              Who do you want to talk to?
            </h2>
            <p className="mt-2 max-w-xl text-muted-foreground">
              Filter by topic, compare per-minute rates, and start when you are
              ready. Online status updates in real time once live chat is enabled.
            </p>
          </div>
          <p className="text-xs font-medium text-muted-foreground md:text-right">
            {filtered.length} astrologer{filtered.length === 1 ? "" : "s"} shown
          </p>
        </div>

        {chatError && (
          <div
            role="alert"
            className="mt-6 flex gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-foreground"
          >
            <p className="min-w-0 flex-1 leading-relaxed">{chatError}</p>
            <button
              type="button"
              className="shrink-0 rounded-lg p-1 text-muted-foreground hover:bg-amber-500/20 hover:text-foreground"
              aria-label="Dismiss"
              onClick={() => setChatError(null)}
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search name, topic, or language…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm outline-none ring-brand/20 transition placeholder:text-muted-foreground focus:border-brand/40 focus:ring-2"
              aria-label="Search astrologers"
            />
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {LIVE_CHAT_CATEGORIES.map((cat) => {
            const active = category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={
                  active
                    ? "shrink-0 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white shadow-sm"
                    : "shrink-0 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-muted-foreground transition hover:border-brand/30 hover:text-foreground"
                }
              >
                {cat}
              </button>
            );
          })}
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((a) => (
            <Card
              key={a.id}
              className="border-border/80 bg-card/80 shadow-sm ring-1 ring-black/[0.03] transition hover:shadow-md hover:ring-brand/15"
            >
              <CardHeader className="flex flex-row items-start gap-4 pb-2">
                <div className="relative shrink-0">
                  {a.imageSrc ? (
                    <div className="relative size-[4.5rem] overflow-hidden rounded-2xl bg-muted ring-2 ring-gold/25">
                      <Image
                        src={a.imageSrc}
                        alt=""
                        width={144}
                        height={144}
                        className="size-full object-cover object-top"
                      />
                    </div>
                  ) : (
                    <div
                      className={`flex size-[4.5rem] items-center justify-center rounded-2xl bg-gradient-to-br ${a.avatarGradient} text-lg font-semibold text-white shadow-inner ring-2 ring-white/20`}
                    >
                      {a.initials}
                    </div>
                  )}
                  <span
                    className={
                      a.isOnline
                        ? "absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full border-2 border-card bg-emerald-500"
                        : "absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full border-2 border-card bg-muted-foreground/50"
                    }
                    title={a.isOnline ? "Online" : "Offline"}
                    aria-label={a.isOnline ? "Online" : "Offline"}
                  />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-heading text-lg font-semibold leading-tight">
                      {a.name}
                    </h3>
                    {a.isOnline ? (
                      <Badge className="h-5 rounded-md bg-emerald-600/15 px-1.5 text-[10px] font-semibold text-emerald-800 dark:text-emerald-200">
                        Online
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="h-5 rounded-md px-1.5 text-[10px]">
                        Busy
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">
                    {a.title}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <div className="flex items-center gap-0.5 text-amber-700 dark:text-amber-400">
                      <Star className="size-3.5 fill-current" aria-hidden />
                      <span className="text-xs font-semibold tabular-nums">
                        {a.rating.toFixed(1)}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      ({a.reviewCount.toLocaleString("en-IN")} reviews)
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      · {a.experienceYears}+ yrs
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 px-4 pt-0">
                <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                  {a.shortBio}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {a.specialties.slice(0, 3).map((s) => (
                    <span
                      key={s}
                      className="rounded-md bg-brand-light/50 px-2 py-0.5 text-[11px] font-medium text-brand dark:bg-brand/20 dark:text-gold-light"
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  <span className="font-medium text-foreground">Languages:</span>{" "}
                  {a.languages.join(", ")}
                </p>
              </CardContent>
              <CardFooter className="flex flex-col gap-3 border-t border-border/60 bg-surface-warm/50 px-4 pt-4">
                <div className="flex w-full items-end justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Chat rate
                    </p>
                    <p className="font-heading text-2xl font-semibold tabular-nums text-foreground">
                      {formatInrWhole(a.chatRateInrPerMin)}
                      <span className="font-sans text-sm font-medium text-muted-foreground">
                        /min
                      </span>
                    </p>
                  </div>
                  <Button
                    size="lg"
                    className="rounded-xl bg-brand px-4 font-semibold shadow-sm hover:bg-brand-hover"
                    disabled={startingId !== null}
                    onClick={() => void startChat(a)}
                  >
                    {startingId === a.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <MessageCircle className="size-4" />
                    )}
                    Start chat
                  </Button>
                </div>
                <p className="text-center text-[10px] text-muted-foreground">
                  Per-minute billing uses your wallet after you add a test balance.
                </p>
              </CardFooter>
            </Card>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="mt-16 rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-14 text-center">
            <p className="font-medium text-foreground">No astrologers match</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try another topic or clear your search.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setQuery("");
                setCategory("All");
              }}
            >
              Reset filters
            </Button>
          </div>
        )}

        <div className="mt-14 rounded-2xl border border-border bg-card p-6 md:p-8">
          <h3 className="font-heading text-xl font-semibold md:text-2xl">
            Prefer a full deep-dive instead?
          </h3>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Fixed 15 or 45 minute consultations include focused chart work and
            follow-up structure — ideal for big life decisions.
          </p>
          <Link href="/consultation" className="mt-4 inline-block">
            <Button size="lg" variant="outline" className="rounded-xl">
              Explore consultation packages
            </Button>
          </Link>
        </div>
      </section>

    </div>
  );
}
