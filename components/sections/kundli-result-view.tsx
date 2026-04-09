"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2, CheckCircle2, Star,
  Sparkles, Bot, UserCheck, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics/events";
import type { KundliResult } from "@/lib/kundli/calculate";
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

// ─── Snapshot pill ────────────────────────────────────────────────────────────

function SnapPill({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-border/60 bg-background px-2 py-3 text-center shadow-sm">
      <span className="text-2xl leading-none" aria-hidden>{emoji}</span>
      <p className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="font-heading text-sm font-bold text-foreground leading-tight">{value}</p>
    </div>
  );
}

// ─── Insight swipe cards ──────────────────────────────────────────────────────

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
      {/* Swipe strip */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory overflow-x-auto gap-3 pb-3 -mx-3 px-3 scrollbar-none"
        style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
      >
        {blocks.map((block) => (
          <div
            key={block.title}
            className="snap-center shrink-0 w-[78vw] max-w-[280px] overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm flex flex-col"
          >
            {/* Coloured header */}
            <div className={cn("flex flex-col items-center gap-2 py-4 bg-gradient-to-br", block.headerGradient)}>
              <div className={cn("flex h-11 w-11 items-center justify-center rounded-full shadow-sm", block.iconBg)}>
                <span className="text-2xl leading-none" aria-hidden>{block.icon}</span>
              </div>
              <p className={cn("font-heading text-sm font-bold tracking-wide", block.titleColor)}>
                {block.title}
              </p>
            </div>

            {/* Content */}
            <div className="flex flex-col gap-2 px-3 py-3 flex-1">
              <p className="font-heading text-sm font-bold leading-snug text-foreground">
                {block.shortLine}
              </p>
              <p className="text-[13px] leading-relaxed text-muted-foreground">{block.line2}</p>
              <p className={cn("mt-auto border-l-2 pl-2.5 text-xs italic leading-snug text-muted-foreground", block.accentColor)}>
                {block.line3}
              </p>
            </div>
          </div>
        ))}
        {/* Trailing spacer so last card snaps cleanly */}
        <div className="shrink-0 w-3" aria-hidden />
      </div>

      {/* Dot indicators */}
      <div className="mt-1 flex items-center justify-center gap-1.5">
        {blocks.map((b, i) => (
          <button
            key={b.title}
            aria-label={b.title}
            onClick={() => {
              const el = scrollRef.current;
              if (!el) return;
              const cardW = el.scrollWidth / blocks.length;
              el.scrollTo({ left: cardW * i, behavior: "smooth" });
            }}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              activeIdx === i ? "w-5 bg-brand" : "w-1.5 bg-border"
            )}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Pattern section — red attention-grabbing, zoom-shake loop ──────────────

function PatternSection({ careerShort, relShort }: { careerShort: string; relShort: string }) {
  return (
    <>
      <style>{`
        @keyframes vg-pulse {
          0%,100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220,38,38,0.28); }
          30%      { transform: scale(1.013) translateX(-1px); box-shadow: 0 0 0 6px rgba(220,38,38,0.07); }
          50%      { transform: scale(1.018) translateX(1px); }
          70%      { transform: scale(1.013) translateX(0); box-shadow: 0 0 0 10px rgba(220,38,38,0.03); }
        }
        .vg-pattern-card { animation: vg-pulse 2.8s ease-in-out infinite; }
      `}</style>

      <div className="vg-pattern-card overflow-hidden rounded-2xl border-2 border-red-500/80 bg-white shadow-md">
        {/* Header — strong red */}
        <div className="flex items-center gap-2.5 bg-red-600 px-4 py-3">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
          </span>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white">
            Aapki Kundli — Important Pattern
          </p>
          <span className="ml-auto text-xs font-bold text-white/90">⚠</span>
        </div>

        {/* Body */}
        <div className="space-y-2 px-4 py-3.5">
          <h2 className="font-heading text-[15px] font-bold leading-snug text-zinc-900">
            Aapki kundli mein ek important pattern hai
          </h2>
          <ul className="space-y-2 text-sm leading-relaxed text-foreground/75">
            <li className="flex gap-2">
              <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-red-400" aria-hidden />
              <span>
                Jaise <span className="font-semibold text-foreground">{careerShort.toLowerCase()}</span>{" "}
                ya <span className="font-semibold text-foreground">{relShort.toLowerCase()}</span>{" "}
                yeh gehri planetary positions aur house combinations se juda ho sakta hai.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-red-400" aria-hidden />
              <span>Basic report mein woh depth nahi dikhti.</span>
            </li>
          </ul>

          {/* Nested highlight card */}
          <div className="mt-3 rounded-xl border border-red-200/70 bg-red-50/60 px-3.5 py-3">
            <p className="text-[13px] leading-relaxed text-foreground/80">
              Exact kaunsi{" "}
              <span className="font-semibold text-foreground">graha ya yog</span>{" "}
              iska reason hai woh sirf{" "}
              <span className="font-semibold text-foreground">detailed kundli analysis</span>{" "}
              mein clear hota hai. Wahi se poori samajh aur next steps milte hain.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="border-t border-red-100 bg-red-50/60 px-4 pb-4 pt-3">
          <button
            type="button"
            onClick={() => {
              track.paidReportCtaClicked("free_kundli_result", "pattern_section");
              document.getElementById("kundli-cta")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-red-700 active:scale-[0.98]"
          >
          Mujhe solution chahiye
          <ChevronRight className="size-4 shrink-0" strokeWidth={2.5} />
          </button>
          <p className="mt-2 text-center text-[11px] text-zinc-400">
            ₹399 · one-time · 24 ghante mein
          </p>
        </div>
      </div>
    </>
  );
}

// ─── Depth gap card — typewriter loop ────────────────────────────────────────

const DEPTH_ITEMS = [
  "Direction clear nahi hoti kitni bhi soch lo",
  "Decisions mein baar baar delay hota hai",
  "Same situations alag logon ke saath repeat hoti hain",
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
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
      <div className="px-4 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Kya yeh aapke saath hota hai?
        </p>

        {/* Static completed items */}
        <ul className="mt-3 space-y-2">
          {DEPTH_ITEMS.map((item, i) => {
            const isDone = i < activeIdx || (i === activeIdx && phase === "holding");
            const isActive = i === activeIdx;
            return (
              <li key={item} className="flex items-start gap-2.5">
                <span className={cn(
                  "mt-[5px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[9px] font-bold transition-colors duration-300",
                  isDone
                    ? "border-brand/60 bg-brand/15 text-brand"
                    : isActive
                    ? "border-brand/40 bg-brand/10 text-brand"
                    : "border-border/40 bg-muted/30 text-muted-foreground"
                )}>
                  {isDone ? "✓" : "?"}
                </span>
                <span className={cn(
                  "text-sm leading-relaxed transition-colors duration-300",
                  isDone ? "text-foreground" : isActive ? "text-foreground" : "text-muted-foreground/50"
                )}>
                  {isActive ? (
                    <>
                      {displayed}
                      <span className="ml-px inline-block w-[2px] animate-pulse bg-brand align-middle" style={{ height: "1em" }} />
                    </>
                  ) : (
                    item
                  )}
                </span>
              </li>
            );
          })}
        </ul>

        <p className="mt-3 rounded-xl bg-muted/40 px-3 py-2.5 text-[13px] leading-relaxed text-muted-foreground">
          Yeh sab aapki kundli ke planetary patterns se directly connected ho sakte hain.{" "}
          <span className="font-semibold text-foreground">Basic version mein yeh nahi dikhta.</span>
        </p>
      </div>
    </div>
  );
}

// ─── Benefits section ─────────────────────────────────────────────────────────

const BENEFITS = [
  {
    emoji: "💼",
    title: "Career ka exact direction",
    desc: "Kab shift lena hai, kaunsa field sahi hai, aur breakthrough kab aayega",
  },
  {
    emoji: "❤️",
    title: "Relationship pattern ka solution",
    desc: "Kyun baar baar same situation aati hai — aur isse permanently kaise todna hai",
  },
  {
    emoji: "💰",
    title: "Money cycle ka full breakdown",
    desc: "Paisa kab aayega, kab rokna hai, aur financial block kahan hai",
  },
  {
    emoji: "🔮",
    title: "Dosha / Yog — real impact + remedy",
    desc: "Chart mein jo bhi hai — uska exact scope aur tested solution",
  },
  {
    emoji: "📅",
    title: "Agle saalon ka life roadmap",
    desc: "Dasha-Antardasha ke saath — kab kya expect karna hai, clearly",
  },
  {
    emoji: "✨",
    title: "100% personalized — generic nahi",
    desc: "Sirf aapki date, time, aur place se banaya — kisi aur ki kundli nahi",
  },
];

function BenefitsSection() {
  return (
    <>
      <style>{`
        @keyframes vg-row-sweep {
          0%   { transform: translateX(-130%) skewX(-16deg); opacity: 0; }
          8%   { opacity: 1; }
          92%  { opacity: 1; }
          100% { transform: translateX(310%) skewX(-16deg); opacity: 0; }
        }
        .vg-row-sweep::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent 5%, rgba(255,255,255,0.60) 50%, transparent 95%);
          animation: vg-row-sweep 2.8s ease-in-out infinite;
          pointer-events: none;
          z-index: 1;
        }
        .vg-row-sweep:nth-child(2)::after  { animation-delay: 0.45s; }
        .vg-row-sweep:nth-child(3)::after  { animation-delay: 0.90s; }
        .vg-row-sweep:nth-child(4)::after  { animation-delay: 1.35s; }
        .vg-row-sweep:nth-child(5)::after  { animation-delay: 1.80s; }
        .vg-row-sweep:nth-child(6)::after  { animation-delay: 2.25s; }
      `}</style>

      <div className="overflow-hidden rounded-2xl border border-brand/20 bg-card shadow-sm">
        {/* Header */}
        <div className="border-b border-border/40 bg-gradient-to-r from-gold-light/60 to-brand-light/40 px-4 py-3.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-brand">
            Sirf aapke liye
          </p>
          <h3 className="font-heading mt-0.5 text-base font-bold text-foreground">
            Personalized Detailed Kundli mein kya milega?
          </h3>
        </div>

        {/* Benefits list — sweep on each row */}
        <div className="divide-y divide-border/40">
          {BENEFITS.map(({ emoji, title, desc }) => (
            <div key={title} className="vg-row-sweep relative overflow-hidden flex items-start gap-3 px-4 py-3">
              <span className="relative z-10 mt-0.5 shrink-0 text-xl leading-none" aria-hidden>{emoji}</span>
              <div className="relative z-10">
                <p className="text-sm font-semibold leading-snug text-foreground">{title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── CTA section ─────────────────────────────────────────────────────────────

function CtaSection({ fn }: { fn: string }) {
  return (
    <div id="kundli-cta" className="overflow-hidden rounded-2xl border-2 border-brand/40 bg-gradient-to-br from-gold-light via-brand-light/60 to-gold-light shadow-md">

      {/* Top label */}
      <div className="border-b border-brand/20 bg-brand/8 px-5 py-2 text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-brand">
          Poori clarity baaki hai
        </p>
      </div>

      {/* Book image + headline side by side */}
      <div className="flex items-center gap-4 px-5 pt-5 pb-3">
        {/* Book mockup */}
        <div className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://primedit-cdn.b-cdn.net/shubhmay-lp-kundli/premium_kundli.png"
            alt="Premium Personalized Kundli"
            width={100}
            height={120}
            className="h-[110px] w-auto drop-shadow-lg"
          />
        </div>

        {/* Copy */}
        <div className="flex-1">
          <h2 className="font-heading text-xl font-bold leading-tight text-foreground">
            Ab apni poori Kundli samjhein
          </h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Sirf {fn} ke liye — personally analyzed
          </p>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground">₹399</span>
            <span className="text-sm text-muted-foreground line-through">₹999</span>
            <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-white">60% OFF</span>
          </div>
        </div>
      </div>

      <div className="px-5 pb-5">
        {/* Benefits */}
        <ul className="mb-4 space-y-2">
          {[
            "Aapke life mein kya ho raha hai aur kyun",
            "Kaunse time pe kya expect karna hai",
            "Aapke liye sahi direction kya hai",
            "Dosha ya yog — exact impact aur remedy",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <Sparkles size={12} className="mt-[3px] shrink-0 text-brand" />
              <span className="text-[13px] font-medium text-foreground">{item}</span>
            </li>
          ))}
        </ul>

        <Link
          href="/checkout/kundli"
          onClick={() => track.paidReportCtaClicked("free_kundli_result", "main_cta")}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-6 py-4 text-[15px] font-bold text-white shadow-md transition-all hover:bg-brand-hover active:scale-[0.98]"
        >
          Mujhe sab clear samajhna hai
          <ChevronRight className="size-4 shrink-0" strokeWidth={2.5} />
        </Link>

        <div className="mt-3 flex items-center justify-center gap-5">
          <p className="text-xs font-medium text-muted-foreground">✓ 24 ghante mein milegi</p>
          <p className="text-xs font-medium text-muted-foreground">✓ Sirf aapke liye</p>
          <p className="text-xs font-medium text-muted-foreground">✓ 100% private</p>
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
    <div className="space-y-3">
      {REVIEWS.map(({ initial, name, city, tag, headline, text }) => (
        <div key={name} className="relative overflow-hidden rounded-2xl border border-border/50 bg-card px-4 py-4 shadow-sm">
          <span className="absolute right-3 top-0 select-none font-heading text-6xl font-black leading-none text-muted-foreground/8" aria-hidden>&ldquo;</span>

          <div className="mb-2.5 flex items-center gap-2">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => <Star key={i} size={11} className="fill-amber-400 text-amber-400" />)}
            </div>
            <span className="rounded-full border border-brand/30 bg-brand/8 px-2 py-0.5 text-[9px] font-bold text-brand">{tag}</span>
            <span className="ml-auto rounded-full border border-green-200 bg-green-50 px-1.5 py-0.5 text-[9px] font-bold text-green-700">Verified</span>
          </div>

          <p className="mb-1.5 font-heading text-sm font-bold text-foreground">{headline}</p>
          <p className="text-[13px] leading-relaxed text-muted-foreground">&ldquo;{text}&rdquo;</p>

          <div className="mt-3 flex items-center gap-2 border-t border-border/40 pt-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white">{initial}</div>
            <div>
              <p className="text-xs font-semibold text-foreground">{name}</p>
              <p className="text-[10px] text-muted-foreground">{city}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Auto vs Manual bridge ────────────────────────────────────────────────────

function AutoManualBridge() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
      <div className="border-b border-border/40 bg-muted/30 px-4 py-3">
        <p className="font-heading text-sm font-bold text-foreground">
          Computer Kundli vs Manual Kundli
        </p>
      </div>

      <div className="space-y-4 px-4 py-4">
        {/* Comparison grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-border/50 bg-muted/30 px-3 py-3">
            <div className="mb-2 flex items-center gap-1.5">
              <Bot size={12} className="text-muted-foreground" />
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Computer</p>
            </div>
            <ul className="space-y-1.5">
              {["Basic positions", "Generic patterns", "No timing", "No remedies"].map((t) => (
                <li key={t} className="flex gap-1.5 text-xs font-medium text-muted-foreground">
                  <span className="shrink-0 text-muted-foreground/60">✕</span>{t}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-brand/30 bg-gradient-to-br from-gold-light/60 to-brand-light/30 px-3 py-3">
            <div className="mb-2 flex items-center gap-1.5">
              <UserCheck size={12} className="text-brand" />
              <p className="text-[10px] font-bold uppercase tracking-wide text-brand">Manual</p>
            </div>
            <ul className="space-y-1.5">
              {["Exact life timing", "Sirf aapke liye", "Asli reasons", "Remedies bhi"].map((t) => (
                <li key={t} className="flex gap-1.5 text-xs font-semibold text-foreground">
                  <span className="shrink-0 text-brand">✓</span>{t}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Link
          href="/checkout/kundli"
          onClick={() => track.paidReportCtaClicked("free_kundli_result", "manual_bridge_bottom")}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-hover active:scale-[0.98]"
        >
          <UserCheck size={14} />
          Apni Detailed Manual Kundli Banwayein
        </Link>
        <p className="text-center text-xs font-medium text-muted-foreground">Apni zindagi badle — ek sahi report se</p>
      </div>
    </div>
  );
}

// ─── Sticky CTA bar ───────────────────────────────────────────────────────────

function StickyBar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-background/95 px-4 py-3 backdrop-blur-md md:hidden">
      <div className="mx-auto flex max-w-md items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-foreground">Detailed Kundli Banwayein 🔮</p>
          <p className="text-xs text-muted-foreground">24 ghante mein · Sirf aapke liye</p>
        </div>
        <Link
          href="/checkout/kundli"
          onClick={() => track.paidReportCtaClicked("free_kundli_result", "sticky")}
          className="shrink-0 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-transform active:scale-95"
        >
          Unlock ₹399
        </Link>
      </div>
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

export function KundliResultView() {
  const router = useRouter();
  const [data, setData] = useState<StoredKundliData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem("kundli_result");
    if (!stored) { router.replace("/free-kundli"); return; }
    try {
      const parsed: StoredKundliData = JSON.parse(stored);
      setData(parsed);
      track.freeKundliResultViewed(parsed.submissionId);
    } catch {
      router.replace("/free-kundli");
    } finally {
      setLoading(false);
    }
  }, [router]);

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
  const hasDosha = result.doshas.mangalDosha || result.doshas.kaalSarpDosha || result.doshas.pitruDosha;

  return (
    <div className="spiritual-pattern pb-28 md:pb-12">
      <div className="mx-auto max-w-xl space-y-3 px-3 pt-3 sm:px-4">

        {/* ── 1. Identity — compact ────────────────────────────────────────── */}
        <div className="rounded-2xl border border-brand/20 bg-gradient-to-br from-gold-light/70 via-brand-light/50 to-gold-light/30 px-4 py-3.5 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={12} className="shrink-0 text-brand" />
            <p className="font-heading text-sm font-bold text-foreground">Basic Kundli Report</p>
            <span className="ml-auto flex items-center gap-1 rounded-full border border-border/60 bg-background/70 px-2 py-0.5">
              <Bot size={9} className="text-muted-foreground" />
              <span className="text-[9px] font-semibold text-muted-foreground">Computer Generated</span>
            </span>
          </div>
          <h1 className="font-heading mt-1.5 text-xl font-bold leading-tight text-foreground">
            {name} ki Kundli ✨
          </h1>
          {/* DOB + Place on one line */}
          <p className="mt-1.5 text-xs font-medium text-muted-foreground">
            📅 {formatDOB(dob)}{tob && tob !== "12:00" && ` · ${tob}`}
            {"  "}📍 {pob}
          </p>
        </div>

        {/* ── 2. Snapshot — compact inline ─────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { emoji: "♑", label: "Lagna",    value: result.lagna },
            { emoji: "🌙", label: "Rashi",    value: result.moonSign },
            { emoji: "⭐", label: "Nakshatra", value: result.nakshatra },
          ].map(({ emoji, label, value }) => (
            <div key={label} className="flex flex-col items-center gap-0.5 rounded-xl border border-border/60 bg-background px-2 py-2 text-center shadow-sm">
              <span className="text-lg leading-none" aria-hidden>{emoji}</span>
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
              <p className="font-heading text-xs font-bold text-foreground leading-tight">{value}</p>
            </div>
          ))}
        </div>
        {hasDosha && (
          <div className="flex flex-wrap gap-1.5 -mt-1">
            {result.doshas.mangalDosha   && <span className="rounded-full border border-amber-300/60 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">⚠ Mangal Dosha</span>}
            {result.doshas.kaalSarpDosha && <span className="rounded-full border border-amber-300/60 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">⚠ Kaal Sarp Yog</span>}
            {result.doshas.pitruDosha    && <span className="rounded-full border border-amber-300/60 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">⚠ Pitru Yog</span>}
          </div>
        )}

        {/* ── 3. Insight swipe cards — compact ─────────────────────────────── */}
        <div>
          <p className="mb-2 px-0.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
            Aapke life ke 3 areas — swipe karo →
          </p>
          <InsightSwipeCards blocks={[career, relationship, money]} />
        </div>

        {/* ── 4. Pattern section — main selling point (peeks in first fold) ── */}
        {/* ── 5. Pattern + Depth gap — back-to-back ──────────────────────── */}
        <PatternSection
          careerShort={career.shortLine}
          relShort={relationship.shortLine}
        />

        {/* ── 5. Relatability ──────────────────────────────────────────────── */}
        <DepthGapCard />

        {/* ── 6. Benefits — kya milega detailed kundli mein ───────────────── */}
        <BenefitsSection />

        {/* ── 7. CTA ───────────────────────────────────────────────────────── */}
        <CtaSection fn={fn} />

        {/* ── 9. Testimonials ──────────────────────────────────────────────── */}
        <div>
          <p className="mb-3 px-0.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
            Logon ki zindagi kaise badli
          </p>
          <Testimonials />
        </div>

        {/* ── 10. Manual bridge ────────────────────────────────────────────── */}
        <AutoManualBridge />

        <div className="h-4" />
      </div>

      <StickyBar />
    </div>
  );
}
