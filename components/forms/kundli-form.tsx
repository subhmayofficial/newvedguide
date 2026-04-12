"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics/events";
import { getOrCreateSessionId } from "@/lib/analytics/session";
import {
  User, Calendar, Clock, MapPin,
  ChevronRight, ChevronLeft, Sparkles, Check,
} from "lucide-react";

interface FormData {
  fullName: string;
  gender: "male" | "female" | "";
  dob: string;
  tob: string;
  tobUnknown: boolean;
  pob: string;
}

const EMPTY: FormData = {
  fullName: "",
  gender: "",
  dob: "",
  tob: "",
  tobUnknown: false,
  pob: "",
};

type StepNum = 1 | 2 | 3 | 4 | 5;

const STEPS = [
  {
    step: 1 as StepNum,
    icon: User,
    emoji: "🙏",
    question: "Pehle, aapka naam?",
    sub: "Aapki Kundli sirf aapke liye banegi — 100% personalized.",
    fact: null,
    field: "fullName" as keyof FormData,
  },
  {
    step: 2 as StepNum,
    icon: User,
    emoji: "✨",
    question: "Aap kaun hain?",
    sub: "Yeh aapke kundli ke analysis mein madad karta hai.",
    fact: "💡 Gender se aapke chart ki interpretation zyada accurate hoti hai.",
    field: "gender" as keyof FormData,
  },
  {
    step: 3 as StepNum,
    icon: Calendar,
    emoji: "🌟",
    question: "Aapka Date of Birth",
    sub: "Aapki exact birth date se aapke planetary positions aur Rashi decide hoti hai.",
    fact: "✨ Har janm ki date ek unique cosmic signature carry karti hai.",
    field: "dob" as keyof FormData,
  },
  {
    step: 4 as StepNum,
    icon: Clock,
    emoji: "⏰",
    question: "Aur janm ka waqt?",
    sub: "Birth time se aapka Lagna decide hota hai — kundli ka sabse personal hissa.",
    fact: "💡 Agar exact time nahi pata, approximate bhi chalega.",
    field: "tob" as keyof FormData,
  },
  {
    step: 5 as StepNum,
    icon: MapPin,
    emoji: "📍",
    question: "Janm ki jagah?",
    sub: "Sirf city aur state kaafi hai. Isse aapka rising sign set hoga.",
    fact: null,
    field: "pob" as keyof FormData,
  },
] as const;

/** First word of full name for friendly copy on steps 2+ */
function firstNameFrom(fullName: string): string {
  const t = fullName.trim();
  if (t.length < 2) return "";
  return t.split(/\s+/)[0] ?? "";
}

function getPersonalizedCopy(
  step: StepNum,
  fullName: string
): { question: string; sub: string } {
  const base = STEPS[step - 1];
  const fn = firstNameFrom(fullName);
  if (step === 1 || !fn) {
    return { question: base.question, sub: base.sub };
  }
  switch (step) {
    case 2:
      return {
        question: `${fn}, aap kaun hain?`,
        sub: `${fn}, yeh aapke kundli ke analysis mein madad karta hai.`,
      };
    case 3:
      return {
        question: `${fn}, aapka Date of Birth kya hai?`,
        sub: `${fn}, aapki exact birth date se aapke planetary positions aur Rashi decide hoti hai.`,
      };
    case 4:
      return {
        question: `${fn}, aapka janm ka waqt?`,
        sub: `${fn}, birth time se aapka Lagna decide hota hai — kundli ka sabse personal hissa.`,
      };
    case 5:
      return {
        question: `${fn}, janm ki jagah?`,
        sub: `${fn}, sirf city aur state kaafi hai. Isse aapka rising sign set hoga.`,
      };
    default:
      return { question: base.question, sub: base.sub };
  }
}

// ─── Processing screen ────────────────────────────────────────────────────────

const PROCESSING_STEPS = [
  { label: "Birth data processed", delay: 600 },
  { label: "Planetary positions calculated", delay: 1400 },
  { label: "Life pattern analysis", delay: 2400 },
  { label: "Final insights preparing", delay: 3400 },
];

