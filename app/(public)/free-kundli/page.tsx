import type { Metadata } from "next";
import { Suspense } from "react";
import { KundliForm } from "@/components/forms/kundli-form";
import { Lock } from "lucide-react";

export const metadata: Metadata = {
  title: "Free Kundli — Apni Janam Patri Abhi Dekhein | VedGuide",
  description:
    "Apni free Vedic Kundli abhi banayein. Janm ka time, date aur jagah dalein — aur apna Lagna, Moon sign, Nakshatra sab jaanein. 2400+ users already done.",
};

const TRUST_STRIP = [
  { icon: "⚡", label: "Free" },
  { icon: "⏱", label: "Instant" },
  { icon: "🔒", label: "Private" },
  { icon: "⭐", label: "2400+ Users" },
];

// Life insight rows shown in the preview card
const LIFE_INSIGHTS = [
  {
    emoji: "💼",
    title: "Career mein kab hogi breakthrough?",
    teaser: "Shani ka ghar batata hai aapka asli career path",
  },
  {
    emoji: "❤️",
    title: "Love life mein kya likha hai?",
    teaser: "7th house se milta hai partner ka poora hisaab",
  },
  {
    emoji: "💰",
    title: "Paisa aur wealth ka kya scene hai?",
    teaser: "2nd aur 11th house reveal karte hain dhan yog",
  },
  {
    emoji: "🌙",
    title: "Aapki asli personality kaisi hai?",
    teaser: "Lagna aur Chandra rashi milke banati hai aapki identity",
  },
];

// Bottom stat strip
const STATS = [
  { emoji: "🧿", stat: "2,400+", label: "Kundliyaan bani" },
  { emoji: "🌟", stat: "4.9/5", label: "Average rating" },
  { emoji: "🔐", stat: "100%", label: "Data private" },
  { emoji: "⚡", stat: "60 sec", label: "Mein ready" },
];

