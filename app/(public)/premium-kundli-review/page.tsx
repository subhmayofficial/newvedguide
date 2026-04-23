import type { Metadata } from "next";
import { PremiumKundliReviewForm } from "@/components/sections/premium-kundli-review-form";

export const metadata: Metadata = {
  title: "Premium Kundli Review | VedGuide",
  description:
    "Share your Personalized Premium Kundli feedback with VedGuide. Premium multi-step review experience.",
};

export default function PremiumKundliReviewPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.18),transparent_45%),radial-gradient(circle_at_70%_20%,rgba(194,65,12,0.12),transparent_40%)]">
      <div className="mx-auto w-full max-w-3xl px-4 py-12 lg:py-16">
        <section className="mb-6 space-y-3 text-center">
          <p className="inline-flex items-center rounded-full border border-brand/30 bg-brand-light/60 px-3 py-1 text-xs font-semibold text-brand">
            Personalized Premium Kundli
          </p>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground md:text-5xl">
            Share your premium kundli experience
          </h1>
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Aapke review se hum report quality, prediction clarity, aur overall premium experience
            aur better banate hain. 2 minute lagega.
          </p>
        </section>
        <PremiumKundliReviewForm />
      </div>
    </div>
  );
}
