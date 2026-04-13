"use client";

import Link from "next/link";
import { useEffect, useState, type MouseEvent } from "react";
import {
  ArrowRight, Check, Star, Shield, Lock, Zap,
  MessageCircle, Sparkles, Target, Heart,
  TrendingUp, Clock, ChevronDown, Globe,
} from "lucide-react";
import { track } from "@/lib/analytics/events";

// ─── Assets ───────────────────────────────────────────────────────────────────

const ASTRO_IMG =
  "https://primedit-cdn.b-cdn.net/shubhmay-lp-kundli/FINAL__1__11zon__1_-removebg-preview.png";

// ─── Data ─────────────────────────────────────────────────────────────────────

const TICKER = [
  "Vedic Jyotish", "Kundli Analysis", "Career Guidance",
  "Marriage Insights", "Dosh Nivaran", "Financial Timing",
  "Personalized Remedies", "Private & Confidential",
];

const PAINS = [
  "Mehnat karte ho — phir bhi kuch ruka hua lagta hai",
  "Career mein clarity nahi — agla step kaunsa hai?",
  "Rishton mein same problems baar baar aati hain",
  "Bade decisions mein darr — sahi time hai ya nahi?",
  "Paisa aata hai, rukta nahi — flow nahi ban raha",
];

const BEFORE_AFTER = [
  { before: "Direction clear nahi", after: "Exact next step pata hai" },
  { before: "Same mistakes baar baar", after: "Pattern samajh — cycle khatam" },
  { before: "Decision mein darr lagta hai", after: "Timing ke saath — confident" },
  { before: "Kab badlega, pata nahi", after: "Exact window clear hai" },
];

const WHAT_YOU_GET = [
  { icon: Target, title: "Exact pattern identify hoga", desc: "Career, rishte, paisa — kahan energy stuck hai, exactly." },
  { icon: Clock, title: "Timing clear", desc: "Kab badlega — months ya years mein, specific number." },
  { icon: Sparkles, title: "Planetary period analysis", desc: "Abhi kaunsa period chal raha hai, life pe practical impact." },
  { icon: TrendingUp, title: "Actionable next steps", desc: "Sirf suno nahi — exact karo kya karna hai." },
  { icon: Zap, title: "Simple, effective remedies", desc: "Jo follow ho sake — overload bilkul nahi." },
  { icon: Heart, title: "Aapke sawaalon ke jawab", desc: "Jo poochna hai — seedha, honest jawab milega." },
];

const TESTIMONIALS = [
  {
    initial: "R",
    name: "Rahul K.",
    city: "Bangalore, 31",
    tag: "Career",
    stars: 5,
    text: "3 companies mein reject hua. Ashutosh ji ne bataya — agle 6 mahine struggle ka time hai, phir exact kya karna hai. Woh hua. 7 mahine mein solid role mil gaya.",
    outcome: "Job offer in 7 months",
  },
  {
    initial: "M",
    name: "Meera S.",
    city: "Pune, 28",
    tag: "Relationship",
    stars: 5,
    text: "Shaadi ke 2 saal baad bhi bahut tension tha. Session mein samjha — planetary period ka effect hai. Remedies follow ki. 1.5 saal ho gaye — ghar peaceful hai.",
    outcome: "Relationship stable",
  },
  {
    initial: "V",
    name: "Vikram T.",
    city: "Mumbai, 34",
    tag: "Business",
    stars: 5,
    text: "Business start karna tha, darr lag raha tha. Ashutosh ji ne exact window batai chart mein. Usi time pe start kiya. Pehle saal 30 lakh revenue. Timing ne kaam kiya.",
    outcome: "₹30L first year revenue",
  },
];

