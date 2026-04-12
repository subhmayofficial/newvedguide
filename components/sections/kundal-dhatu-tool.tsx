"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, Sparkles, Zap } from "lucide-react";
import { RASHI_DHATU } from "@/lib/kundal-dhatu";
import { Button } from "@/components/ui/button";
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

export function KundalDhatuTool() {
  const [step, setStep] = useState<Step>("intro");
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
      style={{ background: "linear-gradient(160deg, #fef9e7 0%, #fdf3d0 100%)" }}
    >
      <div className="mx-auto max-w-sm">

        {/* ─── INTRO ──────────────────────────────────────────────────── */}
        {step === "intro" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="rounded-3xl bg-white px-7 py-8 shadow-lg">
              <h1 className="font-heading text-[1.55rem] font-black leading-snug text-foreground">
                Apna sahi kundal metal jaanen
              </h1>
              <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
                Right ear mein Gold, Silver ya Copper — rashi ke hisaab se sahi dhatu pehenne se
                energy balance hoti hai. Yeh quick guide se aap apni rashi ka metal jaan sakte ho.
              </p>
              <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
                Kundal metal ke fayde: positive energy, mental clarity, aur grah alignment.
              </p>
              <button
                id="kundal-dhatu-start-btn"
                type="button"
                onClick={() => setStep("pick")}
                className="mt-6 w-full rounded-2xl bg-brand py-3.5 text-center text-[15px] font-extrabold text-white shadow-[0_4px_16px_-4px_rgba(180,83,9,0.45)] transition-all active:scale-[0.98] hover:bg-brand-hover"
              >
                Start Now
              </button>
              <p className="mt-3 text-center text-[12px] text-muted-foreground">
                1 minute &nbsp;•&nbsp; Free &nbsp;•&nbsp; No signup
              </p>
            </div>

            <div className="mt-8 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand/70">
                Kundal metal benefits
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {["Energy balance", "Mental clarity", "Grah alignment", "Right ear specific"].map((b) => (
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
              id="kundal-dhatu-back-to-intro-btn"
              type="button"
              onClick={() => setStep("intro")}
              className="mb-5 flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft size={16} /> Back
            </button>

            <div className="rounded-3xl bg-white px-5 py-6 shadow-lg">
              <h2 className="font-heading text-[1.3rem] font-black text-foreground">
                Apni Rashi Select Karo
              </h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                Neeche se apni janam rashi choose karein — aapko right ear metal ka suggestion milega.
              </p>

              <div className="mt-5 grid grid-cols-3 gap-2.5">
                {RASHI_DHATU.map((r) => (
                  <button
                    id={`kundal-dhatu-rashi-${r.id}-btn`}
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
                    <div className="relative size-14">
                      <Image
                        src={RASHI_IMG[r.id] ?? "/zodiac/mesh.webp"}
                        alt={r.nameHi}
                        fill
                        className="object-contain"
                        sizes="56px"
                      />
                    </div>
                    <p className="mt-2 text-center text-[11px] font-bold leading-tight text-foreground">
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
              id="kundal-dhatu-change-rashi-btn"
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

              {/* Note */}
              <div className="mt-4 rounded-xl border border-border/50 bg-muted/20 px-3 py-2.5">
                <p className="text-[12px] leading-relaxed text-muted-foreground">
                  <span className="font-bold text-foreground">Note: </span>
                  {row.note}
                </p>
              </div>
            </div>

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
                Next step
              </p>
              <p className="relative mt-1 text-[13px] font-medium leading-snug text-amber-100/90">
                Yeh sirf Rashi ke basis par hai —
              </p>
              <p className="font-heading relative mt-1 text-[1.15rem] font-black leading-snug text-white">
                Aapki poori kundli kya kehti hai?
              </p>

              <Link
                id="kundal-dhatu-primary-kundli-cta"
                href="/free-kundli"
                className="relative mt-5 flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-[13px] font-extrabold text-white transition-transform active:scale-[0.98] sm:text-[14px]"
                style={{
                  animation: "vg-kundli-cta-glow 2.8s ease-in-out infinite",
                }}
              >
                <span
                  className="pointer-events-none absolute inset-0 -translate-x-full animate-[vg-kundli-exact-shimmer_2.2s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/35 to-transparent"
                  aria-hidden
                />
                <span className="relative flex items-center gap-2 drop-shadow-sm">
                  Apni exact Kundli check karein (Free)
                  <ArrowRight className="size-4" strokeWidth={2.5} />
                </span>
              </Link>

              <p className="relative mt-4 text-center text-[12px] leading-relaxed text-amber-100/75">
                Moon sign, Lagna aur nakshatra ke hisaab se aapka sahi dhatu aur bhi clear hota hai
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
                Abhi jo result aapne dekha — wo sirf ek part hai
              </p>
              <p className="relative mt-1 text-[14px] font-bold leading-relaxed text-stone-900">
                Aapki poori kundli mein aur bhi important signals hote hain jo decisions ko affect
                karte hain
              </p>
              <Button
                id="kundal-dhatu-secondary-kundli-cta"
                className="relative mt-4 h-11 w-full border-0 bg-gradient-to-r from-brand to-orange-600 text-[14px] font-extrabold text-white shadow-[0_6px_20px_-6px_rgba(180,83,9,0.55)] hover:from-brand-hover hover:to-orange-600"
                render={<Link href="/free-kundli" />}
              >
                <span className="flex items-center justify-center gap-2">
                  Meri poori Kundli dekho (Free)
                  <ArrowRight className="size-4" />
                </span>
              </Button>
              <p className="relative mt-2 text-center text-[11px] font-medium text-amber-900/60">
                Free · 1 minute · No signup
              </p>
            </div>

            <p className="mt-4 text-center text-sm">
              <Link
                id="kundal-dhatu-all-tools-link"
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
                    Apni poori Kundli jaano 🔮
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                    <Zap size={10} className="text-brand" />
                    Lagna · Moon sign · Nakshatra — sab free
                  </p>
                </div>

                {/* CTA button */}
                <Link
                  id="kundal-dhatu-sticky-kundli-cta"
                  href="/free-kundli"
                  className="relative shrink-0 overflow-hidden rounded-2xl bg-brand px-5 py-2.5 shadow-[0_4px_18px_-4px_rgba(180,83,9,0.55)] transition-transform active:scale-95"
                >
                  {/* shimmer */}
                  <span
                    className="pointer-events-none absolute inset-0 -translate-x-full animate-[vg-dhatu-shimmer_2.4s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/25 to-transparent"
                    aria-hidden
                  />
                  <span className="relative flex items-center gap-1.5 text-[13px] font-extrabold text-white">
                    Check karein
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
