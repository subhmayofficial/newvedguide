"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { NameLetterExperience } from "@/lib/name-letter";
import { NAME_LETTER_PREFILL_STORAGE_KEY } from "@/lib/name-letter";

type StepFormState = {
  fullName: string;
  gender: "" | "male" | "female";
  dob: string;
  tob: string;
  pob: string;
};

type StepFormErrors = Partial<Record<keyof StepFormState, string>>;

const EMPTY_STATE: StepFormState = {
  fullName: "",
  gender: "",
  dob: "",
  tob: "",
  pob: "",
};

function fieldClass(hasError: boolean) {
  return cn(
    "h-11 border bg-white text-[14px] shadow-sm transition-[border-color,box-shadow]",
    "border-stone-200 text-stone-900 placeholder:text-stone-400",
    "focus-visible:border-amber-700 focus-visible:ring-2 focus-visible:ring-amber-600/25 focus-visible:outline-none",
    hasError && "border-red-500 focus-visible:ring-red-200"
  );
}

export function NameLetterKundliStepForm({
  experience,
}: {
  experience: NameLetterExperience;
}) {
  const router = useRouter();
  const [form, setForm] = useState<StepFormState>(EMPTY_STATE);
  const [errors, setErrors] = useState<StepFormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof StepFormState>(key: K, value: StepFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const nextErrors: StepFormErrors = {};
    if (form.fullName.trim().length < 2) nextErrors.fullName = "Full name enter karein.";
    if (form.gender !== "male" && form.gender !== "female") {
      nextErrors.gender = "Gender select karein.";
    }
    if (!form.dob) nextErrors.dob = "Date of birth select karein.";
    if (!form.tob) nextErrors.tob = "Exact birth time daalein.";
    if (form.pob.trim().length < 2) nextErrors.pob = "Birth place enter karein.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      sessionStorage.setItem(
        NAME_LETTER_PREFILL_STORAGE_KEY,
        JSON.stringify({
          fullName: form.fullName.trim(),
          gender: form.gender,
          dob: form.dob,
          tob: form.tob,
          pob: form.pob.trim(),
          source: `name_letter_${experience.slug}`,
        })
      );
      router.push(`/astro-path/free-kundli?source=name_letter_${experience.slug}`);
    } finally {
      setSubmitting(false);
    }
  }

  const labelClass = "text-[13px] font-semibold text-stone-800";

  return (
    <form
      id={`name-letter-${experience.slug}-step2-form`}
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <style>{`
        @keyframes nl-form-shimmer {
          0% { transform: translateX(-130%) skewX(-18deg); }
          100% { transform: translateX(260%) skewX(-18deg); }
        }
        .nl-form-cta::after {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          border-radius: inherit;
          background: linear-gradient(90deg, transparent 20%, rgba(255,255,255,0.22) 50%, transparent 80%);
          animation: nl-form-shimmer 2.4s ease-in-out infinite;
        }
      `}</style>

      <div className="space-y-1.5">
        <Label htmlFor={`name-letter-${experience.slug}-full-name-input`} className={labelClass}>
          Full Name
        </Label>
        <Input
          id={`name-letter-${experience.slug}-full-name-input`}
          value={form.fullName}
          onChange={(e) => set("fullName", e.target.value)}
          placeholder="e.g. Aditi Sharma"
          className={fieldClass(!!errors.fullName)}
        />
        {errors.fullName && <p className="text-xs text-red-500">{errors.fullName}</p>}
      </div>

      <div className="space-y-1.5">
        <Label className={labelClass}>Gender</Label>
        <div className="grid grid-cols-2 gap-2.5">
          {(["male", "female"] as const).map((g) => (
            <button
              key={g}
              id={`name-letter-${experience.slug}-gender-${g}-btn`}
              type="button"
              onClick={() => set("gender", g)}
              className={cn(
                "flex h-11 items-center justify-center rounded-xl border-2 text-[13px] font-semibold transition-all",
                form.gender === g
                  ? "border-amber-700 bg-amber-50 text-amber-900"
                  : "border-stone-200 bg-white text-stone-600 hover:border-amber-300"
              )}
            >
              {g === "male" ? "Male" : "Female"}
            </button>
          ))}
        </div>
        {errors.gender && <p className="text-xs text-red-500">{errors.gender}</p>}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`name-letter-${experience.slug}-dob-input`} className={labelClass}>
            Date of Birth
          </Label>
          <Input
            id={`name-letter-${experience.slug}-dob-input`}
            type="date"
            value={form.dob}
            max={new Date().toISOString().split("T")[0]}
            onChange={(e) => set("dob", e.target.value)}
            className={fieldClass(!!errors.dob)}
          />
          {errors.dob && <p className="text-xs text-red-500">{errors.dob}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`name-letter-${experience.slug}-tob-input`} className={labelClass}>
            Exact Time of Birth
          </Label>
          <Input
            id={`name-letter-${experience.slug}-tob-input`}
            type="time"
            value={form.tob}
            onChange={(e) => set("tob", e.target.value)}
            className={fieldClass(!!errors.tob)}
          />
          {errors.tob && <p className="text-xs text-red-500">{errors.tob}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`name-letter-${experience.slug}-pob-input`} className={labelClass}>
          Place of Birth (City / State / Country)
        </Label>
        <Input
          id={`name-letter-${experience.slug}-pob-input`}
          value={form.pob}
          onChange={(e) => set("pob", e.target.value)}
          placeholder="e.g. Jaipur, Rajasthan, India"
          className={fieldClass(!!errors.pob)}
        />
        {errors.pob && <p className="text-xs text-red-500">{errors.pob}</p>}
      </div>

      <button
        id={`name-letter-${experience.slug}-step2-submit-btn`}
        type="submit"
        disabled={submitting}
        className="nl-form-cta relative w-full overflow-hidden rounded-2xl bg-brand py-3.5 text-[15px] font-extrabold text-white shadow-[0_6px_24px_-8px_rgba(180,83,9,0.55)] transition-all hover:bg-brand-hover active:scale-[0.98] disabled:opacity-70"
      >
        {submitting ? "Please wait..." : experience.step2CtaLabel}
      </button>

      <p className="text-center text-[12px] font-medium text-muted-foreground">
        {experience.step2TrustLine}
      </p>
    </form>
  );
}