function ProcessingScreen() {
  const [done, setDone] = useState<number[]>([]);

  useEffect(() => {
    PROCESSING_STEPS.forEach((s, i) => {
      const t = setTimeout(() => setDone((prev) => [...prev, i]), s.delay);
      return () => clearTimeout(t);
    });
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-4 text-center md:py-6">
      {/* Spinner / glow */}
      <div className="relative mb-5 md:mb-8">
        <div className="h-16 w-16 rounded-full border-[3px] border-brand/20 border-t-brand animate-spin md:h-20 md:w-20 md:border-4" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl md:text-2xl">🔮</span>
        </div>
      </div>

      <h2 className="font-heading text-xl font-bold text-foreground md:text-2xl mb-0.5 md:mb-1">
        Aapki Kundli Generate Ho Rahi Hai…
      </h2>
      <p className="text-xs text-muted-foreground mb-5 md:mb-8 md:text-sm">
        Thoda ruk jaiye — stars align ho rahe hain
      </p>

      {/* Checklist */}
      <div className="w-full max-w-xs space-y-2 md:space-y-3 text-left">
        {PROCESSING_STEPS.map((s, i) => {
          const isDone = done.includes(i);
          return (
            <div
              key={s.label}
              className={cn(
                "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 transition-all duration-500 md:gap-3 md:rounded-xl md:px-4 md:py-3",
                isDone
                  ? "border-brand/30 bg-brand-light/40 text-foreground"
                  : "border-border/50 bg-background/60 text-muted-foreground"
              )}
            >
              <div
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all duration-300",
                  isDone ? "bg-brand text-white" : "border-2 border-border"
                )}
              >
                {isDone ? (
                  <Check size={11} strokeWidth={3} />
                ) : (
                  <div className="h-1.5 w-1.5 rounded-full bg-border animate-pulse" />
                )}
              </div>
              <span className="text-xs font-medium md:text-sm">{s.label}</span>
            </div>
          );
        })}
      </div>

      <p className="mt-5 text-[11px] text-muted-foreground md:mt-8 md:text-xs">
        🔒 Aapka data safe hai — kabhi share nahi hoga
      </p>
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ current }: { current: number }) {
  /* Single stable classNames (no sm/md split on wrappers) to avoid hydration mismatches */
  return (
    <div className="mb-8">
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-semibold text-brand">Step {current} of 5</span>
        <span className="text-muted-foreground">{current * 20}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-brand transition-all duration-500 ease-out"
          style={{ width: `${current * 20}%` }}
        />
      </div>
      <div className="mt-3 flex justify-between px-0.5">
        {STEPS.map((s) => (
          <div
            key={s.step}
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-all duration-300",
              s.step < current
                ? "bg-brand text-white"
                : s.step === current
                ? "bg-brand text-white ring-[3px] ring-brand/25"
                : "bg-border/80 text-muted-foreground"
            )}
          >
            {s.step < current ? "✓" : s.step}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Fade-in wrapper ──────────────────────────────────────────────────────────

function StepFade({ children, stepKey }: { children: React.ReactNode; stepKey: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 40);
    return () => clearTimeout(t);
  }, [stepKey]);

  return (
    <div
      className={cn(
        "transition-all duration-300",
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      )}
    >
      {children}
    </div>
  );
}

// ─── Gender toggle ────────────────────────────────────────────────────────────

function GenderToggle({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: "male" | "female") => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {(["male", "female"] as const).map((g) => (
        <button
          id={`free-kundli-gender-${g}-btn`}
          key={g}
          type="button"
          onClick={() => onChange(g)}
          className={cn(
            "flex h-14 flex-col items-center justify-center gap-0.5 rounded-xl border-2 text-sm font-semibold transition-all duration-200 md:h-16 md:gap-1",
            value === g
              ? "border-brand bg-brand-light/60 text-brand"
              : "border-border bg-background text-muted-foreground hover:border-brand/40 hover:text-foreground"
          )}
        >
          <span className="text-xl">{g === "male" ? "👨" : "👩"}</span>
          <span>{g === "male" ? "Male" : "Female"}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────

export function KundliForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const source = searchParams.get("source") ?? "free_kundli_page";
  const utmSource = searchParams.get("utm_source") ?? undefined;
  const utmMedium = searchParams.get("utm_medium") ?? undefined;
  const utmCampaign = searchParams.get("utm_campaign") ?? undefined;

  const [step, setStep] = useState<StepNum>(1);
  const [data, setData] = useState<FormData>(EMPTY);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<"form" | "processing">("form");
  const inputRef = useRef<HTMLInputElement>(null);

  const currentStep = STEPS[step - 1];
  const fn = firstNameFrom(data.fullName);
  const { question: displayQuestion, sub: displaySub } = getPersonalizedCopy(step, data.fullName);

  useEffect(() => {
    if (phase !== "form") return;
    const t = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, [step, phase]);

  const set = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
    setError("");
  }, []);

  function validate(): string | null {
    switch (step) {
      case 1:
        if (data.fullName.trim().length < 2) return "Apna poora naam daalen";
        return null;
      case 2:
        // Gender is optional — allow skipping
        return null;
      case 3:
        if (!data.dob) return "Apni date of birth select karein";
        if (new Date(data.dob) >= new Date()) return "Date of birth past mein honi chahiye";
        return null;
      case 4:
        if (!data.tobUnknown && !data.tob) return "Birth time daalen ya 'pata nahi' select karein";
        return null;
      case 5:
        if (data.pob.trim().length < 2) return "Apna janm sheher daalen";
        return null;
    }
  }

  async function handleNext() {
    const err = validate();
    if (err) { setError(err); return; }

    if (step === 1) track.freeKundliFormStarted(source);
    track.freeKundliStepCompleted(step, displayQuestion);

    if (step < 5) {
      setStep((s) => (s + 1) as StepNum);
    } else {
      await handleSubmit();
    }
  }

  function handleBack() {
    setError("");
    setStep((s) => Math.max(1, s - 1) as StepNum);
  }

  async function handleSubmit() {
    setPhase("processing");

    try {
      const effectiveTob = data.tobUnknown ? "12:00" : data.tob;

      const res = await fetch("/api/kundli/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: data.fullName,
          gender: data.gender || undefined,
          dob: data.dob,
          tob: effectiveTob,
          pob: data.pob,
          source,
          utmSource,
          utmMedium,
          utmCampaign,
          sessionId: getOrCreateSessionId(),
          referrer: typeof document !== "undefined" ? document.referrer : undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed");
      const json = await res.json();

      track.freeKundliSubmitted(source, false);

      sessionStorage.setItem(
        "kundli_result",
        JSON.stringify({
          submissionId: json.submissionId,
          result: json.result,
          name: data.fullName,
          gender: data.gender,
          dob: data.dob,
          tob: effectiveTob,
          pob: data.pob,
        })
      );

      // Let processing animation finish (min 4s total)
      await new Promise((r) => setTimeout(r, 4200));
      router.push("/free-kundli/result");
    } catch {
      setPhase("form");
      setError("Kuch problem aayi. Dobara try karein.");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && step !== 2) { e.preventDefault(); handleNext(); }
  }

  if (phase === "processing") {
    return <ProcessingScreen />;
  }

  const Icon = currentStep.icon;

  return (
    <div onKeyDown={handleKeyDown}>
      <ProgressBar current={step} />

      <StepFade stepKey={step}>
        {/* Step header */}
        <div className="mb-4 md:mb-6">
          <div className="mb-2 flex items-center gap-2 md:mb-3 md:gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-light md:h-9 md:w-9">
              <Icon size={16} className="text-brand" />
            </div>
            <span className="text-lg md:text-xl">{currentStep.emoji}</span>
          </div>
          <h2 className="font-heading text-xl font-bold leading-tight text-foreground md:text-3xl">
            {displayQuestion}
          </h2>
          <p className="mt-1 max-md:line-clamp-2 text-xs leading-snug text-muted-foreground md:mt-1.5 md:line-clamp-none md:text-sm">
            {displaySub}
          </p>
        </div>

        {/* Inputs */}
        <div className="space-y-2.5">
          {step === 1 && (
            <Input
              id="free-kundli-full-name-input"
              ref={inputRef}
              placeholder="e.g. Rahul Sharma"
              value={data.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              className="h-13 rounded-xl text-base"
            />
          )}

          {step === 2 && (
            <GenderToggle
              value={data.gender}
              onChange={(v) => set("gender", v)}
            />
          )}

          {step === 3 && (
            <Input
              id="free-kundli-dob-input"
              ref={inputRef}
              type="date"
              value={data.dob}
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) => set("dob", e.target.value)}
              className="h-13 rounded-xl text-base"
            />
          )}

          {step === 4 && (
            <div className="space-y-3">
              <Input
                id="free-kundli-tob-input"
                ref={inputRef}
                type="time"
                value={data.tob}
                disabled={data.tobUnknown}
                onChange={(e) => set("tob", e.target.value)}
                className={cn(
                  "h-13 rounded-xl text-base transition-opacity",
                  data.tobUnknown && "opacity-40 cursor-not-allowed"
                )}
              />
              <button
                id="free-kundli-tob-unknown-btn"
                type="button"
                onClick={() => {
                  set("tobUnknown", !data.tobUnknown);
                  if (!data.tobUnknown) set("tob", "");
                  setError("");
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all duration-200",
                  data.tobUnknown
                    ? "border-brand bg-brand-light/60 text-brand"
                    : "border-border text-muted-foreground hover:border-brand/40 hover:text-foreground"
                )}
              >
                <div
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-all",
                    data.tobUnknown ? "border-brand bg-brand" : "border-border"
                  )}
                >
                  {data.tobUnknown && <Check size={10} strokeWidth={3} className="text-white" />}
                </div>
                Mujhe exact birth time pata nahi
              </button>
            </div>
          )}

          {step === 5 && (
            <Input
              id="free-kundli-pob-input"
              ref={inputRef}
              placeholder="e.g. Mumbai, Maharashtra"
              value={data.pob}
              onChange={(e) => set("pob", e.target.value)}
              className="h-13 rounded-xl text-base"
            />
          )}
        </div>

        {/* Fact — desktop only to keep mobile step in one fold */}
        {currentStep.fact && !error && (
          <p className="mt-3 hidden text-xs text-muted-foreground md:block">{currentStep.fact}</p>
        )}

        {/* Error */}
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        {/* Navigation */}
        <div className="mt-5 flex items-center gap-2.5 md:mt-8 md:gap-3">
          {step > 1 && (
            <button
              id={`free-kundli-back-step-${step}-btn`}
              onClick={handleBack}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground hover:border-brand hover:text-brand transition-colors md:h-12 md:w-12"
            >
              <ChevronLeft size={18} />
            </button>
          )}

          <button
            id={step === 5 ? "free-kundli-submit-btn" : `free-kundli-next-step-${step}-btn`}
            onClick={handleNext}
            className={cn(
              "flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl py-3 text-[15px] font-semibold text-white transition-all duration-200 md:min-h-13 md:text-base [&>*]:pointer-events-none",
              "bg-brand hover:bg-brand-hover active:scale-[0.98]"
            )}
          >
            {step === 5 ? (
              <>
                <Sparkles size={17} />
                <span>Check My Kundli</span>
              </>
            ) : step === 2 && !data.gender ? (
              <>
                <span>Skip</span>
                <ChevronRight size={17} />
              </>
            ) : (
              <>
                <span>Continue</span>
                <ChevronRight size={17} />
              </>
            )}
          </button>
        </div>

        <p className="mt-2 text-center text-[11px] text-muted-foreground md:mt-3 md:text-xs">
          {step === 1
            ? "No account needed — 100% free"
            : step === 5
            ? fn
              ? `Last step — ${fn}, aapki Kundli almost ready hai ✨`
              : "Last step — aapki Kundli almost ready hai ✨"
            : fn
              ? `${fn}, ${5 - step} aur step${5 - step > 1 ? "s" : ""} baaki hain`
              : `${5 - step} aur step${5 - step > 1 ? "s" : ""} baaki hain`}
        </p>
      </StepFade>
    </div>
  );
}