const FAQS = [
  {
    q: "Kya main believe nahi karta — phir bhi session karna chahiye?",
    a: "Zaroor. Hamare zyaada clients pehle skeptical the. Ek baar aao, suno — phir decide karo khud. Ek useful insight bhi kaam aa jaaye toh ₹1,499 worth hai.",
  },
  {
    q: "15-minute session mein kya cover hoga — waqt bahut kam lagta hai?",
    a: "Ek focused sawal, ek deep answer. Career ya rishte ya paisa — kisi ek area pe specifically jaate hain. Vague nahi hoga.",
  },
  {
    q: "Kya exact birth time hona zaroori hai?",
    a: "Helpful hai, mandatory nahi. Approximate time bhi theek hai. Session mein bata dena — hum ussi ke saath kaam karte hain.",
  },
  {
    q: "Kya reading scary ya negative hogi?",
    a: "Kabhi nahi. Hamare sessions fear nahi dete — clarity dete hain. Kya favor mein hai, kya navigate karna hai — practical guidance milti hai.",
  },
];

const CHECKOUT_HREF = {
  "15": "/checkout/consultation?pkg=15",
  "45": "/checkout/consultation?pkg=45",
} as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function ConsultationLanding() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const tickerItems = [...TICKER, ...TICKER];

  useEffect(() => {
    track.consultationPageViewed("consultation_landing");
  }, []);

  function handleComparePackagesClick(e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    track.consultationProductSelected("compare_packages");
    document.getElementById("packages")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="overflow-x-hidden bg-background text-foreground">
      <style>{`
        @keyframes vg-guru-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-9px); }
        }
        @keyframes vg-slot-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.35; }
        }
        @keyframes vg-gold-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes vg-ring-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes vg-orb-breathe {
          0%, 100% { opacity: 0.12; transform: scale(1); }
          50%       { opacity: 0.22; transform: scale(1.08); }
        }
        @keyframes vg-twinkle {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.25); }
        }
        @keyframes vg-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes vg-card-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(180,83,9,0); }
          50%       { box-shadow: 0 0 0 6px rgba(180,83,9,0.12); }
        }
        .vg-guru-float  { animation: vg-guru-float 5s ease-in-out infinite; }
        .vg-slot-blink  { animation: vg-slot-blink 1.6s ease-in-out infinite; }
        .vg-marquee     { animation: vg-marquee 55s linear infinite; }
        .vg-ring        { animation: vg-ring-spin 50s linear infinite; }
        .vg-orb         { animation: vg-orb-breathe 6s ease-in-out infinite; }
        .vg-twinkle     { animation: vg-twinkle 3.2s ease-in-out infinite; }
        .vg-card-glow   { animation: vg-card-glow 4s ease-in-out infinite; }
        .vg-gold-text {
          background: linear-gradient(90deg, #b45309 0%, #d97706 35%, #f59e0b 55%, #b45309 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: vg-gold-shimmer 3s linear infinite;
        }
      `}</style>

      {/* ═══ 1. HERO ═══════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[oklch(0.11_0.04_50)] via-[oklch(0.16_0.06_52)] to-[oklch(0.22_0.07_55)]">
        {/* Dot grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.09]"
          style={{ backgroundImage: "radial-gradient(circle at 2px 2px, oklch(0.85 0.12 85) 1px, transparent 0)", backgroundSize: "36px 36px" }}
        />
        {/* Glow orbs */}
        <div className="vg-orb pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-gold/10 blur-3xl" />
        <div className="vg-orb pointer-events-none absolute bottom-0 -left-20 h-72 w-72 rounded-full bg-brand/12 blur-3xl [animation-delay:-3s]" />
        {/* Stars */}
        <span className="vg-twinkle pointer-events-none absolute left-[7%] top-[18%]">
          <Star className="size-3 fill-gold-light/30 text-transparent" />
        </span>
        <span className="vg-twinkle pointer-events-none absolute right-[9%] top-[28%] [animation-delay:-1.6s]">
          <Sparkles className="size-5 text-gold-light/35" strokeWidth={1} />
        </span>
        <span className="vg-twinkle pointer-events-none absolute bottom-[25%] left-[14%] [animation-delay:-2.3s]">
          <Star className="size-2 fill-gold-light/20 text-transparent" />
        </span>

        {/* Layout container */}
        <div className="relative mx-auto grid max-w-5xl grid-cols-[minmax(130px,44vw),1fr] items-start gap-4 px-4 pb-6 pt-10 lg:flex lg:min-h-[92vh] lg:items-center lg:gap-10 lg:py-0">

          {/* ── Image (left on mobile, right on desktop) ── */}
          <div className="order-1 flex shrink-0 justify-start lg:order-2 lg:w-[42%] lg:justify-center">
            <div className="vg-guru-float relative">
              {/* Outer dashed ring */}
              <div className="vg-ring pointer-events-none absolute inset-[-22px] rounded-full border border-dashed border-gold/30 opacity-70" />
              {/* Inner ring */}
              <div className="pointer-events-none absolute inset-[-7px] rounded-full border border-gold/20" />
              {/* Glow behind */}
              <div className="vg-orb pointer-events-none absolute inset-0 rounded-full bg-brand/25 blur-2xl" />
              {/* Gold accents */}
              <span className="vg-twinkle absolute -right-2 -top-1 text-xl text-gold">✦</span>
              <span className="vg-twinkle absolute -bottom-1 -left-4 text-sm text-gold/60 [animation-delay:-2s]">✦</span>
              {/* Portrait */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ASTRO_IMG}
                alt="AstroGuru Ashutosh"
                fetchPriority="high"
                decoding="async"
                className="relative z-[1] h-[240px] w-auto drop-shadow-2xl sm:h-[300px] lg:h-[540px]"
              />
            </div>
          </div>

          {/* ── Text (right side on mobile) ── */}
          <div className="order-2 mt-0 flex-1 text-left lg:order-1 lg:mt-0 lg:text-left">
            {/* Live badge */}
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold/25 bg-white/5 px-3 py-1.5 backdrop-blur-sm">
              <span className="vg-slot-blink size-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-gold-light/90 sm:hidden">
                Live Consultation
              </span>
              <span className="hidden text-[10px] font-bold uppercase tracking-widest text-gold-light/90 sm:inline">
                Personal Consultation · AstroGuru Ashutosh
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-heading text-[1.6rem] font-bold leading-[1.1] tracking-tight text-white sm:text-[2.1rem] lg:text-[3.5rem]">
              <span className="vg-gold-text">Direct Chat or Call</span>
              <br />
              with AstroGuru Ashutosh
            </h1>

            {/* Sub */}
            <p className="mt-3 max-w-none text-[12px] leading-relaxed text-white/72 sm:mt-4 sm:text-[13px] lg:mt-5 lg:max-w-[360px] lg:text-[15px]">
              Aapki kundli mein ek pattern chhupa hai.{" "}
              <span className="font-semibold text-white/90">
                Ek session — exact jawab milega: kya, kyun, aur kab badlega.
              </span>
            </p>

            {/* Avatar stack social proof */}
            <div className="mt-5 hidden flex-col gap-3 lg:flex lg:items-start">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {["R","M","V","P","S"].map((l, i) => (
                    <div
                      key={l}
                      className={`flex size-7 items-center justify-center rounded-full border-2 border-[oklch(0.13_0.04_50)] font-heading text-[10px] font-bold text-white ${i % 2 === 0 ? "bg-brand" : "bg-amber-700"}`}
                    >
                      {l}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map((i) => <Star key={i} className="size-3 fill-gold text-gold" />)}
                  </div>
                  <p className="text-[11px] text-white/60">5,000+ log clarity paa chuke hain</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-[12px] text-white/45">
                <span className="flex items-center gap-1.5">
                  <Lock className="size-3 text-gold-light/50" />
                  100% Confidential
                </span>
                <span>·</span>
                <span className="flex items-center gap-1.5">
                  <Globe className="size-3 text-gold-light/50" />
                  15+ Countries
                </span>
              </div>
            </div>

          </div>

          {/* Hero CTA row */}
          <div className="order-3 col-span-2 mt-2 w-full">
            <div className="mb-3 flex flex-wrap items-center justify-center gap-3 text-[12px] text-white/55">
              <span className="flex items-center gap-1.5">
                <Lock className="size-3 text-gold-light/60" />
                100% Confidential
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <Globe className="size-3 text-gold-light/60" />
                15+ Countries
              </span>
            </div>
            <div className="flex flex-col gap-2.5 sm:flex-row sm:justify-center">
              <Link
                href={CHECKOUT_HREF["15"]}
                onClick={() => track.consultationProductSelected("15min")}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gold px-6 py-3.5 text-[14px] font-bold text-[oklch(0.14_0.04_50)] shadow-[0_8px_24px_-8px_rgba(217,119,6,0.65)] transition-all hover:bg-gold-light active:scale-[0.97] sm:w-auto"
              >
                15 Min Session Abhi Book Karein
                <ArrowRight className="size-4" />
              </Link>
              <a
                href="#packages"
                onClick={handleComparePackagesClick}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-3.5 text-[14px] font-bold text-white transition-all hover:bg-white/15 active:scale-[0.97] sm:w-auto"
              >
                Options Compare Karein
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 2. TICKER ═════════════════════════════════════════════════════════ */}
      <div className="overflow-hidden border-y border-border bg-brand py-3 text-primary-foreground">
        <div className="vg-marquee flex w-max gap-10 whitespace-nowrap text-sm font-medium uppercase tracking-wider">
          {tickerItems.map((t, i) => (
            <span key={`${t}-${i}`} className="flex items-center gap-10">
              <span>{t}</span>
              <span className="text-gold-light/80" aria-hidden>✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* ═══ 3. STATS ══════════════════════════════════════════════════════════ */}
      <section className="border-b border-border bg-card py-10 spiritual-pattern">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-4 md:grid-cols-4">
          {[
            { n: "1237+", l: "Session done" },
            { n: "4.9★", l: "Average rating" },
            { n: "4+ Yrs", l: "Experience" },
            { n: "15+", l: "Countries" },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <p className="font-heading text-3xl font-bold text-brand md:text-4xl">{s.n}</p>
              <p className="mt-1 text-sm font-medium text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ 4. PAIN ═══════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-2xl px-4 py-16 sm:py-20">
        <p className="text-center text-[11px] font-bold uppercase tracking-widest text-brand">Pehchante ho?</p>
        <h2 className="mt-2 text-center font-heading text-3xl font-bold sm:text-4xl">
          Kya Yeh Aapke Saath Hota Hai?
        </h2>
        <ul className="mt-10 space-y-3">
          {PAINS.map((pain) => (
            <li
              key={pain}
              className="flex items-start gap-3 rounded-2xl border border-red-200/70 bg-red-50/60 px-5 py-4 shadow-sm"
            >
              <span className="mt-0.5 text-base leading-none">❌</span>
              <span className="text-[14.5px] leading-snug text-foreground">{pain}</span>
            </li>
          ))}
        </ul>

        <div className="mt-10 rounded-2xl border-2 border-brand/30 bg-gradient-to-br from-gold-light/80 to-brand-light/30 p-6 text-center shadow-md">
          <p className="font-heading text-xl font-bold text-foreground sm:text-2xl">
            Yeh sirf aapki galti nahi.
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
            Yeh aapki kundli ka pattern hai — jo in sab ko influence kar raha hai.{" "}
            <span className="font-semibold text-foreground">
              Ek session mein pattern clear. Exact kya, kyun, aur kab badlega.
            </span>
          </p>
          <a
            href="#packages"
            onClick={handleComparePackagesClick}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-hover active:scale-[0.97]"
          >
            Dono Plans Dekhein <ArrowRight className="size-4" />
          </a>
        </div>
      </section>

      {/* ═══ 5. SKEPTIC VALIDATION ═════════════════════════════════════════════ */}
      <section className="border-y border-border bg-[oklch(0.14_0.04_50)] py-14 text-white">
        <div className="mx-auto max-w-xl px-4 text-center">
          <span className="text-4xl" role="img" aria-label="thinking">🤔</span>
          <h2 className="mt-4 font-heading text-2xl font-bold sm:text-3xl">
            &ldquo;Main astrology mein believe nahi karta.&rdquo;
          </h2>
          <p className="mt-5 text-[15px] leading-relaxed text-white/72">
            Theek hai. Hamare zyaada clients pehle yahi sochte the.
            <br className="hidden sm:block" />
            Ek baar aao — suno — phir decide karo khud.
          </p>
          <p className="mt-3 text-base font-semibold text-gold-light">
            Ek useful insight bhi kaam aa jaaye — woh ₹1,499 worth hai ya nahi?
          </p>
          <a
            href="#packages"
            onClick={handleComparePackagesClick}
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-gold/40 bg-gold/10 px-6 py-3 text-sm font-bold text-gold-light transition-all hover:bg-gold/15"
          >
            15 Min Trial Session Dekho <ArrowRight className="size-4" />
          </a>
        </div>
      </section>

      {/* ═══ 6. BEFORE / AFTER ═════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:py-20">
        <p className="text-center text-[11px] font-bold uppercase tracking-widest text-brand">Transformation</p>
        <h2 className="mt-2 text-center font-heading text-3xl font-bold sm:text-4xl">
          Ek Session Ke Baad
        </h2>

        {/* Column labels */}
        <div className="mt-10 mb-3 grid grid-cols-[1fr_2.5rem_1fr] gap-2 text-center text-[10px] font-bold uppercase tracking-widest">
          <span className="text-red-600/80">Abhi</span>
          <span />
          <span className="text-green-700/80">Session Ke Baad</span>
        </div>

        <div className="space-y-2.5">
          {BEFORE_AFTER.map((item) => (
            <div
              key={item.before}
              className="grid grid-cols-[1fr_2.5rem_1fr] items-center gap-2"
            >
              <div className="flex items-center gap-2 rounded-xl border border-red-200/60 bg-red-50/60 px-3.5 py-3 text-[13px] leading-snug text-foreground">
                <span className="shrink-0 text-[15px] leading-none">❌</span>
                <span>{item.before}</span>
              </div>
              <div className="flex justify-center">
                <div className="flex size-7 items-center justify-center rounded-full bg-brand-light">
                  <ArrowRight className="size-3.5 text-brand" />
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-green-200/70 bg-green-50/60 px-3.5 py-3 text-[13px] font-medium leading-snug text-foreground">
                <span className="shrink-0 text-[15px] leading-none">✅</span>
                <span>{item.after}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <a
            href="#packages"
            onClick={handleComparePackagesClick}
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-hover active:scale-[0.97]"
          >
            Yeh Result Chahiye - Plan Select Karein <ArrowRight className="size-4" />
          </a>
        </div>
      </section>

      {/* ═══ 7. WHAT HAPPENS IN SESSION ════════════════════════════════════════ */}
      <section className="border-y border-border bg-surface-warm/40 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4">
          <p className="text-center text-[11px] font-bold uppercase tracking-widest text-brand">Session Mein</p>
          <h2 className="mt-2 text-center font-heading text-3xl font-bold sm:text-4xl">
            Sirf Aap Par — Poora Focus
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted-foreground">
            Koi script nahi. Koi generic advice nahi. Aapki chart, aapki situation.
          </p>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {WHAT_YOU_GET.map(({ icon: Icon, title, desc }) => (
              <li
                key={title}
                className="flex gap-4 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border/60"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand text-primary-foreground">
                  <Icon className="size-5" strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">{title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ═══ 8. TESTIMONIALS ═══════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:py-20">
        <p className="text-center text-[11px] font-bold uppercase tracking-widest text-brand">Real Stories</p>
        <h2 className="mt-2 text-center font-heading text-3xl font-bold sm:text-4xl">
          Unki Zindagi Badli — Ek Session Mein
        </h2>

        {/* Mobile: swipe. Desktop: grid */}
        <div className="mt-10 flex gap-4 overflow-x-auto pb-2 scrollbar-hide sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="flex shrink-0 w-[82vw] flex-col rounded-2xl border border-border/60 bg-card p-6 shadow-sm sm:w-auto"
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand font-heading text-lg font-bold text-white">
                  {t.initial}
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.city}</p>
                </div>
                <span className="ml-auto rounded-full bg-brand-light px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-brand">
                  {t.tag}
                </span>
              </div>
              <div className="mb-3 flex gap-0.5">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star key={i} className="size-3.5 fill-gold text-gold" />
                ))}
              </div>
              <p className="flex-1 text-[13px] leading-relaxed text-foreground">
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="mt-4 rounded-xl bg-green-50 px-3 py-2">
                <p className="text-[11px] font-bold text-green-700">✓ {t.outcome}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ 9. ASTROGURU ══════════════════════════════════════════════════════ */}
      <section className="border-t border-border bg-gradient-to-b from-card to-background py-16 sm:py-20">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-10 px-4 md:flex-row md:items-center md:gap-14">
          {/* Image */}
          <div className="relative shrink-0 vg-guru-float">
            <div className="vg-ring pointer-events-none absolute inset-[-18px] rounded-full border border-dashed border-gold/35 opacity-70" />
            <div className="pointer-events-none absolute inset-[-6px] rounded-full border border-gold/20" />
            <div className="vg-orb pointer-events-none absolute inset-0 rounded-[1.5rem] bg-brand/20 blur-2xl" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ASTRO_IMG}
              alt="AstroGuru Ashutosh"
              decoding="async"
              className="relative z-[1] mx-auto h-[260px] w-auto drop-shadow-2xl ring-4 ring-gold/35 sm:h-[300px] md:h-[340px]"
            />
          </div>
          {/* Text */}
          <div className="text-center md:text-left">
            <p className="text-[11px] font-bold uppercase tracking-widest text-brand">Aapka Guide</p>
            <h2 className="mt-2 font-heading text-3xl font-bold sm:text-4xl">AstroGuru Ashutosh</h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground">
              Main sirf chart nahi padhta — aapki situation samajhta hoon.
              Har session mein ek hi goal hota hai:{" "}
              <span className="font-semibold text-foreground">
                aapko woh clarity milni chahiye jo aap saalon se dhoondh rahe hain.
              </span>
            </p>
            <p className="mt-3 text-sm italic text-muted-foreground">
              &ldquo;Ancient intelligence, modern application.&rdquo;
            </p>
            <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4 md:max-w-lg">
              {[
                { n: "5,000+", l: "Readings" },
                { n: "4.9★", l: "Rating" },
                { n: "4+ Yrs", l: "Practice" },
                { n: "15+", l: "Countries" },
              ].map((x) => (
                <div
                  key={x.l}
                  className="rounded-xl border border-border/80 bg-background/80 px-3 py-3 text-center"
                >
                  <p className="font-heading text-lg font-bold text-brand">{x.n}</p>
                  <p className="text-xs text-muted-foreground">{x.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 10. PACKAGES ══════════════════════════════════════════════════════ */}
      <section id="packages" className="scroll-mt-20 bg-surface-warm/30 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4">
          <p className="text-center text-[11px] font-bold uppercase tracking-widest text-brand">Investment</p>
          <h2 className="mt-2 text-center font-heading text-3xl font-bold sm:text-4xl">
            Apna Session Choose Karein
          </h2>
          <p className="mx-auto mt-3 max-w-md text-center text-sm text-muted-foreground">
            Seedha AstroGuru ke saath — koi assistant, koi script nahi.
          </p>
          <div className="mx-auto mt-5 grid max-w-xl gap-2 rounded-2xl border border-brand/20 bg-brand-light/30 p-4 text-[12px] text-foreground sm:grid-cols-2">
            <p><span className="font-semibold">Step 1:</span> Plan choose karein</p>
            <p><span className="font-semibold">Step 2:</span> Details fill karein</p>
            <p><span className="font-semibold">Step 3:</span> Razorpay se secure pay karein</p>
            <p><span className="font-semibold">Step 4:</span> Slot WhatsApp pe confirm</p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2">

            {/* 45 MIN — shown first for price anchoring */}
            <div className="vg-card-glow relative flex flex-col rounded-3xl border-2 border-brand bg-gradient-to-b from-gold-light/50 to-card p-6 shadow-lg shadow-brand/10 ring-1 ring-brand/20 sm:p-8">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-brand px-4 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                Most Popular
              </span>
              <p className="text-sm font-semibold text-brand">Complete session</p>
              <p className="mt-1 font-heading text-5xl font-bold">45 Min</p>
              <p className="mt-1 text-3xl font-bold tracking-tight">₹4,999</p>
              <p className="mt-3 text-sm text-muted-foreground">Poori life reading — career, rishte, finance, future timing.</p>
              {/* Value stack */}
              <div className="mt-4 rounded-xl bg-brand-light/40 px-4 py-3 text-xs space-y-1">
                <p className="font-bold text-brand text-[11px] uppercase tracking-wide mb-2">Kya milega:</p>
                {["Full kundli analysis", "All life areas covered", "Future timing + muhurta", "Personalized remedies", "Session recording"].map((f) => (
                  <div key={f} className="flex items-center gap-2 text-foreground">
                    <Check className="size-3.5 shrink-0 text-brand" strokeWidth={3} /> {f}
                  </div>
                ))}
              </div>
              <Link
                href={CHECKOUT_HREF["45"]}
                onClick={() => track.consultationProductSelected("45min")}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-hover active:scale-[0.97]"
              >
                Book 45 Min Session <ArrowRight className="size-4" />
              </Link>
            </div>

            {/* 15 MIN — entry option */}
            <div className="flex flex-col rounded-3xl border-2 border-border bg-card p-6 shadow-sm sm:p-8">
              <p className="text-sm font-semibold text-brand">Quick focus</p>
              <p className="mt-1 font-heading text-5xl font-bold">15 Min</p>
              <p className="mt-1 text-3xl font-bold tracking-tight">₹1,499</p>
              <p className="mt-3 text-sm text-muted-foreground">Ek specific sawal — seedha, focused, clear answer.</p>
              <div className="mt-4 space-y-2">
                {["Personalized kundli reading", "One specific question — clear answer", "Focused remedy guidance"].map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm text-foreground">
                    <Check className="size-3.5 shrink-0 text-brand" strokeWidth={3} /> {f}
                  </div>
                ))}
              </div>
              <Link
                href={CHECKOUT_HREF["15"]}
                onClick={() => track.consultationProductSelected("15min")}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-3.5 text-sm font-bold text-background shadow-sm transition-all hover:bg-foreground/90 active:scale-[0.97]"
              >
                Book 15 Min Session <ArrowRight className="size-4" />
              </Link>
              <p className="mt-3 text-center text-[11px] text-muted-foreground">
                Ek dinner se bhi kam — ek decision ke liye
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ═══ 11. HOW TO BOOK ═══════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-2xl px-4 py-16 sm:py-20">
        <p className="text-center text-[11px] font-bold uppercase tracking-widest text-brand">Process</p>
        <h2 className="mt-2 text-center font-heading text-3xl font-bold sm:text-4xl">
          Booking Se Session Tak
        </h2>
        <p className="mx-auto mt-3 max-w-sm text-center text-sm text-muted-foreground">
          Clear 4-step process - plan se booking tak sab simple aur direct.
        </p>

        <div className="mt-10 space-y-3">
          {[
            {
              title: "Plan Select Karein",
              desc: "15 min ya 45 min consultation choose karein.",
            },
            {
              title: "Details Fill Karein",
              desc: "Naam, WhatsApp number, DOB aur optional birth details.",
            },
            {
              title: "Secure Payment Karein",
              desc: "Razorpay ke through payment complete karke booking lock karein.",
            },
            {
              title: "Slot Confirm Milega",
              desc: "24h ke andar WhatsApp par time confirm ho jayega.",
            },
          ].map((item, idx) => (
            <div
              key={item.title}
              className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card px-4 py-4 shadow-sm"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                {idx + 1}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-2xl border border-brand/20 bg-brand-light/30 px-4 py-3 text-center">
          <p className="text-xs font-medium text-foreground">
            Payment ke baad aapka booking status confirm ho jata hai, phir session scheduling WhatsApp par hoti hai.
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link
            href={CHECKOUT_HREF["15"]}
            onClick={() => track.consultationProductSelected("15min")}
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-hover active:scale-[0.97]"
          >
            Booking Complete Karein <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* ═══ 12. FAQ ═══════════════════════════════════════════════════════════ */}
      <section className="border-t border-border bg-surface-warm/30 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl px-4">
          <p className="text-center text-[11px] font-bold uppercase tracking-widest text-brand">Sawaal?</p>
          <h2 className="mt-2 text-center font-heading text-3xl font-bold sm:text-4xl">
            Honest Answers
          </h2>
          <div className="mt-10 space-y-3">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm"
              >
                <button
                  type="button"
                  className="flex w-full items-start gap-3 px-5 py-4 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="flex-1 text-sm font-semibold text-foreground">{faq.q}</span>
                  <ChevronDown
                    className={`mt-0.5 size-4 shrink-0 text-brand transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="border-t border-border/60 bg-muted/20 px-5 py-4">
                    <p className="text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 13. FINAL CTA ═════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden border-t border-border bg-gradient-to-br from-[oklch(0.13_0.04_50)] via-[oklch(0.17_0.06_52)] to-[oklch(0.22_0.07_55)] py-20 text-white">
        <div className="vg-orb pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/8 blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: "radial-gradient(circle at 2px 2px, oklch(0.85 0.12 85) 1px, transparent 0)", backgroundSize: "36px 36px" }}
        />
        <div className="relative mx-auto max-w-lg px-4 text-center">
          {/* Scarcity */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/25 bg-white/5 px-4 py-2">
            <span className="vg-slot-blink size-2 rounded-full bg-red-400" />
            <span className="text-xs font-bold text-gold-light/90">
              Sirf limited private slots daily — focused attention ke liye
            </span>
          </div>

          <h2 className="font-heading text-3xl font-bold leading-tight sm:text-4xl">
            Ek Session.
            <br />
            <span className="vg-gold-text">Saalon Ki Clarity.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-sm text-[15px] leading-relaxed text-white/70">
            Bas janm ki details chahiye — baaki sab hum karte hain.
            15 min se shuru karein — bilkul aapki chart ke saath.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3">
            <Link
              href={CHECKOUT_HREF["15"]}
              onClick={() => track.consultationProductSelected("15min")}
              className="inline-flex w-full max-w-[300px] items-center justify-center gap-2 rounded-2xl bg-gold px-8 py-4 text-[15px] font-bold text-[oklch(0.14_0.04_50)] shadow-[0_8px_32px_-8px_rgba(217,119,6,0.6)] transition-all hover:bg-gold-light active:scale-[0.97]"
            >
              15 Min Session Book Karein <ArrowRight className="size-4" />
            </Link>
            <Link
              href={CHECKOUT_HREF["45"]}
              onClick={() => track.consultationProductSelected("45min")}
              className="inline-flex w-full max-w-[300px] items-center justify-center gap-2 rounded-2xl border border-gold/45 bg-white/10 px-8 py-4 text-[15px] font-bold text-gold-light transition-all hover:bg-white/15 active:scale-[0.97]"
            >
              45 Min Deep Session Book Karein
            </Link>
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-white/50">
              <span className="flex items-center gap-1.5"><Lock className="size-3" /> 100% Confidential</span>
              <span className="flex items-center gap-1.5"><Shield className="size-3" /> Secure Payment</span>
              <span className="flex items-center gap-1.5"><MessageCircle className="size-3" /> WhatsApp Support</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
