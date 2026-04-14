import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Crown,
  Flame,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  Stars,
  Target,
  Zap,
} from "lucide-react";
import {
  NAME_LETTER_KEYS,
  getNameLetterExperience,
} from "@/lib/name-letter";

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
      title: "Name Astrology Insights | VedGuide",
      description:
        "Name-based astrology insights and a quick path to your personalized free kundli.",
    };
  }

  return {
    title: `${experience.letter} Naam Insights | VedGuide`,
    description: experience.heroSubheadline,
  };
}

export default async function NameLetterLandingPage({
  params,
}: {
  params: Promise<{ letter: string }>;
}) {
  const { letter } = await params;
  const experience = getNameLetterExperience(letter);

  if (!experience) notFound();

  const freeKundliHref = `/astro-path/free-kundli?source=name_letter_${experience.slug}`;
  const traitIcons = [Crown, Flame, ShieldCheck, HeartHandshake, Target, Zap];
  const quickHeroLine = `${experience.letter} se naam? Nature • Love vibe • Strengths — quick decode.`;
  const quickRelationshipLine =
    "Pyar mein loyal, trust mein deep, aur behavior mein direct energy dekhi jaati hai.";
  const quickBridgeLine = "Naam baseline batata hai. Kundli aapka exact pattern dikhati hai.";

  return (
    <div className="min-h-screen spiritual-pattern">
      <style>{`
        @keyframes nl-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes nl-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.22); }
          50% { box-shadow: 0 0 0 8px rgba(245,158,11,0.08); }
        }
        @keyframes nl-marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        @keyframes nl-cta-shine {
          0% { transform: translateX(-130%) skewX(-18deg); }
          100% { transform: translateX(260%) skewX(-18deg); }
        }
        @keyframes nl-cta-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        @keyframes nl-arrow-loop {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(4px); }
        }
        .nl-float { animation: nl-float 3s ease-in-out infinite; }
        .nl-pulse { animation: nl-pulse 2.8s ease-in-out infinite; }
        .nl-marquee {
          width: max-content;
          animation: nl-marquee 20s linear infinite;
        }
        .nl-cta-loop {
          animation: nl-pulse 2.8s ease-in-out infinite, nl-cta-breathe 2.8s ease-in-out infinite;
          transform-origin: center;
        }
        .nl-arrow-loop {
          animation: nl-arrow-loop 1.3s ease-in-out infinite;
        }
        .nl-cta-shine::after {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          border-radius: inherit;
          background: linear-gradient(90deg, transparent 20%, rgba(255,255,255,0.28) 50%, transparent 80%);
          animation: nl-cta-shine 2.4s ease-in-out infinite;
        }
      `}</style>

      <section className="border-b border-brand/15 bg-gradient-to-b from-gold-light/35 to-background px-3 py-5 sm:px-4 sm:py-9">
        <div className="mx-auto grid max-w-5xl gap-3 sm:gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative min-w-0 overflow-hidden rounded-3xl border border-amber-800/45 bg-gradient-to-br from-amber-900 via-orange-900 to-amber-800 p-4 text-white shadow-[0_24px_55px_-22px_rgba(120,53,15,0.72)] sm:p-6">
            <div className="pointer-events-none absolute -right-8 -top-10 size-40 rounded-full bg-amber-200/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-10 -left-10 size-40 rounded-full bg-orange-200/15 blur-3xl" />

            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/45 bg-white/15 px-3 py-1 text-[11px] font-semibold text-amber-50">
              <Sparkles className="size-3.5" aria-hidden />
              Name-based astrology insight
            </span>

            <h1 className="font-heading mt-3.5 break-words text-[1.65rem] font-black leading-[1.1] tracking-tight text-amber-50 sm:mt-4 sm:text-4xl">
              {experience.heroHeadline}
            </h1>
            <p className="mt-2.5 text-[13px] font-medium leading-relaxed text-amber-100/90 sm:mt-3 sm:text-[15px]">
              {quickHeroLine}
            </p>

            <Link
              id={`name-letter-${experience.slug}-free-kundli-hero-cta`}
              href={freeKundliHref}
              className="nl-cta-loop nl-cta-shine relative mt-4 inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-amber-200/55 bg-gradient-to-r from-brand via-gold to-brand-hover px-5 py-3.5 text-[14px] font-extrabold text-primary-foreground shadow-[0_14px_32px_-14px_rgba(180,83,9,0.9)] transition hover:brightness-110 sm:mt-5 sm:w-auto sm:text-sm sm:py-3"
            >
              <span className="pointer-events-none">{experience.heroCtaLabel}</span>
              <ArrowRight className="nl-arrow-loop pointer-events-none size-4" />
            </Link>

            <div className="mt-3 hidden grid-cols-3 gap-2 sm:mt-4 sm:grid">
              {[
                { label: "Confidence", value: "High" },
                { label: "Loyalty", value: "Strong" },
                { label: "Ambition", value: "Sharp" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-amber-200/35 bg-white/10 px-2 py-2 text-center"
                >
                  <p className="font-heading text-[13px] font-black text-amber-50 sm:text-[15px]">
                    {item.value}
                  </p>
                  <p className="text-[9px] font-semibold text-amber-100/85 sm:text-[10px]">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5 sm:gap-2">
              {experience.traits.slice(0, 3).map((t) => (
                <span
                  key={t.title}
                  className="rounded-full border border-amber-200/45 bg-white/10 px-2 py-1 text-[10px] font-semibold text-amber-100"
                >
                  {t.title}
                </span>
              ))}
            </div>
          </div>

          <div className="min-w-0 rounded-3xl border border-border/60 bg-card/90 p-4 shadow-sm sm:p-5">
            <div className="flex items-center gap-3">
              <div className="nl-float relative grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-amber-100 via-gold-light to-brand-light shadow-sm">
                <div className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-amber-300/55" />
                <span className="font-heading text-2xl font-black text-amber-900">
                  {experience.letter}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand">
                  First-letter decode
                </p>
                <p className="font-heading text-lg font-extrabold text-foreground">
                  Personality snapshot
                </p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4">
              {[
                { label: "Love vibe", value: "Warm" },
                { label: "Trust", value: "Deep" },
                { label: "Drive", value: "High" },
                { label: "Willpower", value: "Strong" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-border/55 bg-background/80 px-2.5 py-2.5 text-center"
                >
                  <p className="font-heading text-[15px] font-black text-amber-900">{item.value}</p>
                  <p className="text-[10px] font-semibold text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-3 hidden overflow-hidden rounded-xl border border-brand/20 bg-brand-light/20 py-2 sm:block">
              <div className="nl-marquee flex items-center gap-2 px-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {experience.traits.map((trait) => (
                      <span
                        key={`${i}-${trait.title}`}
                        className="inline-flex items-center gap-1 rounded-full border border-brand/20 bg-white/80 px-2.5 py-1 text-[10px] font-semibold text-brand"
                      >
                        <Stars className="size-3" />
                        {trait.title}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-1.5 sm:hidden">
              {experience.traits.slice(0, 4).map((trait) => (
                <div
                  key={trait.title}
                  className="rounded-lg border border-brand/20 bg-brand-light/20 px-2 py-1.5"
                >
                  <p className="truncate text-[10px] font-bold text-brand">{trait.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl space-y-4 px-3 py-6 sm:space-y-6 sm:px-4 sm:py-10">
        <section className="rounded-3xl border border-border/60 bg-card/90 p-4 shadow-sm sm:p-5">
          <h2 className="font-heading text-lg font-bold text-foreground">Key traits</h2>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {experience.traits.map((trait, index) => {
              const Icon = traitIcons[index % traitIcons.length];
              return (
              <article
                key={trait.title}
                className="group relative min-w-0 overflow-hidden rounded-2xl border border-border/50 bg-background/80 px-3.5 py-3.5 transition-all hover:-translate-y-0.5 hover:border-amber-300/70"
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-amber-700 via-orange-600 to-amber-700 opacity-80" />
                <p className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                  <span className="grid size-6 place-items-center rounded-lg bg-amber-100 text-amber-800">
                    <Icon className="size-3.5" />
                  </span>
                  {trait.title}
                </p>
                <p className="mt-1 line-clamp-2 break-words text-xs leading-relaxed text-muted-foreground">{trait.line}</p>
              </article>
              );
            })}
          </div>
        </section>

        <section className="relative overflow-hidden rounded-3xl border border-amber-800/35 bg-gradient-to-br from-amber-900 via-orange-900 to-amber-800 p-5 text-white shadow-[0_20px_50px_-22px_rgba(120,53,15,0.7)]">
          <div className="pointer-events-none absolute -right-10 -top-10 size-44 rounded-full bg-amber-100/18 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-12 size-44 rounded-full bg-orange-200/15 blur-3xl" />

          <h2
            className="relative text-[1.45rem] font-bold leading-snug tracking-tight text-amber-50 sm:text-[1.6rem]"
            style={{ fontFamily: '"Georgia", "Times New Roman", serif' }}
          >
            {experience.bridgeHeading}
          </h2>
          <div className="relative mt-3 grid gap-2 sm:grid-cols-2">
            <article className="rounded-2xl border border-amber-200/30 bg-white/10 px-3 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-100">
                Sirf naam se
              </p>
              <ul className="mt-2 space-y-1.5 text-[11px] text-amber-100/90">
                <li>• General nature hints</li>
                <li>• Relationship style idea</li>
              </ul>
            </article>
            <article className="rounded-2xl border border-amber-100/55 bg-white/15 px-3 py-3 shadow-[0_10px_28px_-16px_rgba(255,255,255,0.6)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-50">
                Poori kundli se
              </p>
              <ul className="mt-2 space-y-1.5 text-[11px] text-amber-50/95">
                <li>• Birth-details based personal clarity</li>
                <li>• Timing + practical direction</li>
              </ul>
            </article>
          </div>
          <p className="relative mt-3 text-sm font-medium leading-relaxed text-amber-100/90">
            {quickBridgeLine}
          </p>
          <div className="relative mt-3 flex flex-wrap gap-1.5">
            {["Birth details based", "More personal", "Actionable insight"].map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-amber-200/35 bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-amber-100"
              >
                {tag}
              </span>
            ))}
          </div>
          <Link
            id={`name-letter-${experience.slug}-free-kundli-final-cta`}
            href={freeKundliHref}
            className="nl-cta-loop nl-cta-shine relative mt-4 inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-amber-200/55 bg-gradient-to-r from-brand via-gold to-brand-hover px-5 py-3.5 text-[15px] font-extrabold text-primary-foreground shadow-[0_14px_32px_-14px_rgba(180,83,9,0.9)] transition hover:brightness-110 sm:w-auto"
          >
            <span className="pointer-events-none">{experience.finalCtaLabel}</span>
            <ArrowRight className="nl-arrow-loop pointer-events-none size-4" />
          </Link>
        </section>

        <section className="relative overflow-hidden rounded-3xl border border-amber-800/40 bg-gradient-to-br from-amber-900 via-orange-900 to-amber-800 p-4 text-white shadow-[0_20px_45px_-20px_rgba(120,53,15,0.72)] sm:p-5">
          <div className="pointer-events-none absolute -right-8 -top-10 size-32 rounded-full bg-amber-100/18 blur-3xl" />
          <div className="pointer-events-none absolute -left-10 -bottom-12 size-32 rounded-full bg-orange-200/18 blur-3xl" />

          <h2 className="font-heading relative text-lg font-bold text-amber-50">
            {experience.relationshipHeading}
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[
              { chip: "Love", sub: "Caring + expressive" },
              { chip: "Trust", sub: "Deep once built" },
              { chip: "Emotion", sub: "Sensitive but steady" },
              { chip: "Behavior", sub: "Direct and loyal" },
            ].map(({ chip, sub }) => (
              <div
                key={chip}
                className="rounded-xl border border-amber-200/35 bg-white/10 px-2.5 py-2.5 text-center"
              >
                <p className="text-[11px] font-bold text-amber-50">{chip}</p>
                <p className="mt-0.5 break-words text-[10px] leading-tight text-amber-100/85">{sub}</p>
              </div>
            ))}
          </div>
          <p className="relative mt-3 text-sm font-medium leading-relaxed text-amber-100/90">
            {quickRelationshipLine}
          </p>
          <p className="relative mt-2 rounded-xl border border-amber-200/30 bg-white/10 px-3 py-2 text-[11px] leading-relaxed text-amber-100/80">
            {experience.disclaimer}
          </p>
        </section>
      </div>
    </div>
  );
}
