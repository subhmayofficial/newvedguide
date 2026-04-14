import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock3, ShieldCheck, Sparkles, Stars, WandSparkles } from "lucide-react";
import {
  NAME_LETTER_KEYS,
  getNameLetterExperience,
} from "@/lib/name-letter";
import { NameLetterKundliStepForm } from "@/components/forms/name-letter-kundli-step-form";

export async function generateStaticParams() {
  return NAME_LETTER_KEYS.map((letter) => ({ letter }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ letter: string }>;
}): Promise<Metadata> {
  const { letter } = await params;
  const experience = getNameLetterExperience(letter);
  if (!experience) {
    return {
      title: "Free Kundli Start | VedGuide",
      description:
        "Enter your birth details and continue to a personalized free kundli reading.",
    };
  }
  return {
    title: `${experience.step2Heading} | VedGuide`,
    description: experience.step2Subheading,
  };
}

export default async function NameLetterFreeKundliStepPage({
  params,
}: {
  params: Promise<{ letter: string }>;
}) {
  const { letter } = await params;
  const experience = getNameLetterExperience(letter);
  if (!experience) notFound();

  return (
    <div className="min-h-screen spiritual-pattern">
      <style>{`
        @keyframes nl-step-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes nl-step-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.2); }
          50% { box-shadow: 0 0 0 7px rgba(245,158,11,0.09); }
        }
        .nl-step-float { animation: nl-step-float 3.1s ease-in-out infinite; }
        .nl-step-glow { animation: nl-step-glow 2.8s ease-in-out infinite; }
      `}</style>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
        <Link
          id={`name-letter-${experience.slug}-back-link`}
          href={`/tools/name-letter/${experience.slug}`}
          className="inline-flex items-center gap-1 text-[12px] font-medium text-amber-900/80 hover:text-amber-950"
        >
          <ArrowLeft className="size-3.5" />
          Back
        </Link>

        <section className="mt-3 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative overflow-hidden rounded-3xl border border-amber-800/40 bg-gradient-to-br from-amber-900 via-orange-900 to-amber-800 p-5 text-white shadow-[0_20px_50px_-22px_rgba(120,53,15,0.75)] sm:p-6">
            <div className="pointer-events-none absolute -right-10 -top-10 size-44 rounded-full bg-amber-100/20 blur-3xl" />
            <div className="pointer-events-none absolute -left-12 -bottom-12 size-40 rounded-full bg-orange-200/15 blur-3xl" />

            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/45 bg-white/15 px-3 py-1 text-[11px] font-semibold text-amber-100">
              <Sparkles className="size-3.5" aria-hidden />
              Step 2 of 2
            </span>
            <h1 className="font-heading mt-4 text-2xl font-black leading-tight text-amber-50 sm:text-[2rem]">
              {experience.step2Heading}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-amber-100/90 sm:text-[15px]">
              {experience.step2Subheading}
            </p>

            <div className="mt-5 grid grid-cols-3 gap-2.5">
              {[
                { icon: Clock3, title: "Fast" },
                { icon: ShieldCheck, title: "Private" },
                { icon: WandSparkles, title: "Personal" },
              ].map(({ icon: Icon, title }) => (
                <div
                  key={title}
                  className="rounded-xl border border-amber-200/40 bg-white/10 px-2 py-2.5 text-center"
                >
                  <Icon className="mx-auto size-4 text-amber-100" />
                  <p className="mt-1 text-[10px] font-bold text-amber-100">{title}</p>
                </div>
              ))}
            </div>

            <div className="nl-step-float mt-5 flex items-center gap-2 rounded-2xl border border-amber-200/35 bg-white/10 px-3 py-2.5">
              <span className="grid size-7 place-items-center rounded-xl bg-white/20 text-amber-100">
                <Stars className="size-4" />
              </span>
              <p className="text-[12px] font-medium leading-snug text-amber-100/95">
                Birth details se free-kundli flow mein aapko zyada personalized insight milega.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-brand/25 bg-gradient-to-br from-amber-50/75 via-background to-brand-light/35 p-[1px] shadow-[0_16px_44px_-20px_rgba(180,83,9,0.45)]">
            <div className="rounded-[1.35rem] bg-card/95 p-4 sm:p-5">
              <div className="mb-4 rounded-2xl border border-brand/20 bg-brand-light/35 px-3 py-2.5">
                <p className="font-heading text-[14px] font-extrabold text-foreground">
                  Fill once, continue smoothly
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Ye details aage free kundli step mein auto carry ho jayengi.
                </p>
              </div>

              <div className="nl-step-glow rounded-2xl border border-border/50 bg-background/80 p-3.5 sm:p-4">
                <NameLetterKundliStepForm experience={experience} />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
