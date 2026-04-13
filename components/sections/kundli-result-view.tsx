"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  CheckCircle2,
  Star,
  Bot,
  UserCheck,
  ChevronRight,
  Calendar,
  MapPin,
  Clock,
  Lock,
  Zap,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics/events";
import type { KundliResult } from "@/lib/kundli/calculate";

export type KundliResultPageVariant = "a" | "b";
import { getKundliInsights, type InsightBlock } from "@/lib/kundli/insights";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StoredKundliData {
  submissionId: string;
  result: KundliResult;
  name: string;
  gender?: string;
  dob: string;
  tob: string;
  pob: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDOB(dob: string): string {
  try {
    const [y, m, d] = dob.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
      day: "numeric", month: "long", year: "numeric",
    });
  } catch { return dob; }
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

// ─── Insight swipe cards (visual-first, same copy, tighter) ───────────────────

function InsightSwipeCards({ blocks }: { blocks: InsightBlock[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const cardW = el.scrollWidth / blocks.length;
    setActiveIdx(Math.min(blocks.length - 1, Math.round(el.scrollLeft / cardW)));
  }, [blocks.length]);

  return (
    <div>
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {blocks.map((block) => (
          <article
            key={block.title}
            className="snap-center relative flex w-[82vw] max-w-[300px] shrink-0 flex-col overflow-hidden rounded-3xl border border-border/40 bg-card shadow-[0_20px_50px_-24px_rgba(28,10,0,0.25)]"
          >
            <div
              className={cn(
                "relative flex flex-col items-center gap-3 px-5 pb-5 pt-8",
                "bg-gradient-to-b",
                block.headerGradient
              )}
            >
              <div
                className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-white/25 blur-2xl"
                aria-hidden
              />
              <div
                className={cn(
                  "relative flex size-16 items-center justify-center rounded-2xl shadow-md ring-4 ring-white/40",
                  block.iconBg
                )}
              >
                <span className="text-3xl leading-none" aria-hidden>
                  {block.icon}
                </span>
              </div>
              <p className={cn("font-heading text-xs font-bold uppercase tracking-[0.2em]", block.titleColor)}>
                {block.title}
              </p>
            </div>

            <div className="flex flex-1 flex-col gap-4 px-5 pb-5 pt-4">
              <p className="font-heading text-center text-[17px] font-bold leading-snug text-foreground">
                {block.shortLine}
              </p>

              <div className="grid gap-2">
                <div className="flex gap-2.5 rounded-2xl bg-muted/35 px-3 py-2.5">
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-background text-sm shadow-sm" aria-hidden>
                    👁
                  </span>
                  <p className="text-[12px] leading-snug text-muted-foreground line-clamp-3">{block.line1}</p>
                </div>
                <div className="flex gap-2.5 rounded-2xl border border-border/50 bg-background/80 px-3 py-2.5">
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm" aria-hidden>
                    ⚡
                  </span>
                  <p className="text-[12px] leading-snug text-foreground/85 line-clamp-2">{block.line2}</p>
                </div>
              </div>

              <p
                className={cn(
                  "mt-auto flex items-center gap-2 rounded-xl border px-3 py-2 text-[11px] font-medium leading-snug text-muted-foreground",
                  block.accentColor,
                  "border-l-[3px] bg-muted/20"
                )}
              >
                <Lock className="size-3.5 shrink-0 opacity-60" aria-hidden />
                <span>{block.line3}</span>
              </p>
            </div>
          </article>
        ))}
        <div className="w-2 shrink-0" aria-hidden />
      </div>

      <div className="mt-3 flex items-center justify-center gap-1.5">
        {blocks.map((b, i) => (
          <button
            key={b.title}
            type="button"
            aria-label={b.title}
            onClick={() => {
              const el = scrollRef.current;
              if (!el) return;
              const cardW = el.scrollWidth / blocks.length;
              el.scrollTo({ left: cardW * i, behavior: "smooth" });
            }}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              activeIdx === i ? "w-6 bg-brand" : "w-1.5 bg-border"
            )}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Pattern section — simple scary copy (no jargon UI) ───────────────────────

function PatternSection({ careerShort, relShort }: { careerShort: string; relShort: string }) {
  return (
    <>
      <style>{`
        @keyframes vg-zoom-pulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.025); }
        }
        .vg-pattern-ring { animation: vg-zoom-pulse 2.6s ease-in-out infinite; }
      `}</style>

      <div className="vg-pattern-ring relative overflow-hidden rounded-3xl border border-red-500/35 bg-gradient-to-b from-white to-red-50/40 shadow-lg">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(239,68,68,0.12),transparent)]" aria-hidden />

        <div className="relative flex items-center gap-2 border-b border-red-100/80 bg-red-600 px-4 py-3">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
          </span>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white">
            Important — zaroor padhein
          </p>
          <Zap className="ml-auto size-4 text-amber-200" aria-hidden />
        </div>

        <div className="relative space-y-4 px-4 py-5">
          <h2 className="font-heading text-center text-xl font-extrabold leading-snug text-zinc-900">
            Yeh sirf basic kundli report hai
          </h2>

          <ul className="space-y-3 text-[14px] leading-snug text-zinc-800">
            <li className="flex gap-2.5">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-red-500" aria-hidden />
              <span>
                Zindagi mein jo rukawat, gussa, ya confusion chal raha hai — uska{" "}
                <span className="font-semibold text-zinc-950">asli reason chhupa hua</span> hai. Free
                report usko poora nahi khulti.
              </span>
            </li>
            <li className="flex gap-2.5">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-red-500" aria-hidden />
              <span>
                Isko <span className="font-semibold text-zinc-950">ignore</span> karoge toh wahi scene
                baar baar repeat hoga — naye log, nayi jagah, same takleef.
              </span>
            </li>
          </ul>

          <div className="rounded-2xl border border-red-200/90 bg-white px-4 py-3.5 shadow-sm">
            <p className="text-center text-[13px] font-semibold leading-snug text-zinc-900">
              Career side: <span className="font-bold text-red-800">{careerShort}</span>
            </p>
            <p className="mt-1.5 text-center text-[13px] font-semibold leading-snug text-zinc-900">
              Rishta side: <span className="font-bold text-red-800">{relShort}</span>
            </p>
            <p className="mt-3 text-center text-[12px] leading-relaxed text-zinc-600">
              Dono ka connection chart ke andar hai. Poori picture sirf detailed kundli mein clear hoti
              hai.
            </p>
          </div>
        </div>

        <div className="relative border-t border-red-100/80 bg-red-50/50 px-4 pb-4 pt-3">
          <button
            id="free-kundli-result-pattern-cta"
            type="button"
            onClick={() => {
              track.paidReportCtaClicked("free_kundli_result", "pattern_section");
              document.getElementById("kundli-cta")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-red-700 active:scale-[0.98]"
          >
            Mujhe poori samajh chahiye
            <ChevronRight className="size-4 shrink-0" strokeWidth={2.5} />
          </button>
          <p className="mt-2 text-center text-[11px] text-zinc-500">₹399 · ek baar · 24-48 ghante</p>
        </div>
      </div>
    </>
  );
}

// ─── Depth gap card — typewriter loop ────────────────────────────────────────

const DEPTH_ITEMS = [
  "Mehnat karte ho par aage badhne ka feel nahi aata",
  "Decision lena chaho — dil ghbra jata hai ya delay ho jata hai",
  "Ek hi story naye logon ke saath baar baar repeat hoti hai",
] as const;

const TYPE_SPEED = 38;   // ms per character
const ERASE_SPEED = 18;  // ms per character
const PAUSE_AFTER = 1800; // ms to hold full string
const PAUSE_BEFORE = 400; // ms gap before next item

function DepthGapCard() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [phase, setPhase] = useState<"typing" | "holding" | "erasing">("typing");
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const full = DEPTH_ITEMS[activeIdx];

    if (phase === "typing") {
      if (displayed.length < full.length) {
        timeout.current = setTimeout(() => {
          setDisplayed(full.slice(0, displayed.length + 1));
        }, TYPE_SPEED);
      } else {
        timeout.current = setTimeout(() => setPhase("holding"), PAUSE_AFTER);
      }
    } else if (phase === "holding") {
      timeout.current = setTimeout(() => setPhase("erasing"), 0);
    } else {
      if (displayed.length > 0) {
        timeout.current = setTimeout(() => {
          setDisplayed(displayed.slice(0, -1));
        }, ERASE_SPEED);
      } else {
        timeout.current = setTimeout(() => {
          setActiveIdx((i) => (i + 1) % DEPTH_ITEMS.length);
          setPhase("typing");
        }, PAUSE_BEFORE);
      }
    }

    return () => { if (timeout.current) clearTimeout(timeout.current); };
  }, [displayed, phase, activeIdx]);

  return (
    <div className="overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-card via-card to-brand-light/25 shadow-md">
        <div className="border-b border-border/40 bg-muted/25 px-4 py-3.5">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/12 text-lg shadow-sm" aria-hidden>
            🪞
          </div>
          <div className="min-w-0">
          <p className="font-heading text-[1.1rem] font-extrabold leading-tight text-foreground">
            Kya aapke saath yeh hota hai?
          </p>
          <p className="mt-1 text-[12px] leading-snug text-muted-foreground">
            In mein se kuch <span className="font-semibold text-foreground">apni life</span>{" "}
            jaisa lagta hai?
          </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        <ul className="space-y-3">
          {DEPTH_ITEMS.map((item, i) => {
            const isDone = i < activeIdx || (i === activeIdx && phase === "holding");
            const isActive = i === activeIdx;
            return (
              <li
                key={item}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border px-3 py-2.5 transition-colors",
                  isActive ? "border-brand/35 bg-brand/5" : "border-transparent bg-muted/20"
                )}
              >
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-colors duration-300",
                    isDone
                      ? "border-brand/50 bg-brand text-white"
                      : isActive
                        ? "border-brand/40 bg-brand/15 text-brand"
                        : "border-border/50 bg-background text-muted-foreground"
                  )}
                >
                  {isDone ? "✓" : "?"}
                </span>
                <span
                  className={cn(
                    "min-w-0 flex-1 text-[14px] font-medium leading-snug transition-colors duration-300",
                    isDone || isActive ? "text-foreground" : "text-muted-foreground/40"
                  )}
                >
                  {isActive ? (
                    <>
                      {displayed}
                      <span className="ml-px inline-block h-[1em] w-0.5 animate-pulse bg-brand align-middle" />
                    </>
                  ) : (
                    item
                  )}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-dashed border-brand/30 bg-background/90 px-3 py-3">
          <TrendingUp className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
          <p className="text-[12px] leading-snug text-muted-foreground">
            <span className="font-semibold text-foreground">Yeh sab seedha aapki kundli se juda hai.</span>{" "}
            Free wali report mein yeh depth dikh hi nahi paati — isliye problem samajh mein nahi aati.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Benefits section ─────────────────────────────────────────────────────────

// Custom SVG icon tiles for benefits
function BenefitIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    career: (
      <svg viewBox="0 0 40 40" fill="none" className="size-full" aria-hidden>
        <circle cx="20" cy="20" r="18" fill="url(#bg-career)" />
        <path d="M12 28V18l8-6 8 6v10H24v-7h-8v7z" fill="white" fillOpacity=".95" />
        <rect x="18" y="21" width="4" height="7" rx="1" fill="#B45309" />
        <defs>
          <radialGradient id="bg-career" cx="35%" cy="30%">
            <stop stopColor="#FDE68A" />
            <stop offset="1" stopColor="#D97706" />
          </radialGradient>
        </defs>
      </svg>
    ),
    rishta: (
      <svg viewBox="0 0 40 40" fill="none" className="size-full" aria-hidden>
        <circle cx="20" cy="20" r="18" fill="url(#bg-rishta)" />
        <path d="M20 28s-9-5.5-9-11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5.5-9 11-9 11z" fill="white" fillOpacity=".95" />
        <defs>
          <radialGradient id="bg-rishta" cx="35%" cy="30%">
            <stop stopColor="#FBCFE8" />
            <stop offset="1" stopColor="#DB2777" />
          </radialGradient>
        </defs>
      </svg>
    ),
    money: (
      <svg viewBox="0 0 40 40" fill="none" className="size-full" aria-hidden>
        <circle cx="20" cy="20" r="18" fill="url(#bg-money)" />
        <circle cx="20" cy="20" r="9" stroke="white" strokeWidth="2" fillOpacity="0" />
        <text x="20" y="25" textAnchor="middle" fontSize="11" fontWeight="800" fill="white">₹</text>
        <defs>
          <radialGradient id="bg-money" cx="35%" cy="30%">
            <stop stopColor="#A7F3D0" />
            <stop offset="1" stopColor="#059669" />
          </radialGradient>
        </defs>
      </svg>
    ),
    dosha: (
      <svg viewBox="0 0 40 40" fill="none" className="size-full" aria-hidden>
        <circle cx="20" cy="20" r="18" fill="url(#bg-dosha)" />
        <path d="M20 10 L22 17 L29 17 L23.5 21.5 L25.5 28.5 L20 24 L14.5 28.5 L16.5 21.5 L11 17 L18 17 Z" fill="white" fillOpacity=".95" />
        <defs>
          <radialGradient id="bg-dosha" cx="35%" cy="30%">
            <stop stopColor="#DDD6FE" />
            <stop offset="1" stopColor="#7C3AED" />
          </radialGradient>
        </defs>
      </svg>
    ),
    dasha: (
      <svg viewBox="0 0 40 40" fill="none" className="size-full" aria-hidden>
        <circle cx="20" cy="20" r="18" fill="url(#bg-dasha)" />
        <circle cx="20" cy="20" r="7" stroke="white" strokeWidth="2" fillOpacity="0" />
        <line x1="20" y1="13" x2="20" y2="10" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <line x1="20" y1="27" x2="20" y2="30" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <line x1="13" y1="20" x2="10" y2="20" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <line x1="27" y1="20" x2="30" y2="20" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <path d="M20 16v4l3 2" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <defs>
          <radialGradient id="bg-dasha" cx="35%" cy="30%">
            <stop stopColor="#BAE6FD" />
            <stop offset="1" stopColor="#0284C7" />
          </radialGradient>
        </defs>
      </svg>
    ),
    personal: (
      <svg viewBox="0 0 40 40" fill="none" className="size-full" aria-hidden>
        <circle cx="20" cy="20" r="18" fill="url(#bg-personal)" />
        <rect x="13" y="12" width="14" height="17" rx="2" stroke="white" strokeWidth="2" fillOpacity="0" />
        <line x1="16" y1="17" x2="24" y2="17" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="16" y1="21" x2="24" y2="21" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="16" y1="25" x2="20" y2="25" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="27" cy="27" r="5" fill="url(#bg-personal)" stroke="white" strokeWidth="1.5" />
        <path d="M25 27l1.5 1.5 2.5-2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <defs>
          <radialGradient id="bg-personal" cx="35%" cy="30%">
            <stop stopColor="#FED7AA" />
            <stop offset="1" stopColor="#B45309" />
          </radialGradient>
        </defs>
      </svg>
    ),
  };
  return <>{icons[type]}</>;
}

