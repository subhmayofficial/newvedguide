"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, Sparkles, Zap } from "lucide-react";
import { RASHI_DHATU } from "@/lib/kundal-dhatu";
import { cn } from "@/lib/utils";

// image slug per rashi id — matches /public/zodiac/*.webp
const RASHI_IMG: Record<string, string> = {
  mesha:     "/zodiac/mesh.webp",
  vrishabha: "/zodiac/vrishabha.webp",
  mithuna:   "/zodiac/mithuna.webp",
  karka:     "/zodiac/karka.webp",
  simha:     "/zodiac/simha.webp",
  kanya:     "/zodiac/kanya.webp",
  tula:      "/zodiac/tula.webp",
  vrishchika:"/zodiac/vrishchika.webp",
  dhanu:     "/zodiac/dhanu.webp",
  makara:    "/zodiac/makara.webp",
  kumbha:    "/zodiac/kumbha.webp",
  meena:     "/zodiac/meena.webp",
};

type Step = "intro" | "pick" | "result";

type KundalDhatuToolVariant = "default" | "astro";

type KundalDhatuToolProps = {
  freeKundliHref?: string;
  variant?: KundalDhatuToolVariant;
  idPrefix?: string;
};

type ToolCopy = {
  introTitle: string;
  introBody1: string;
  introBody2: string;
  startLabel: string;
  introFooter: string;
  introBenefits: string[];
  pickTitle: string;
  pickSub: string;
  resultNextStepLabel: string;
  resultLead: string;
  resultTitle: string;
  resultPrimaryCta: string;
  resultPrimarySub: string;
  resultSecondaryLead: string;
  resultSecondaryStrong: string;
  resultSecondaryCta: string;
  resultSecondaryFootnote: string;
  stickyTitle: string;
  stickySub: string;
  stickyCta: string;
};

const TOOL_COPY: Record<KundalDhatuToolVariant, ToolCopy> = {
  default: {
    introTitle: "Apna sahi kundal metal jaanen",
    introBody1:
      "Right ear mein Gold, Silver ya Copper — rashi ke hisaab se sahi dhatu pehenne se energy balance hoti hai. Yeh quick guide se aap apni rashi ka metal jaan sakte ho.",
    introBody2:
      "Kundal metal ke fayde: positive energy, mental clarity, aur grah alignment.",
    startLabel: "Start Now",
    introFooter: "1 minute • Free • No signup",
    introBenefits: ["Energy balance", "Mental clarity", "Grah alignment", "Right ear specific"],
    pickTitle: "Apni Rashi Select Karo",
    pickSub: "Neeche se apni janam rashi choose karein — aapko right ear metal ka suggestion milega.",
    resultNextStepLabel: "Next step",
    resultLead: "Yeh sirf Rashi ke basis par hai —",
    resultTitle: "Aapki poori kundli kya kehti hai?",
    resultPrimaryCta: "Apni exact Kundli check karein (Free)",
    resultPrimarySub: "Moon sign, Lagna aur nakshatra ke hisaab se aapka sahi dhatu aur bhi clear hota hai",
    resultSecondaryLead: "Abhi jo result aapne dekha — wo sirf ek part hai",
    resultSecondaryStrong:
      "Aapki poori kundli mein aur bhi important signals hote hain jo decisions ko affect karte hain",
    resultSecondaryCta: "Meri poori Kundli dekho (Free)",
    resultSecondaryFootnote: "Free · 1 minute · No signup",
    stickyTitle: "Apni poori Kundli jaano 🔮",
    stickySub: "Lagna · Moon sign · Nakshatra — sab free",
    stickyCta: "Check karein",
  },
  astro: {
    introTitle: "Kundal metal quick match",
    introBody1:
      "Rashi ke base par right-ear metal ka quick suggestion paayein. Yeh fast starter check hai jo aapko direction deta hai.",
    introBody2:
      "Uske baad free kundli flow mein jaakar apna complete life pattern bhi dekh sakte ho.",
    startLabel: "Check My Metal",
    introFooter: "Fast check • Free • Beginner friendly",
    introBenefits: ["Rashi based", "Right ear focus", "Quick result", "No signup"],
    pickTitle: "Apni Janam Rashi select karein",
    pickSub: "Ek tap mein rashi choose karein, turant recommended dhatu mil jayega.",
    resultNextStepLabel: "Upgrade insight",
    resultLead: "Metal hint mil gaya —",
    resultTitle: "Ab apni full kundli ka exact pattern dekhein",
    resultPrimaryCta: "Ab free kundli open karein",
    resultPrimarySub: "Lagna, moon sign aur nakshatra ke saath metal guidance aur precise hoti hai",
    resultSecondaryLead: "Metal suggestion ek strong start hai",
    resultSecondaryStrong: "Puri kundli se career, rishta aur money ke signals bhi clear hote hain",
    resultSecondaryCta: "Open Full Free Kundli",
    resultSecondaryFootnote: "Free • No card needed • 1 minute",
    stickyTitle: "Full kundli unlock karein 🔮",
    stickySub: "Pattern clarity · next-step guidance",
    stickyCta: "Open now",
  },
};

