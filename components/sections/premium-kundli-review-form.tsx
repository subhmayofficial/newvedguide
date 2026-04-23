"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// 7 steps total — natural (non-round) progress per step
const STEP_PROGRESS = [9, 23, 37, 52, 67, 79, 91] as const;
const TOTAL_STEPS = STEP_PROGRESS.length;

type FormState = {
  rating: number;
  mostUsefulPart: string;
  personalizationFeedback: string;
  clarityFeedback: string;
  improvementFeedback: string;
  writtenReview: string;
  name: string;
  phone: string;
};

const INITIAL_STATE: FormState = {
  rating: 0,
  mostUsefulPart: "",
  personalizationFeedback: "",
  clarityFeedback: "",
  improvementFeedback: "",
  writtenReview: "",
  name: "",
  phone: "",
};

const MOST_USEFUL_OPTIONS = [
  "Career guidance",
  "Relationship insights",
  "Finance guidance",
  "Personality understanding",
  "Remedies / suggestions",
  "Overall clarity",
  "Other",
];

const PERSONALIZATION_OPTIONS = [
  "Bilkul personalized lagi",
  "Kaafi had tak personalized lagi",
  "Thodi generic lagi",
  "Zyada generic lagi",
];

const CLARITY_OPTIONS = [
  "Bahut clear",
  "Kaafi clear",
  "Thodi clear",
  "Confusing lagi",
];

const IMPROVEMENT_OPTIONS = [
  "Zyada depth chahiye thi",
  "Language aur simple ho sakti thi",
  "Zyada specific timing chahiye thi",
  "Remedies aur practical ho sakte the",
  "Report aur short honi chahiye thi",
  "Report aur detailed honi chahiye thi",
  "Sab theek tha",
  "Other",
];

function ProgressBar({ step }: { step: number }) {
  const pct = STEP_PROGRESS[step] ?? 100;
  return (
    <div className="mb-7">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-border/60">
        <div
          className="h-full rounded-full bg-brand transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1.5 text-right text-[11px] text-muted-foreground">{pct}%</p>
    </div>
  );
}

function StarRating({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="rounded-2xl border border-border bg-background/70 p-5">
      <p className="mb-1 text-sm font-semibold text-foreground">
        Aap apne overall experience ko kaise rate karenge?
      </p>
      <p className="mb-4 text-xs text-muted-foreground">
        Aapki rating humein report quality aur overall experience ko aur behtar banane mein madad
        karti hai.
      </p>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            aria-label={`${star} star`}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg active:scale-95"
          >
            <Star
              className={cn(
                "size-8 transition-colors",
                star <= (hovered || value)
                  ? "fill-amber-400 text-amber-500"
                  : "text-muted-foreground/40",
              )}
            />
          </button>
        ))}
        {value > 0 ? (
          <span className="ml-2 text-sm font-semibold text-muted-foreground">{value}/5</span>
        ) : null}
      </div>
    </div>
  );
}

function SingleSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-foreground">{label}</p>
      <div className="flex flex-col gap-2.5">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={cn(
              "min-h-[48px] w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors active:scale-[0.99]",
              value === opt
                ? "border-brand bg-brand-light/40 font-semibold text-brand shadow-sm"
                : "border-border bg-background/60 text-foreground active:bg-brand-light/20",
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export function PremiumKundliReviewForm() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const set = <K extends keyof FormState>(key: K) =>
    (value: FormState[K]) => setForm((p) => ({ ...p, [key]: value }));

  const canGoNext = useMemo(() => {
    if (step === 0) return form.rating > 0;
    if (step === 1) return form.mostUsefulPart !== "";
    if (step === 2) return form.personalizationFeedback !== "";
    if (step === 3) return form.clarityFeedback !== "";
    if (step === 4) return form.improvementFeedback !== "";
    if (step === 5) return true; // written review is optional
    return form.name.trim().length > 0;
  }, [form, step]);

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews/premium-kundli", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed to submit review");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit review");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-3xl border border-emerald-300/50 bg-emerald-50/80 p-10 text-center shadow-sm">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-white shadow-sm">
          <CheckCircle2 className="size-9 text-emerald-600" />
        </div>
        <h2 className="font-heading text-2xl font-bold text-foreground">Dhanyavaad 🙏</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          Aapka feedback share karne ke liye dhanyavaad. Aapke review se humein apni premium kundli
          report aur overall experience ko behtar banane mein madad milegi.
        </p>
      </div>
    );
  }

  const reviewHint =
    form.rating >= 4
      ? "Agar aap chahein, toh apna review bhi likh sakte hain."
      : "Aapka detailed feedback humein aur behtar banne mein madad karega.";

  return (
    <div className="rounded-3xl border border-border/60 bg-card/95 p-4 shadow-[0_25px_80px_-35px_rgba(120,53,15,0.55)] backdrop-blur sm:p-5 md:p-7">
      <ProgressBar step={step} />

      {step === 0 && (
        <StarRating value={form.rating} onChange={set("rating")} />
      )}

      {step === 1 && (
        <SingleSelect
          label="Report ka sabse useful hissa kya laga?"
          options={MOST_USEFUL_OPTIONS}
          value={form.mostUsefulPart}
          onChange={set("mostUsefulPart")}
        />
      )}

      {step === 2 && (
        <SingleSelect
          label="Kya report aapko personalized lagi?"
          options={PERSONALIZATION_OPTIONS}
          value={form.personalizationFeedback}
          onChange={set("personalizationFeedback")}
        />
      )}

      {step === 3 && (
        <SingleSelect
          label="Report padhkar aapko kitni clarity mili?"
          options={CLARITY_OPTIONS}
          value={form.clarityFeedback}
          onChange={set("clarityFeedback")}
        />
      )}

      {step === 4 && (
        <SingleSelect
          label="Kaunsi cheez aur behtar ho sakti thi?"
          options={IMPROVEMENT_OPTIONS}
          value={form.improvementFeedback}
          onChange={set("improvementFeedback")}
        />
      )}

      {step === 5 && (
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">{reviewHint}</p>
          <Label htmlFor="writtenReview" className="text-sm font-semibold text-foreground">
            Agar aap chahein, toh apna chhota sa review likhein{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id="writtenReview"
            value={form.writtenReview}
            onChange={(e) => set("writtenReview")(e.target.value)}
            placeholder="Jaise report me kya useful laga, kis cheez me clarity mili, ya overall experience kaisa raha."
            className="mt-1.5 min-h-28 text-sm"
          />
        </div>
      )}

      {step === 6 && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-sm font-semibold text-foreground">
              Aapka naam <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => set("name")(e.target.value)}
              placeholder="Enter your name"
              className="mt-1.5 h-11"
            />
          </div>
          <div>
            <Label htmlFor="phone" className="text-sm font-semibold text-foreground">
              Phone number{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone")(e.target.value)}
              placeholder="Your phone number"
              className="mt-1.5 h-11"
            />
          </div>
        </div>
      )}

      {error ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-7 flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => setStep((p) => Math.max(0, p - 1))}
          disabled={step === 0 || submitting}
        >
          <ChevronLeft className="size-4" />
          Back
        </Button>

        {step < TOTAL_STEPS - 1 ? (
          <Button
            type="button"
            size="lg"
            className="bg-brand text-white hover:bg-brand-hover"
            onClick={() => setStep((p) => p + 1)}
            disabled={!canGoNext}
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Button
            type="button"
            size="lg"
            className="bg-brand text-white hover:bg-brand-hover"
            onClick={handleSubmit}
            disabled={!canGoNext || submitting}
          >
            <Sparkles className="size-4" />
            {submitting ? "Submit ho raha hai..." : "Submit Review"}
          </Button>
        )}
      </div>
    </div>
  );
}
