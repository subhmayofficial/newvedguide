import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Common questions about VedGuide free kundli, reports, and consultations.",
};

const FAQS: { q: string; a: string }[] = [
  {
    q: "Is the free kundli really free?",
    a: "Yes. You get an instant basic chart and summary. The detailed PDF report is a separate paid product.",
  },
  {
    q: "How long does the personalized report take?",
    a: "Typically 24–48 hours after payment. You can add FastTrack at checkout for priority delivery where available.",
  },
  {
    q: "What do I need for an accurate chart?",
    a: "Full name, date of birth, accurate birth time, and place of birth. Wrong time shifts the ascendant — double-check with family if unsure.",
  },
  {
    q: "Is astrology a guarantee?",
    a: "No. We offer guidance based on classical principles; life choices remain yours. Use insights as one input alongside reason and professional advice where needed.",
  },
  {
    q: "How do consultations work?",
    a: "You share your context; we align a session format (voice/video as offered). See the consultation page for current booking flow.",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:py-20">
      <h1 className="font-heading text-3xl font-black text-foreground sm:text-4xl">
        Frequently asked questions
      </h1>
      <p className="mt-3 text-[15px] text-muted-foreground">
        Quick answers about reports, timing, and how VedGuide works.
      </p>

      <dl className="mt-10 space-y-8">
        {FAQS.map(({ q, a }) => (
          <div key={q}>
            <dt className="font-heading text-lg font-bold text-foreground">{q}</dt>
            <dd className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{a}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-12 rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        More questions? Visit{" "}
        <Link href="/consultation" className="font-semibold text-brand hover:underline">
          Consultation
        </Link>{" "}
        or start with a{" "}
        <Link href="/free-kundli" className="font-semibold text-brand hover:underline">
          free kundli
        </Link>
        .
      </p>
    </div>
  );
}