const KUNDAL_DHATU_IMPORTANT_VIDEO_URL =
  "https://player.mediadelivery.net/play/550381/68e0cafb-c45b-47ac-84da-8ead855af781";

export function KundalDhatuTool({
  freeKundliHref = "/free-kundli",
  variant = "default",
  idPrefix = "kundal-dhatu",
}: KundalDhatuToolProps = {}) {
  const [step, setStep] = useState<Step>("intro");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const copy = TOOL_COPY[variant];

  const row = selectedId ? RASHI_DHATU.find((r) => r.id === selectedId) : undefined;

  useEffect(() => {
    document.body.dataset.hideSiteHeader = step === "result" ? "true" : "false";

    return () => {
      document.body.dataset.hideSiteHeader = "false";
    };
  }, [step]);

  function selectRashi(id: string) {
    setSelectedId(id);
    setStep("result");
  }

  return (
    <div
      className="min-h-[70vh] px-4 py-10"
      style={{
        background:
          variant === "astro"
            ? "linear-gradient(160deg, #fff7e8 0%, #feeeca 52%, #fde8bf 100%)"
            : "linear-gradient(160deg, #fef9e7 0%, #fdf3d0 100%)",
      }}
    >
      <div className="mx-auto max-w-sm">

        {/* ─── INTRO ──────────────────────────────────────────────────── */}
        {step === "intro" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="rounded-3xl bg-white px-7 py-8 shadow-lg">
              <h1 className="font-heading text-[1.55rem] font-black leading-snug text-foreground">
                {copy.introTitle}
              </h1>
              <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
                {copy.introBody1}
              </p>
              <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
                {copy.introBody2}
              </p>
              <button
                id={`${idPrefix}-start-btn`}
                type="button"
                onClick={() => setStep("pick")}
                className="mt-6 w-full rounded-2xl bg-brand py-3.5 text-center text-[15px] font-extrabold text-white shadow-[0_4px_16px_-4px_rgba(180,83,9,0.45)] transition-all active:scale-[0.98] hover:bg-brand-hover"
              >
                {copy.startLabel}
              </button>
              <p className="mt-3 text-center text-[12px] text-muted-foreground">
                {copy.introFooter}
              </p>
            </div>

            <div className="mt-8 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand/70">
                Kundal metal benefits
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {copy.introBenefits.map((b) => (
                  <span
                    key={b}
                    className="rounded-full border border-brand/20 bg-white/80 px-3 py-1 text-[12px] font-medium text-foreground/70"
                  >
                    {b}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── PICK RASHI ─────────────────────────────────────────────── */}
        {step === "pick" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <button
              id={`${idPrefix}-back-to-intro-btn`}
              type="button"
              onClick={() => setStep("intro")}
              className="mb-5 flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft size={16} /> Back
            </button>

            <div className="rounded-3xl bg-white px-5 py-6 shadow-lg">
              <h2 className="font-heading text-[1.3rem] font-black text-foreground">
                {copy.pickTitle}
              </h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                {copy.pickSub}
              </p>

              <div className="mt-5 grid grid-cols-3 gap-2.5">
                {RASHI_DHATU.map((r) => (
                  <button
                    id={`${idPrefix}-rashi-${r.id}-btn`}
                    key={r.id}
                    type="button"
                    onClick={() => selectRashi(r.id)}
                    className={cn(
                      "group flex flex-col items-center rounded-2xl border bg-card px-2 py-4 transition-all active:scale-[0.96]",
                      selectedId === r.id
                        ? "border-brand/40 bg-brand/5 shadow-sm"
                        : "border-border/60 hover:border-brand/30 hover:shadow-sm"
                    )}
                  >
                    <div className="pointer-events-none relative size-14">
                      <Image
                        src={RASHI_IMG[r.id] ?? "/zodiac/mesh.webp"}
                        alt={r.nameHi}
                        fill
                        className="object-contain"
                        sizes="56px"
                      />
                    </div>
                    <p className="pointer-events-none mt-2 text-center text-[11px] font-bold leading-tight text-foreground">
                      {r.nameHi}
                      <br />
                      <span className="font-medium text-muted-foreground">({r.nameEn})</span>
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── RESULT ─────────────────────────────────────────────────── */}
        {step === "result" && row && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <style>{`
              @keyframes vg-kundli-exact-shimmer {
                0%   { transform: translateX(-140%) skewX(-18deg); }
                100% { transform: translateX(260%) skewX(-18deg); }
              }
              @keyframes vg-kundli-cta-glow {
                0%, 100% { box-shadow: 0 0 0 0 rgba(251,191,36,0.35), 0 10px 32px -10px rgba(180,83,9,0.55); }
                50%      { box-shadow: 0 0 0 6px rgba(251,191,36,0.12), 0 14px 40px -8px rgba(245,158,11,0.5); }
              }
            `}</style>
            <button
              id={`${idPrefix}-change-rashi-btn`}
              type="button"
              onClick={() => setStep("pick")}
              className="mb-5 flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft size={16} /> Rashi badlein
            </button>

            <div className="rounded-3xl bg-white px-6 py-7 shadow-lg">
              {/* Rashi identity */}
              <div className="flex items-center gap-4">
                <div className="relative size-16 shrink-0">
                  <Image
                    src={RASHI_IMG[row.id] ?? "/zodiac/mesh.webp"}
                    alt={row.nameHi}
                    fill
                    className="object-contain"
                    sizes="64px"
                  />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-brand">
                    Aapki Rashi
                  </p>
                  <p className="font-heading text-xl font-black text-foreground">{row.nameHi}</p>
                  <p className="text-[13px] text-muted-foreground">{row.nameEn}</p>
                </div>
              </div>

              {/* Divider */}
              <div className="my-5 h-px bg-border/50" />

              {/* Recommended metal */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Recommended dhatu
                </p>
                <p className="font-heading mt-1 text-2xl font-black text-brand">{row.dhatuHi}</p>
              </div>

              <div className="mt-4 rounded-2xl bg-amber-50/80 border border-amber-200/60 px-4 py-3.5">
                <p className="text-[14px] font-semibold leading-relaxed text-foreground">
                  {row.kadaLine}
                </p>
              </div>

              <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">{row.why}</p>

            </div>

            {variant === "astro" && (
              <>
                {/* ── Very Important video section (V2 only) ───────────── */}
                <div className="relative mt-4 overflow-hidden rounded-3xl border-2 border-red-500/80 bg-gradient-to-br from-red-950 via-red-900 to-red-800 px-3 py-3.5 shadow-[0_20px_48px_-20px_rgba(127,29,29,0.7)] sm:px-4 sm:py-4">
                  <div
                    className="pointer-events-none absolute -left-12 -top-16 size-40 rounded-full bg-red-300/20 blur-3xl"
                    aria-hidden
                  />
                  <div
                    className="pointer-events-none absolute -bottom-12 -right-10 size-36 rounded-full bg-orange-300/20 blur-3xl"
                    aria-hidden
                  />

                  <div className="relative flex items-center gap-2 border-b border-red-200/25 pb-2.5">
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/80" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
                    </span>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-red-50">
                      Very Important
                    </p>
                  </div>

                  <p className="relative mt-2 text-center text-[11px] font-semibold text-red-100/95">
                    Aage continue karne se pehle yeh zaroor dekhein
                  </p>

                  <div className="relative mt-2.5 overflow-hidden rounded-2xl border-2 border-red-200/45 bg-black shadow-2xl -mx-3 sm:-mx-4">
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <iframe
                        src={KUNDAL_DHATU_IMPORTANT_VIDEO_URL}
                        title="Very important kundal dhatu video"
                        className="absolute left-1/2 top-1/2 h-[108%] w-[108%] -translate-x-1/2 -translate-y-1/2"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                        allowFullScreen
                        loading="lazy"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── CTA 1 — Premium dark panel + animated primary CTA ───── */}
            <div className="relative mt-5 overflow-hidden rounded-3xl border-2 border-amber-500/45 bg-gradient-to-br from-stone-950 via-amber-950 to-stone-950 px-6 py-7 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.45),0_0_0_1px_rgba(251,191,36,0.15)_inset]">
              {/* soft gold vignette */}
              <div
                className="pointer-events-none absolute -right-16 -top-20 size-48 rounded-full bg-amber-400/15 blur-3xl"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute -bottom-12 -left-10 size-40 rounded-full bg-orange-500/10 blur-3xl"
                aria-hidden
              />

              <p className="relative text-[12px] font-semibold uppercase tracking-wide text-amber-200/85">
                {copy.resultNextStepLabel}
              </p>
              <p className="relative mt-1 text-[13px] font-medium leading-snug text-amber-100/90">
                {copy.resultLead}
              </p>
              <p className="font-heading relative mt-1 text-[1.15rem] font-black leading-snug text-white">
                {copy.resultTitle}
              </p>

              <Link
                id={`${idPrefix}-primary-kundli-cta`}
                href={freeKundliHref}
                className="relative mt-5 flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-[13px] font-extrabold text-white transition-transform active:scale-[0.98] sm:text-[14px] [&>*]:pointer-events-none"
                style={{
                  animation: "vg-kundli-cta-glow 2.8s ease-in-out infinite",
                }}
              >
                <span
                  className="pointer-events-none absolute inset-0 -translate-x-full animate-[vg-kundli-exact-shimmer_2.2s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/35 to-transparent"
                  aria-hidden
                />
                <span className="relative flex items-center gap-2 drop-shadow-sm">
                  {copy.resultPrimaryCta}
                  <ArrowRight className="size-4" strokeWidth={2.5} />
                </span>
              </Link>

              <p className="relative mt-4 text-center text-[12px] leading-relaxed text-amber-100/75">
                {copy.resultPrimarySub}
              </p>
            </div>

            {/* ── Why full kundli matters ─────────────────────────────── */}
            <div className="mt-4 rounded-3xl bg-white px-6 py-6 shadow-lg">
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-brand">
                <Sparkles className="size-3.5" />
                Kyun zaroori hai poori kundli dekhna?
              </p>
              <ul className="mt-4 space-y-3">
                {[
                  "Rashi sirf ek part hota hai — baaki picture incomplete rehti hai",
                  "Real effect Lagna aur grahon ki position se aata hai",
                  "Same rashi wale logon ka result alag hota hai",
                ].map((point) => (
                  <li key={point} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-brand/10 text-[10px] font-black text-brand">
                      ✓
                    </span>
                    <p className="text-[13px] leading-relaxed text-foreground">{point}</p>
                  </li>
                ))}
              </ul>
            </div>

            {/* ── CTA 2 — Gold / champagne panel (second highlight) ──── */}
            <div className="relative mt-4 overflow-hidden rounded-3xl border-2 border-amber-300/70 bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-100/90 px-6 py-7 shadow-[0_16px_40px_-18px_rgba(180,83,9,0.35)]">
              <div
                className="pointer-events-none absolute right-0 top-0 size-32 translate-x-1/4 -translate-y-1/4 rounded-full bg-amber-300/30 blur-2xl"
                aria-hidden
              />

              <p className="relative text-[13px] leading-snug text-amber-900/75">
                {copy.resultSecondaryLead}
              </p>
              <p className="relative mt-1 text-[14px] font-bold leading-relaxed text-stone-900">
                {copy.resultSecondaryStrong}
              </p>
              <Link
                id={`${idPrefix}-secondary-kundli-cta`}
                href={freeKundliHref}
                className="relative mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-brand to-orange-600 text-[14px] font-extrabold text-white shadow-[0_6px_20px_-6px_rgba(180,83,9,0.55)] hover:from-brand-hover hover:to-orange-600 [&>*]:pointer-events-none"
              >
                <span className="flex items-center justify-center gap-2">
                  {copy.resultSecondaryCta}
                  <ArrowRight className="size-4" />
                </span>
              </Link>
              <p className="relative mt-2 text-center text-[11px] font-medium text-amber-900/60">
                {copy.resultSecondaryFootnote}
              </p>
            </div>

            <p className="mt-4 text-center text-sm">
              <Link
                id={`${idPrefix}-all-tools-link`}
                href="/tools"
                className="font-medium text-brand hover:underline"
              >
                ← Sab tools
              </Link>
            </p>
          </div>
        )}
      </div>

      {/* ── Sticky bar — visible after result ─────────────────────────── */}
      {step === "result" && (
        <>
          {/* spacer so content isn't hidden behind sticky bar */}
          <div className="h-20" aria-hidden />

          <div className="fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom,0px)]">
            <style>{`
              @keyframes vg-dhatu-shimmer {
                0%   { transform: translateX(-140%) skewX(-16deg); }
                100% { transform: translateX(280%) skewX(-16deg); }
              }
            `}</style>

            {/* blurred backdrop strip */}
            <div className="border-t border-white/30 bg-white/80 px-4 py-3 shadow-[0_-8px_32px_-6px_rgba(0,0,0,0.15)] backdrop-blur-xl">
              <div className="mx-auto flex max-w-sm items-center gap-3">
                {/* left copy */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-extrabold leading-tight text-foreground">
                    {copy.stickyTitle}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                    <Zap size={10} className="text-brand" />
                    {copy.stickySub}
                  </p>
                </div>

                {/* CTA button */}
                <Link
                  id={`${idPrefix}-sticky-kundli-cta`}
                  href={freeKundliHref}
                  className="relative shrink-0 overflow-hidden rounded-2xl bg-brand px-5 py-2.5 shadow-[0_4px_18px_-4px_rgba(180,83,9,0.55)] transition-transform active:scale-95 [&>*]:pointer-events-none"
                >
                  {/* shimmer */}
                  <span
                    className="pointer-events-none absolute inset-0 -translate-x-full animate-[vg-dhatu-shimmer_2.4s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/25 to-transparent"
                    aria-hidden
                  />
                  <span className="relative flex items-center gap-1.5 text-[13px] font-extrabold text-white">
                    {copy.stickyCta}
                    <ArrowRight size={13} />
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
