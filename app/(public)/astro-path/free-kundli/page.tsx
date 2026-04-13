import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckCircle2, Lock, MessageCircleMore, Sparkles, Star } from "lucide-react";
import { KundliForm } from "@/components/forms/kundli-form";

export const metadata: Metadata = {
  title: "Free Kundli — Instant Janam Chart | VedGuide",
  description:
    "Apni free kundli turant banayein. Janam ki basic details dalein aur career, relationship aur money patterns ka quick chart snapshot dekhein.",
};

const TOP_STRIP = [
  { icon: "⚡", label: "Quick start" },
  { icon: "🔒", label: "Private data" },
  { icon: "📲", label: "WhatsApp updates" },
  { icon: "⭐", label: "4.9 Rated" },
];

const PROOF_STATS = [
  { value: "2,400+", label: "Free charts" },
  { value: "60 sec", label: "Start time" },
  { value: "100%", label: "Secure" },
];

const INSIGHT_CARDS = [
  {
    emoji: "💼",
    title: "Career direction",
    text: "Kis phase mein growth fast hogi aur kis phase mein patience chahiye.",
  },
  {
    emoji: "❤️",
    title: "Relationship pattern",
    text: "Repeat hone wale rishta patterns ko jaldi identify karein.",
  },
  {
    emoji: "💰",
    title: "Money behavior",
    text: "Income blocks aur practical stability windows samjhein.",
  },
];

const QUICK_PROMISES = [
  "Account create karna zaroori nahi",
  "Data kisi third-party ko share nahi hota",
  "Result ke baad direct detailed report checkout flow",
];