const BENEFITS: { type: string; title: string; sub: string; bgFrom: string; bgTo: string }[] = [
  { type: "career",   title: "Career direction",   sub: "Kaunsa kaam, kab aage badhna",  bgFrom: "from-amber-50",   bgTo: "to-amber-100/60" },
  { type: "rishta",   title: "Rishton ka pattern", sub: "Baar baar wahi kyun hota hai",  bgFrom: "from-rose-50",    bgTo: "to-rose-100/60"  },
  { type: "money",    title: "Paisa aur block",    sub: "Flow kab aur rukawat kahan",    bgFrom: "from-emerald-50", bgTo: "to-emerald-100/60" },
  { type: "dosha",    title: "Dosha / Yog",        sub: "Asli impact aur upay",          bgFrom: "from-violet-50",  bgTo: "to-violet-100/60" },
  { type: "dasha",    title: "Dasha roadmap",      sub: "Agle kuch saal ka clear view",  bgFrom: "from-sky-50",     bgTo: "to-sky-100/60"   },
  { type: "personal", title: "Sirf aapke liye",    sub: "Date · time · jagah se bani",   bgFrom: "from-orange-50",  bgTo: "to-orange-100/60" },
];

function BenefitsSection() {
  return (
    <div className="overflow-hidden rounded-3xl border border-brand/20 bg-card shadow-md">
      <div className="relative border-b border-border/40 bg-gradient-to-r from-gold-light/70 via-brand-light/35 to-gold-light/50 px-4 py-4">
        <div className="pointer-events-none absolute -right-6 top-0 size-24 rounded-full bg-brand/10 blur-2xl" aria-hidden />
        <h3 className="font-heading relative text-[1.35rem] font-extrabold leading-tight text-foreground sm:text-2xl">
          Aaj apni personalized kundli banwayein
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-2.5 p-3 sm:gap-3 sm:p-4">
        {BENEFITS.map(({ type, title, sub, bgFrom, bgTo }) => (
          <div
            key={type}
            className={cn(
              "group flex flex-col items-center gap-2.5 rounded-2xl border border-white/70 bg-gradient-to-b px-3 py-4 text-center shadow-md ring-1 ring-black/[0.04] transition-transform duration-200 hover:-translate-y-0.5",
              bgFrom, bgTo
            )}
          >
            <div className="size-13 drop-shadow-sm">
              <BenefitIcon type={type} />
            </div>
            <div>
              <p className="font-heading text-[17px] font-black leading-tight tracking-[-0.01em] text-foreground">{title}</p>
              <p className="mt-1 text-[11px] font-medium leading-snug text-muted-foreground">{sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Rotating chakra (decorative, behind upsell book) ────────────────────────

function UpsellChakraBackdrop({ className }: { className?: string }) {
  const spokes = 16;
  return (
    <svg
      className={cn("pointer-events-none text-brand/60", className)}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* outer ring */}
      <circle cx="100" cy="100" r="94" stroke="currentColor" strokeWidth="2" opacity="0.55" />
      {/* petal ring */}
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i * Math.PI * 2) / 16 - Math.PI / 2;
        const cx2 = 100 + Math.cos(a) * 86;
        const cy2 = 100 + Math.sin(a) * 86;
        return <circle key={`p${i}`} cx={cx2} cy={cy2} r="5" stroke="currentColor" strokeWidth="1.2" opacity="0.45" fill="none" />;
      })}
      {/* mid dashed ring */}
      <circle cx="100" cy="100" r="70" stroke="currentColor" strokeWidth="1.4" opacity="0.42" strokeDasharray="5 5" />
      {/* inner ring */}
      <circle cx="100" cy="100" r="48" stroke="currentColor" strokeWidth="1.2" opacity="0.38" />
      {/* spokes */}
      {Array.from({ length: spokes }, (_, i) => {
        const a = (i * Math.PI * 2) / spokes - Math.PI / 2;
        const x2 = 100 + Math.cos(a) * 90;
        const y2 = 100 + Math.sin(a) * 90;
        return (
          <line
            key={`s${i}`}
            x1="100" y1="100"
            x2={x2} y2={y2}
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.30"
          />
        );
      })}
      {/* spoke-tip diamonds */}
      {Array.from({ length: spokes }, (_, i) => {
        const a = (i * Math.PI * 2) / spokes - Math.PI / 2 + Math.PI / spokes;
        const cx2 = 100 + Math.cos(a) * 76;
        const cy2 = 100 + Math.sin(a) * 76;
        return <circle key={`d${i}`} cx={cx2} cy={cy2} r="3.5" fill="currentColor" opacity="0.30" />;
      })}
      {/* hub glow */}
      <circle cx="100" cy="100" r="14" stroke="currentColor" strokeWidth="2" opacity="0.55" fill="#FEF3C7" fillOpacity="0.55" />
      <circle cx="100" cy="100" r="6" fill="currentColor" opacity="0.55" />
    </svg>
  );
}

// ─── CTA section ─────────────────────────────────────────────────────────────

function PerkSvg({ type }: { type: string }) {
  if (type === "compass")
    return (
      <svg viewBox="0 0 32 32" fill="none" className="size-full" aria-hidden>
        <circle cx="16" cy="16" r="14" fill="url(#pk-compass)" />
        <circle cx="16" cy="16" r="9" stroke="white" strokeWidth="1.8" fillOpacity="0" />
        <polygon points="16,8 17.5,14 16,13 14.5,14" fill="white" fillOpacity=".95" />
        <polygon points="16,24 17.5,18 16,19 14.5,18" fill="white" fillOpacity=".5" />
        <defs><linearGradient id="pk-compass" x1="0" y1="0" x2="32" y2="32"><stop stopColor="#FDE68A"/><stop offset="1" stopColor="#B45309"/></linearGradient></defs>
      </svg>
    );
  if (type === "clock")
    return (
      <svg viewBox="0 0 32 32" fill="none" className="size-full" aria-hidden>
        <circle cx="16" cy="16" r="14" fill="url(#pk-clock)" />
        <circle cx="16" cy="16" r="8" stroke="white" strokeWidth="1.8" fillOpacity="0" />
        <path d="M16 10v6l4 2.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <defs><linearGradient id="pk-clock" x1="0" y1="0" x2="32" y2="32"><stop stopColor="#BAE6FD"/><stop offset="1" stopColor="#0369A1"/></linearGradient></defs>
      </svg>
    );
  if (type === "arrow")
    return (
      <svg viewBox="0 0 32 32" fill="none" className="size-full" aria-hidden>
        <circle cx="16" cy="16" r="14" fill="url(#pk-arrow)" />
        <path d="M10 16h12M18 12l4 4-4 4" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <defs><linearGradient id="pk-arrow" x1="0" y1="0" x2="32" y2="32"><stop stopColor="#A7F3D0"/><stop offset="1" stopColor="#059669"/></linearGradient></defs>
      </svg>
    );
  // shield
  return (
    <svg viewBox="0 0 32 32" fill="none" className="size-full" aria-hidden>
      <circle cx="16" cy="16" r="14" fill="url(#pk-shield)" />
      <path d="M16 8l7 3v5c0 4-3.5 7-7 8-3.5-1-7-4-7-8v-5z" stroke="white" strokeWidth="1.8" fillOpacity="0" />
      <path d="M13 16l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <defs><linearGradient id="pk-shield" x1="0" y1="0" x2="32" y2="32"><stop stopColor="#DDD6FE"/><stop offset="1" stopColor="#7C3AED"/></linearGradient></defs>
    </svg>
  );
}

function CtaSection({ fn }: { fn: string }) {
  const perks = [
    { type: "compass", label: "Poori picture", sub: "clearly samajh" },
    { type: "clock",   label: "Kab kya hoga",  sub: "exact timing" },
    { type: "arrow",   label: "Sahi direction", sub: "clearly dikhega" },
    { type: "shield",  label: "Dosha ka upay",  sub: "tested remedy" },
  ];

  return (
    <div
      id="kundli-cta"
      className="relative overflow-hidden rounded-3xl border-2 border-brand/35 bg-gradient-to-br from-gold-light via-brand-light/50 to-gold-light shadow-[0_24px_60px_-28px_rgba(180,83,9,0.35)]"
    >
      <div className="pointer-events-none absolute -left-10 top-1/2 size-40 -translate-y-1/2 rounded-full bg-brand/10 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-gold/15 blur-2xl" aria-hidden />

      <div className="relative border-b border-brand/15 bg-brand/10 px-5 py-2.5 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand">Next step</p>
        <p className="font-heading text-sm font-extrabold text-foreground">Ek hi report, poori clarity</p>
      </div>

      <div className="relative flex flex-col gap-5 px-5 pb-5 pt-5 sm:flex-row sm:items-center">
        <div className="relative mx-auto flex size-[13rem] shrink-0 items-center justify-center sm:mx-0 sm:size-[14.5rem]">
          <style>{`
            @keyframes vg-chakra-rotate {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            .vg-upsell-chakra {
              animation: vg-chakra-rotate 36s linear infinite;
            }
          `}</style>
          <UpsellChakraBackdrop className="vg-upsell-chakra absolute size-[138%] max-w-none sm:size-[132%]" />
          <div className="relative z-[1] flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://primedit-cdn.b-cdn.net/shubhmay-lp-kundli/premium_kundli.png"
              alt="Premium Personalized Kundli"
              width={160}
              height={192}
              className="h-[185px] w-auto max-h-[min(185px,46vw)] drop-shadow-2xl sm:h-[210px] sm:max-h-[210px]"
            />
          </div>
        </div>

        <div className="min-w-0 flex-1 text-center sm:text-left">
          <h2 className="font-heading text-xl font-extrabold leading-tight text-foreground sm:text-2xl">
            Personalized Kundli Report
          </h2>
          <p className="mt-2 text-[14px] font-bold leading-snug text-foreground/90">
            Aaj hi apni detailed kundli report banwaye
          </p>
          <p className="mt-1.5 text-[13px] font-semibold text-muted-foreground">
            Sirf <span className="font-bold text-foreground">{fn}</span> ke liye, personal analysis
          </p>
          <p className="mt-2 inline-flex flex-wrap items-center justify-center gap-1.5 rounded-full border border-brand/25 bg-brand/5 px-3 py-1 text-[11px] font-bold text-brand sm:justify-start">
            <span>40–45 page</span>
            <span className="text-brand/40">·</span>
            <span>detailed PDF</span>
            <span className="text-brand/40">·</span>
            <span>WhatsApp + Email</span>
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <span className="text-3xl font-extrabold tracking-tight text-foreground">₹399</span>
            <span className="text-sm text-muted-foreground line-through">₹999</span>
            <span className="rounded-full bg-brand px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
              60% OFF
            </span>
          </div>
        </div>
      </div>

      <div className="relative px-5 pb-5">
        <div className="mb-4 grid grid-cols-2 gap-2.5">
          {perks.map(({ type, label, sub }) => (
            <div
              key={type}
              className="relative flex items-center gap-2.5 overflow-hidden rounded-2xl border border-white/70 bg-white/85 px-3 py-3 shadow-[0_4px_18px_-8px_rgba(180,83,9,0.20)] backdrop-blur-sm"
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-gold-light/40 to-brand-light/15" aria-hidden />
              <div className="relative size-10 shrink-0">
                <PerkSvg type={type} />
              </div>
              <div className="relative min-w-0">
                <p className="font-heading text-[13px] font-extrabold leading-tight text-foreground">{label}</p>
                <p className="text-[10px] font-semibold leading-none text-muted-foreground mt-0.5">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        <>
          <style>{`
            @keyframes vg-cta-shimmer {
              0%   { transform: translateX(-140%) skewX(-18deg); }
              100% { transform: translateX(260%) skewX(-18deg); }
            }
            .vg-cta-btn::after {
              content: '';
              position: absolute;
              inset: 0;
              background: linear-gradient(90deg, transparent 20%, rgba(255,255,255,0.28) 50%, transparent 80%);
              animation: vg-cta-shimmer 2.2s ease-in-out infinite;
              pointer-events: none;
              border-radius: inherit;
            }
          `}</style>
            <Link
              id="free-kundli-result-main-cta"
              href="/checkout/kundli"
              onClick={() => track.paidReportCtaClicked("free_kundli_result", "main_cta")}
              className="vg-cta-btn relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-brand px-6 py-4 text-[15px] font-extrabold text-white shadow-lg transition-all hover:bg-brand-hover active:scale-[0.98]"
          >
            Mujhe sab clear samajhna hai
            <ChevronRight className="size-4 shrink-0" strokeWidth={2.5} />
          </Link>
        </>

        <div className="mt-4 grid grid-cols-3 gap-0 overflow-hidden rounded-2xl border border-brand/20 bg-gradient-to-b from-background/90 to-brand-light/20">
          {[
            { label: "24-48 ghante", sub: "Report mil jayegi" },
            { label: "Sirf aapke", sub: "liye likhi" },
            { label: "100%", sub: "private safe" },
          ].map(({ label, sub }, i) => (
            <div
              key={sub}
              className={cn(
                "flex flex-col items-center justify-center px-2 py-3 text-center",
                i > 0 && "border-l border-brand/15"
              )}
            >
              <span className="text-xs font-black text-brand">✓</span>
              <span className="font-heading text-[13px] font-extrabold leading-tight text-foreground">{label}</span>
              <span className="mt-0.5 text-[10px] font-bold leading-tight text-muted-foreground">{sub}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

const REVIEWS = [
  {
    initial: "V",
    name: "Vikram T.",
    city: "Jaipur",
    tag: "Career",
    headline: "Job chodi — ab 5x kama raha hu",
    text: "Govt job thi, kuch galat lag raha tha. Report padha — sab clear hua. 6 mahine mein business shuru kiya. Aaj job se 5 guna kama raha hu.",
  },
  {
    initial: "A",
    name: "Ankit M.",
    city: "Lucknow",
    tag: "Relationship",
    headline: "Roz ladaai hoti thi — ab sab theek hai",
    text: "Wife se roz chhoti baat pe argue hota tha. Report mein exactly wahi problem thi. Solution seriously liya — 4 mahine mein sab change ho gaya.",
  },
];

function Testimonials() {
  return (
    <div className="space-y-4">
      {REVIEWS.map(({ initial, name, city, tag, headline, text }) => (
        <figure
          key={name}
          className="relative overflow-hidden rounded-3xl border border-border/45 bg-gradient-to-br from-card to-muted/30 p-4 shadow-md"
        >
          <div className="pointer-events-none absolute -right-2 -top-4 font-heading text-7xl font-black leading-none text-brand/[0.06]" aria-hidden>
            &ldquo;
          </div>

          <div className="relative flex flex-wrap items-center gap-2">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={12} className="fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="rounded-full border border-brand/25 bg-brand/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-brand">
              {tag}
            </span>
            <span className="ml-auto rounded-full border border-emerald-200/80 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-800">
              Verified
            </span>
          </div>

          <blockquote className="relative mt-3">
            <p className="font-heading text-base font-extrabold leading-snug text-foreground">{headline}</p>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground line-clamp-3">&ldquo;{text}&rdquo;</p>
          </blockquote>

          <figcaption className="mt-4 flex items-center gap-3 border-t border-border/40 pt-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-brand text-sm font-bold text-white shadow-md ring-2 ring-brand/20">
              {initial}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{name}</p>
              <p className="text-[11px] text-muted-foreground">{city}</p>
            </div>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

// ─── Auto vs Manual bridge ────────────────────────────────────────────────────

const COMPARE_ROWS = [
  { label: "Planetary positions",  auto: false, manual: true  },
  { label: "Sahi timing",          auto: false, manual: true  },
  { label: "Sirf aapke liye",      auto: false, manual: true  },
  { label: "Asli reason",          auto: false, manual: true  },
  { label: "Dosha + upay",         auto: false, manual: true  },
];

function AutoManualBridge() {
  return (
    <div className="overflow-hidden rounded-3xl border border-border/50 bg-card shadow-md">
      <div className="border-b border-border/40 bg-muted/20 px-4 py-3.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Compare
        </p>
        <p className="font-heading text-base font-extrabold text-foreground">
          Free report vs Personalized report
        </p>
      </div>

      <div className="px-3 pt-3 pb-1 sm:px-4">
        {/* Header row */}
        <div className="mb-2 grid grid-cols-[1fr_auto_auto] gap-x-3 px-1">
          <span />
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <Bot className="size-3" aria-hidden /> Free
          </span>
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-brand">
            <UserCheck className="size-3" aria-hidden /> Yours
          </span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-border/30 rounded-2xl border border-border/40 overflow-hidden">
          {COMPARE_ROWS.map(({ label, auto, manual }, i) => (
            <div
              key={label}
              className={cn(
                "grid grid-cols-[1fr_auto_auto] items-center gap-x-3 px-3 py-2.5",
                i % 2 === 0 ? "bg-background" : "bg-muted/20"
              )}
            >
              <span className="text-[13px] font-semibold text-foreground">{label}</span>
              <span className={cn(
                "flex size-6 items-center justify-center rounded-full text-[11px] font-bold",
                auto ? "bg-emerald-100 text-emerald-700" : "bg-red-50 text-red-500"
              )}>
                {auto ? "✓" : "✕"}
              </span>
              <span className={cn(
                "flex size-6 items-center justify-center rounded-full text-[11px] font-bold",
                manual ? "bg-brand text-white shadow-sm" : "bg-red-50 text-red-500"
              )}>
                {manual ? "✓" : "✕"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-3 py-4 sm:px-4">
        <Link
          id="free-kundli-result-bridge-cta"
          href="/checkout/kundli"
          onClick={() => track.paidReportCtaClicked("free_kundli_result", "manual_bridge_bottom")}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand px-4 py-3.5 text-[14px] font-extrabold text-white shadow-md transition-all hover:bg-brand-hover active:scale-[0.98]"
        >
          <UserCheck size={15} strokeWidth={2.5} />
          Detailed kundli banwayein — ₹399
        </Link>
        <p className="mt-2 text-center text-[11px] font-medium text-muted-foreground">
          24-48 ghante mein · Private · Ek baar ki payment
        </p>
      </div>
    </div>
  );
}

// ─── Mangal Dosha (Version B / A–B test only) ────────────────────────────────

function MangalDoshaSection({ result }: { result: KundliResult }) {
  if (!result.doshas.mangalDosha) return null;
  return (
    <div
      className="mt-4 overflow-hidden rounded-2xl border-2 border-red-600/90 bg-gradient-to-br from-red-50 via-amber-50/80 to-red-50/90 shadow-[0_12px_40px_-18px_rgba(185,28,28,0.45)] ring-2 ring-red-200/60"
      role="status"
    >
      <div className="flex items-center gap-2 border-b border-red-200/80 bg-red-600 px-3 py-2">
        <span className="text-sm" aria-hidden>
          ⚠️
        </span>
        <p className="text-[11px] font-bold uppercase tracking-wide text-white">
          Mangal dosha — aapki kundli mein
        </p>
      </div>
      <div className="px-4 py-3.5">
        <p className="font-heading text-[15px] font-extrabold leading-snug text-red-950">
          Chart ke hisaab se Mangal aapke liye sensitive houses mein hai
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-red-900/85">
          Rishte, shaadi aur bade faisle — in par iska asar zyada dikhta hai. Isko samjhe bina baar
          baar wahi jhagde, delay ya tootne wale patterns aa sakte hain.
        </p>
        <p className="mt-2 text-[12px] font-medium text-red-800/90">
          Poori calculation, upay aur timing — detailed personalized kundli mein.
        </p>
      </div>
    </div>
  );
}

// ─── Sticky CTA bar ───────────────────────────────────────────────────────────

function StickyBar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-background/97 px-3 pb-[env(safe-area-inset-bottom,0px)] pt-2.5 shadow-[0_-6px_28px_-4px_rgba(0,0,0,0.14)] backdrop-blur-md md:hidden">
      <div className="mx-auto flex max-w-md items-center gap-3 pb-2">
        {/* Left copy */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-extrabold leading-tight text-foreground">
            Personalized Kundli Banwayein 🔮
          </p>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="text-[11px] font-semibold text-muted-foreground">24-48 ghante mein</span>
            <span className="inline-flex rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-800">Personal</span>
          </div>
        </div>

        {/* CTA button */}
        <Link
          id="free-kundli-result-sticky-cta"
          href="/checkout/kundli"
          onClick={() => track.paidReportCtaClicked("free_kundli_result", "sticky")}
          className="relative shrink-0 overflow-hidden rounded-2xl bg-brand px-5 py-2.5 shadow-[0_4px_16px_-4px_rgba(180,83,9,0.55)] transition-transform active:scale-95"
        >
          {/* shimmer sweep */}
          <span className="pointer-events-none absolute inset-0 -translate-x-full animate-[vg-sticky-shimmer_2.4s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/25 to-transparent" aria-hidden />
          <span className="relative flex flex-col items-center gap-0.5 leading-none">
            <span className="text-[11px] font-bold uppercase tracking-wide text-white/85">Unlock Now</span>
            <span className="flex items-baseline gap-1.5">
              <span className="text-[16px] font-extrabold text-white">₹399</span>
              <span className="text-[9px] font-semibold text-white/60 line-through">₹999</span>
            </span>
          </span>
        </Link>
      </div>

      <style>{`
        @keyframes vg-sticky-shimmer {
          0%   { transform: translateX(-140%) skewX(-16deg); }
          100% { transform: translateX(280%) skewX(-16deg); }
        }
      `}</style>
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

export function KundliResultView({ variant = "a" }: { variant?: KundliResultPageVariant }) {
  const router = useRouter();
  const [data, setData] = useState<StoredKundliData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem("kundli_result");
    if (!stored) { router.replace("/free-kundli"); return; }
    try {
      const parsed: StoredKundliData = JSON.parse(stored);
      setData(parsed);
      track.freeKundliResultViewed(parsed.submissionId, variant);
    } catch {
      router.replace("/free-kundli");
    } finally {
      setLoading(false);
    }
  }, [router, variant]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="mx-auto animate-spin text-brand" />
          <p className="mt-3 text-sm text-muted-foreground">Aapki kundli calculate ho rahi hai…</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { result, name, dob, tob, pob } = data;
  const fn = firstName(name);
  const insights = getKundliInsights(result);
  const { career, relationship, money } = insights;
  return (
    <div className="spiritual-pattern pb-28 md:pb-12">
      <div className="mx-auto max-w-xl space-y-6 px-3 pt-4 sm:px-4 sm:pt-6">

        {/* ── 1. Identity card — compact ──────────────────────────────────── */}
        <header className="relative overflow-hidden rounded-2xl border border-brand/20 bg-gradient-to-r from-gold-light/80 via-background to-brand-light/30 px-4 py-3.5 shadow-md">
          <div className="pointer-events-none absolute -right-4 -top-6 size-28 rounded-full bg-brand/10 blur-2xl" aria-hidden />

          <div className="relative flex items-center gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-gold text-sm font-extrabold tracking-tight text-white shadow-md ring-2 ring-white/70">
              {initials(name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="font-heading truncate text-lg font-extrabold leading-tight text-foreground">
                  {name}
                </h1>
                <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-800">
                  <CheckCircle2 className="size-2.5" aria-hidden />
                  Ready
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-medium text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="size-3 text-brand" aria-hidden />
                  {formatDOB(dob)}
                </span>
                {tob && tob !== "12:00" && (
                  <span className="flex items-center gap-1">
                    <Clock className="size-3 text-brand" aria-hidden />
                    {tob}
                  </span>
                )}
                <span className="flex min-w-0 items-center gap-1">
                  <MapPin className="size-3 shrink-0 text-brand" aria-hidden />
                  <span className="truncate">{pob}</span>
                </span>
              </div>
            </div>
            <span className="shrink-0 self-start rounded-lg border border-border/60 bg-background/90 px-1.5 py-1 text-[9px] font-semibold text-muted-foreground">
              <Bot className="mb-0.5 inline size-2.5" aria-hidden /> Basic
            </span>
          </div>
        </header>

        {/* ── 2. Chart snapshot — bold tiles ─────────────────────────────── */}
        <section aria-label="Chart snapshot">
          <div className="mb-3 px-0.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand">Core chart</p>
            <p className="font-heading text-base font-extrabold text-foreground">Teen cheezein yaad rakhna</p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { emoji: "♑", label: "Lagna", value: result.lagna },
              { emoji: "🌙", label: "Rashi", value: result.moonSign },
              { emoji: "⭐", label: "Nakshatra", value: result.nakshatra },
            ].map(({ emoji, label, value }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-1.5 rounded-2xl border border-border/50 bg-card px-2 py-3.5 text-center shadow-md ring-1 ring-black/[0.03]"
              >
                <span className="text-2xl leading-none drop-shadow-sm" aria-hidden>
                  {emoji}
                </span>
                <p className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground">{label}</p>
                <p className="font-heading text-sm font-extrabold leading-tight text-foreground">{value}</p>
              </div>
            ))}
          </div>
          {variant === "b" && <MangalDoshaSection result={result} />}

          {(result.doshas.kaalSarpDosha || result.doshas.pitruDosha) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {result.doshas.kaalSarpDosha && (
                <span className="rounded-full border border-amber-400/80 bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-900">
                  Kaal Sarp Yog — chart mein
                </span>
              )}
              {result.doshas.pitruDosha && (
                <span className="rounded-full border border-amber-400/80 bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-900">
                  Pitru ka yog — chart mein
                </span>
              )}
            </div>
          )}
        </section>

        {/* ── 3. Life areas — swipe ───────────────────────────────────────── */}
        <section aria-label="Life insights">
          <div className="mb-3 px-0.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Teen zones</p>
            <p className="font-heading text-base font-extrabold text-foreground">Swipe — career · love · money</p>
          </div>
          <InsightSwipeCards blocks={[career, relationship, money]} />
        </section>

        <PatternSection careerShort={career.shortLine} relShort={relationship.shortLine} />

        <DepthGapCard />

        <BenefitsSection />

        <CtaSection fn={fn} />

        <section aria-label="Reviews">
          <div className="mb-3 px-0.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Real stories</p>
            <p className="font-heading text-base font-extrabold text-foreground">Logo ne kya feel kiya</p>
          </div>
          <Testimonials />
        </section>

        <AutoManualBridge />

        <div className="h-2" />
      </div>

      <StickyBar />
    </div>
  );
}