/** Minimal trust bar */
function TrustStrip() {
  return (
    <div className="border-b border-brand/10 bg-brand-light/30">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-3 px-3 py-2 sm:gap-5 sm:px-4">
        {TRUST_STRIP.map(({ icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-1 text-[11px] font-medium text-brand sm:text-xs"
          >
            <span aria-hidden>{icon}</span>
            <span>{label}</span>
          </div>
        ))}
        <span className="hidden items-center gap-1 text-[10px] text-muted-foreground sm:flex">
          <Lock className="size-3 opacity-60" aria-hidden />
          No spam
        </span>
      </div>
    </div>
  );
}

/** Eye-catching stat strip below the main content */
function StatsStrip() {
  return (
    <div className="mt-5 overflow-hidden rounded-xl border border-brand/20 bg-gradient-to-br from-brand-light/60 via-gold-light/40 to-brand-light/30 shadow-sm md:mt-8 md:rounded-2xl">
      <div className="grid grid-cols-4 divide-x divide-brand/15">
        {STATS.map(({ emoji, stat, label }) => (
          <div
            key={label}
            className="flex flex-col items-center justify-center gap-0.5 px-1.5 py-3 text-center md:py-4"
          >
            <span className="text-lg leading-none md:text-xl" aria-hidden>
              {emoji}
            </span>
            <p className="font-heading mt-1 text-[15px] font-extrabold tabular-nums text-brand md:text-xl">
              {stat}
            </p>
            <p className="text-[9px] font-medium leading-tight text-muted-foreground md:text-[11px]">
              {label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Preview card — life insights instead of raw astro labels */
function PreviewCard() {
  return (
    <div className="rounded-xl border border-border/50 bg-card/80 p-3 sm:p-4 md:rounded-2xl md:p-5">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between md:mb-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-brand md:text-xs">
          Aapki Kundli mein milega ↓
        </p>
        <span className="rounded-full bg-brand-light/70 px-2 py-0.5 text-[9px] font-semibold text-brand md:text-[10px]">
          Preview
        </span>
      </div>

      {/* Life insight rows */}
      <div className="space-y-2 md:space-y-2.5">
        {LIFE_INSIGHTS.map(({ emoji, title, teaser }) => (
          <div
            key={title}
            className="flex items-start gap-2.5 rounded-lg border border-border/40 bg-background/80 px-3 py-2.5 md:gap-3 md:py-3"
          >
            <span className="mt-0.5 shrink-0 text-base leading-none md:text-lg" aria-hidden>
              {emoji}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold leading-snug text-foreground md:text-sm">
                {title}
              </p>
              <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground md:text-xs">
                {teaser}
              </p>
            </div>
            {/* Blurred "unlock" hint */}
            <div className="ml-auto mt-0.5 shrink-0 rounded-md bg-brand-light/50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-brand/70 md:text-[10px]">
              🔓 Free
            </div>
          </div>
        ))}
      </div>

      <p className="mt-3 text-center text-[10px] text-muted-foreground md:mt-4 md:text-xs">
        + Nakshatra · Dosha · Planetary positions · aur bahut kuch
      </p>
    </div>
  );
}

/** Strong testimonial card */
function TestimonialCard() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-amber-200/60 bg-gradient-to-br from-amber-50/80 to-gold-light/50 p-3 sm:p-4 md:rounded-2xl md:p-5">
      {/* Big quote mark */}
      <span
        className="absolute right-3 top-1 font-heading text-6xl font-black leading-none text-amber-300/40 md:text-7xl"
        aria-hidden
      >
        {"\u201C"}
      </span>

      <div className="flex items-center gap-0.5 mb-2">
        {[...Array(5)].map((_, i) => (
          <span key={i} className="text-sm text-amber-500">★</span>
        ))}
        <span className="ml-1.5 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700">
          Verified
        </span>
      </div>

      <p className="relative text-sm font-medium leading-relaxed text-foreground md:text-[15px]">
        {"\u201C"}
        Pehli baar kisi ne meri life itni accurately describe ki — career ka struggle, relationship ki
        confusion, sab kuch. Mere dost ne bheja tha, socha bakwas hoga. Par result dekh ke aankhein bhar
        aayi.
        {"\u201D"}
      </p>
      <div className="mt-3 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
          P
        </div>
        <div>
          <p className="text-xs font-bold text-foreground">Priya Mehta</p>
          <p className="text-[10px] text-muted-foreground">Pune · Instagram se aayi thi</p>
        </div>
      </div>
    </div>
  );
}

/** 3 trust points */
function TrustPoints() {
  return (
    <div className="rounded-xl border border-border/50 bg-card/70 p-3 sm:p-4 md:rounded-2xl md:p-5">
      <div className="space-y-2.5">
        {[
          {
            emoji: "🔐",
            title: "Aapka data 100% private hai",
            sub: "Kabhi kisi ke saath share nahi hota — guaranteed",
          },
          {
            emoji: "🚫",
            title: "Zero spam, zero calls",
            sub: "Sirf aapka result — koi annoying follow-up nahi",
          },
          {
            emoji: "🏛️",
            title: "Authentic Vedic astrology",
            sub: "Centuries-old tradition, modern accuracy ke saath",
          },
        ].map(({ emoji, title, sub }) => (
          <div key={title} className="flex items-start gap-2.5 md:gap-3">
            <span className="mt-0.5 shrink-0 text-base leading-none md:text-lg" aria-hidden>
              {emoji}
            </span>
            <div>
              <p className="text-[11px] font-semibold text-foreground md:text-xs">{title}</p>
              <p className="text-[10px] leading-snug text-muted-foreground md:text-[11px]">{sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FreeKundliPage() {
  return (
    <div className="min-h-screen spiritual-pattern">
      <TrustStrip />

      <div className="mx-auto max-w-6xl px-3 sm:px-4">
        {/* Hero */}
        <div className="pt-3 pb-2 text-center md:py-12 md:pb-4">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand-light/60 px-2.5 py-0.5 text-[11px] font-medium text-brand md:mb-4 md:px-4 md:py-1.5 md:text-sm">
            ✨ Free · Instant · Personalized
          </div>

          <h1 className="font-heading text-[1.65rem] font-bold leading-[1.12] tracking-tight text-foreground sm:text-3xl md:text-5xl lg:text-6xl">
            Jaanein Aapki
            <br />
            <span className="brand-gradient-text">Asli Kundli</span>
          </h1>

          <p className="mx-auto mt-2 max-w-sm text-xs leading-snug text-muted-foreground sm:text-sm md:mt-4 md:max-w-md md:text-lg md:leading-relaxed">
            Sirf janm ki{" "}
            <span className="font-semibold text-foreground">date, time aur jagah</span>{" "}
            dalein — turant dekhein
          </p>
        </div>

        {/* Main grid */}
        <div className="grid gap-3 md:grid-cols-2 md:items-start md:gap-8 lg:gap-12">
          {/* Form */}
          <div
            id="kundli-form"
            className="scroll-mt-4 rounded-xl border border-border/60 bg-card px-4 py-5 shadow-sm sm:px-5 sm:py-6 md:rounded-2xl md:px-8 md:py-10"
          >
            <Suspense>
              <KundliForm />
            </Suspense>

            <p className="mt-4 text-center text-[11px] leading-snug text-muted-foreground md:mt-6 md:text-xs">
              🔒 Aapka data safe hai — kabhi share nahi karenge, kabhi spam nahi karenge
            </p>
          </div>

          {/* Right panel */}
          <div className="flex flex-col gap-3 md:gap-4">
            <PreviewCard />
            <TestimonialCard />
            <TrustPoints />
          </div>
        </div>

        {/* Stats strip */}
        <StatsStrip />

        <div className="h-8 md:h-12" />
      </div>
    </div>
  );
}