function TopStrip() {
  return (
    <div className="border-b border-brand/15 bg-gradient-to-r from-brand-light/55 via-gold-light/45 to-brand-light/40">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-3 px-3 py-2 sm:gap-5 sm:px-4">
        {TOP_STRIP.map(({ icon, label }) => (
          <span
            key={label}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand sm:text-xs"
          >
            <span aria-hidden>{icon}</span>
            <span>{label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function HeroIntro() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-brand/20 bg-gradient-to-br from-amber-50/75 via-background to-brand-light/45 p-5 shadow-[0_22px_55px_-30px_rgba(180,83,9,0.45)] sm:p-7">
      <div
        className="pointer-events-none absolute -right-8 -top-10 size-36 rounded-full bg-brand/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-8 -left-8 size-32 rounded-full bg-gold/20 blur-3xl"
        aria-hidden
      />

      <div className="relative">
        <span className="inline-flex items-center gap-1 rounded-full border border-brand/25 bg-brand-light/55 px-3 py-1 text-[11px] font-semibold text-brand">
          <Sparkles className="size-3.5" aria-hidden />
          Personalized free chart
        </span>

        <h1 className="font-heading mt-4 text-3xl font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          Aaj ka chart signal
          <br />
          <span className="brand-gradient-text">seedha samajho</span>
        </h1>

        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Date, time aur place dalte hi aapko clear snapshot milega: aapke pattern kahan strong
          hain, aur kahan attention deni chahiye.
        </p>

        <div className="mt-5 grid grid-cols-3 gap-2">
          {PROOF_STATS.map(({ value, label }) => (
            <div
              key={label}
              className="rounded-2xl border border-border/50 bg-white/80 px-3 py-2.5 text-center shadow-sm"
            >
              <p className="font-heading text-lg font-extrabold text-brand sm:text-xl">{value}</p>
              <p className="text-[10px] font-semibold text-muted-foreground sm:text-[11px]">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 space-y-2.5">
          {QUICK_PROMISES.map((item) => (
            <div key={item} className="flex items-start gap-2.5">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
              <p className="text-xs font-medium leading-snug text-foreground/85 sm:text-sm">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InsightPreview() {
  return (
    <div className="rounded-3xl border border-border/60 bg-card/90 p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand">Preview cards</p>
        <span className="rounded-full bg-brand-light/60 px-2 py-0.5 text-[10px] font-semibold text-brand">
          Instant
        </span>
      </div>

      <div className="space-y-2.5">
        {INSIGHT_CARDS.map(({ emoji, title, text }) => (
          <article
            key={title}
            className="rounded-2xl border border-border/45 bg-background/75 px-3.5 py-3 shadow-[0_8px_18px_-15px_rgba(0,0,0,0.3)]"
          >
            <p className="flex items-center gap-2 text-sm font-bold text-foreground">
              <span className="text-base leading-none" aria-hidden>
                {emoji}
              </span>
              {title}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function SocialProof() {
  return (
    <div className="rounded-3xl border border-amber-200/70 bg-gradient-to-br from-amber-50/80 to-gold-light/60 p-4 shadow-sm sm:p-5">
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="size-4 fill-amber-500 text-amber-500" aria-hidden />
        ))}
      </div>

      <p className="mt-3 text-sm font-medium leading-relaxed text-foreground">
        &ldquo;Result ne exactly wahi pain points highlight kiye jo main feel kar rahi thi. Iske
        baad detailed report lena easy decision ho gaya.&rdquo;
      </p>

      <div className="mt-3 flex items-center gap-2.5">
        <div className="flex size-8 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
          R
        </div>
        <div>
          <p className="text-xs font-bold text-foreground">Ritika S.</p>
          <p className="text-[11px] text-muted-foreground">Indore</p>
        </div>
      </div>
    </div>
  );
}

function PrivacyNote() {
  return (
    <div className="rounded-2xl border border-border/55 bg-card/70 px-4 py-3.5">
      <p className="flex items-center gap-2 text-xs font-semibold text-foreground">
        <Lock className="size-3.5 text-brand" aria-hidden />
        Aapka data encrypted storage mein save hota hai.
      </p>
      <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
        Spam calls ya random promotional messages nahi bheje jaate.
      </p>
    </div>
  );
}

export default function AstroPathFreeKundliPage() {
  return (
    <div className="min-h-screen spiritual-pattern">
      <TopStrip />

      <div className="mx-auto max-w-6xl px-3 pb-10 pt-4 sm:px-4 sm:pt-6 md:pb-14">
        <div className="grid gap-4 lg:grid-cols-[1.06fr_0.94fr] lg:items-start lg:gap-6">
          <div className="space-y-4">
            <HeroIntro />
            <InsightPreview />
          </div>

          <div className="space-y-4">
            <div
              id="kundli-form-v2"
              className="relative overflow-hidden rounded-3xl border border-brand/30 bg-gradient-to-br from-brand-light/45 via-gold-light/25 to-background p-[1px] shadow-[0_22px_55px_-30px_rgba(180,83,9,0.6)]"
            >
              <div className="rounded-[1.45rem] bg-card px-4 py-5 sm:px-5 sm:py-6 md:px-6 md:py-7">
                <div className="mb-4 rounded-2xl border border-brand/20 bg-brand-light/35 px-3 py-2.5">
                  <p className="font-heading text-[15px] font-extrabold text-foreground">
                    Free Kundli Start Karein
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <MessageCircleMore className="size-3.5 text-brand" aria-hidden />
                    Form complete karte hi result flow khul jayega
                  </p>
                </div>

                <Suspense>
                  <KundliForm
                    sourceDefault="kfp_v2_free_kundli_page"
                    pagePath="/astro-path/free-kundli"
                    resultPath="/astro-path/free-kundli/result"
                    idPrefix="free-kundli-v2"
                  />
                </Suspense>

                <p className="mt-4 text-center text-[11px] leading-snug text-muted-foreground">
                  🔐 Private and secure • Result + updates only on consented WhatsApp
                </p>
              </div>
            </div>

            <SocialProof />
            <PrivacyNote />
          </div>
        </div>
      </div>
    </div>
  );
}
