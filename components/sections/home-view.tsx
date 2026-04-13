import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Star, ChevronRight, Shield, Zap, Lock } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const ASTRO_IMG =
  "https://primedit-cdn.b-cdn.net/shubhmay-lp-kundli/FINAL__1__11zon__1_-removebg-preview.png";

const TRUST_PILLS = [
  { icon: "📊", text: "2,400+ Kundli Analysis" },
  { icon: "⭐", text: "4.9/5 Rating" },
  { icon: "⚡", text: "Instant Result" },
  { icon: "🔒", text: "Private & Surakshit" },
];

const SERVICES = [
  {
    emoji: "🔮",
    title: "Free Kundli",
    subtitle: "Bilkul Free",
    desc: "Aapki kundli ka basic samajh — lagna, moon sign, nakshatra, aur key life patterns.",
    cta: "Free Kundli Banwayein",
    href: "/free-kundli",
    highlight: false,
  },
  {
    emoji: "📜",
    title: "Detailed Kundli Report",
    subtitle: "₹399",
    desc: "Deep analysis — mahadasha timeline, house-by-house reading, remedies, aur major timing.",
    cta: "Report Dekhein",
    href: "/kundli-report",
    highlight: true,
  },
  {
    emoji: "🙏",
    title: "Personal Consultation",
    subtitle: "Direct baat",
    desc: "AstroGuru Ashutosh se seedha baat karein — aapke sawal, clear guidance.",
    cta: "Consultation Book Karein",
    href: "/consultation",
    highlight: false,
  },
];

const UNDERSTAND_POINTS = [
  {
    emoji: "💼",
    title: "Career",
    desc: "Sahi direction kya hai — kab switch karein, kab rukein, kab jump lein.",
  },
  {
    emoji: "❤️",
    title: "Rishte",
    desc: "Relationship mein same pattern kyun repeat hota hai — aur iska kya karna hai.",
  },
  {
    emoji: "💰",
    title: "Paisa",
    desc: "Kab flow aayega, kab block hai — dhan yog ki exact timing.",
  },
  {
    emoji: "🔁",
    title: "Life Patterns",
    desc: "Jo baar baar hota hai — uska source kya hai, aur clarity kaise milegi.",
  },
];

const STEPS = [
  {
    num: "01",
    emoji: "📝",
    title: "Janam Details Daaliye",
    desc: "Naam, DOB, birth time aur city — 2 minute ka kaam.",
  },
  {
    num: "02",
    emoji: "⚡",
    title: "Free Kundli Dekhiye",
    desc: "Vedic calculation instantly — aapka chart ready ho jaata hai.",
  },
  {
    num: "03",
    emoji: "📜",
    title: "Detailed Report Unlock Karein",
    desc: "Deep insights ke liye ₹399 ka personalized report available hai.",
  },
];

const TESTIMONIALS = [
  {
    name: "Vikram T.",
    city: "Pune",
    tag: "Career",
    stars: 5,
    text: "Job chor ke business kiya aur ab job se 5 guna kama raha hu. Kundli ne exact timing batai thi — believe nahi hua tha pehle.",
  },
  {
    name: "Ankit M.",
    city: "Delhi",
    tag: "Relationship",
    stars: 5,
    text: "Relationship mein bahut confusion tha. Ashutosh ji ne chart dekh ke exactly woh baat batayi jo main samajh nahi pa raha tha.",
  },
  {
    name: "Priya S.",
    city: "Mumbai",
    tag: "Career",
    stars: 5,
    text: "3 saal se promotion nahi mil rahi thi. Report mein exactly yahi pattern tha. 2 mahine mein promotion mili.",
  },
];

const RELATABLE_POINTS = [
  "Mehnat karte ho, par cheezein rukti rehti hain?",
  "Ek hi tarah ke log baar baar milte hain?",
  "Decision lena mushkil lagta hai — right ya wrong?",
  "Aisa lagta hai kuch choot raha hai — pata nahi kya?",
];

// ─── Component ────────────────────────────────────────────────────────────────

export function HomeView() {
  return (
    <div className="overflow-x-hidden">
      <style>{`
        @keyframes float-up-down {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-7px); }
        }
        @keyframes glow-cta {
          0%, 100% { box-shadow: 0 0 0 0 rgba(180,83,9,0.4); }
          60% { box-shadow: 0 0 0 12px rgba(180,83,9,0); }
        }
        @keyframes shimmer-brand {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes orb-pulse {
          0%, 100% { opacity: 0.10; transform: scale(1); }
          50%       { opacity: 0.20; transform: scale(1.08); }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .float-img   { animation: float-up-down 4s ease-in-out infinite; }
        .glow-btn    { animation: glow-cta 2.8s ease-in-out infinite; }
        .shimmer-text {
          background: linear-gradient(90deg, #b45309 0%, #d97706 35%, #f59e0b 55%, #b45309 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer-brand 3s linear infinite;
        }
        .orb-bg { animation: orb-pulse 5s ease-in-out infinite; }
        .fade-up-1 { animation: fade-up 0.55s ease-out 0.05s both; }
        .fade-up-2 { animation: fade-up 0.55s ease-out 0.18s both; }
        .fade-up-3 { animation: fade-up 0.55s ease-out 0.30s both; }
        .fade-up-4 { animation: fade-up 0.55s ease-out 0.42s both; }
        .card-hover { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .card-hover:hover { transform: translateY(-3px); box-shadow: 0 10px 28px rgba(0,0,0,0.09); }
      `}</style>

      {/* ─── 1. HERO ──────────────────────────────────────────────────────── */}
      <section className="spiritual-pattern relative min-h-[92vh] overflow-hidden px-4 py-16 md:py-20">
        <div className="orb-bg pointer-events-none absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/10 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
        <div className="pointer-events-none absolute left-0 top-20 h-56 w-56 rounded-full bg-brand/8 blur-3xl" />

        <div className="relative z-10 mx-auto flex min-h-[92vh] w-full max-w-6xl flex-col items-center justify-center text-center">
          <div className="fade-up-1 mb-5 inline-flex items-center gap-2 rounded-full border border-brand/25 bg-gold-light/90 px-4 py-2 shadow-sm">
            <span className="text-base">🪔</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand">
              Vedic Astrology · AstroGuru Ashutosh
            </span>
          </div>

          <div className="fade-up-1 mb-4 flex flex-wrap items-center justify-center gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-surface px-2.5 py-1 font-semibold text-foreground">
              <Star size={12} className="fill-gold text-gold" />
              4.9 Rated
            </span>
            <span className="rounded-full border border-border/70 bg-surface px-2.5 py-1 font-semibold text-muted-foreground">
              15+ Countries
            </span>
            <span className="rounded-full border border-border/70 bg-surface px-2.5 py-1 font-semibold text-muted-foreground">
              1237+ Sessions
            </span>
          </div>

          <h1 className="fade-up-2 font-heading text-[2.85rem] font-bold leading-[1.05] tracking-tight text-foreground sm:text-[4.2rem] lg:text-[5rem]">
            Aapki Kundli,{" "}
            <span className="shimmer-text">Aapki Clarity</span>
          </h1>

          <p className="fade-up-3 mt-6 max-w-3xl text-[16px] leading-relaxed text-muted-foreground sm:text-[18px]">
            Career, rishte, paisa aur life direction par practical guidance paayiye.
            Pehle direct personalized kundli dekhein, phir zarurat ho to consultation book karein.
          </p>

          <div className="fade-up-4 mt-10 flex w-full max-w-[380px] flex-col gap-3 sm:max-w-none sm:flex-row sm:items-center sm:justify-center">
            <Link
              id="home-hero-free-kundli-cta"
              href="/kundli"
              className="glow-btn flex items-center justify-center gap-2 rounded-2xl bg-brand px-8 py-4 text-[16px] font-bold text-white shadow-md transition-all hover:bg-brand-hover active:scale-[0.97]"
            >
              Direct Kundli Dekhein
              <ArrowRight size={18} />
            </Link>
            <Link
              id="home-hero-kundli-report-cta"
              href="/consultation"
              className="flex items-center justify-center gap-2 rounded-2xl border border-border/80 bg-background/90 px-8 py-4 text-[15px] font-semibold text-foreground transition-all hover:border-brand/40 hover:bg-surface active:scale-[0.97]"
            >
              Consultation Book Karein
            </Link>
          </div>

          <p className="fade-up-4 mt-4 text-[12px] text-muted-foreground">
            ✓ Personalized guidance &nbsp;·&nbsp; ✓ Fast checkout &nbsp;·&nbsp; ✓ Private & secure
          </p>

          <div className="fade-up-4 mt-10 grid w-full gap-3 sm:grid-cols-3">
            {[
              { icon: "💼", title: "Career Timing", sub: "Kab switch karein, kab grow karein" },
              { icon: "❤️", title: "Relationship Clarity", sub: "Pattern samjho, next step clear karo" },
              { icon: "💰", title: "Money & Stability", sub: "Flow aur blocks dono ka reason" },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-border/65 bg-background/70 px-4 py-3 text-center shadow-sm backdrop-blur-[1px]"
              >
                <p className="text-lg">{item.icon}</p>
                <p className="mt-1 text-sm font-bold text-foreground">{item.title}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{item.sub}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[11px]">
            {["Vedic-based", "Actionable Guidance", "No Confusing Jargon", "Real Human Support"].map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-brand/20 bg-brand-light/40 px-3 py-1 font-semibold text-brand"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 2. TRUST STRIP ───────────────────────────────────────────────── */}
      <div className="cv-auto border-y border-border/60 bg-surface py-4">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-6 px-4">
          {TRUST_PILLS.map((p) => (
            <span
              key={p.text}
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground"
            >
              <span className="text-base">{p.icon}</span>
              {p.text}
            </span>
          ))}
        </div>
      </div>

      {/* ─── 3. ABOUT ASTROGURU ───────────────────────────────────────────── */}
      <section className="cv-auto px-4 py-16 md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center gap-10 md:flex-row md:gap-14">

            {/* Image */}
            <div className="relative shrink-0">
              <div className="absolute inset-0 -m-3 rounded-3xl bg-gradient-to-br from-gold-light to-brand-light/50 blur-sm" />
              <div className="relative overflow-hidden rounded-3xl border border-brand/15 bg-gradient-to-br from-gold-light/60 to-brand-light/30 shadow-xl">
                <Image
                  src={ASTRO_IMG}
                  alt="AstroGuru Ashutosh"
                  width={260}
                  height={320}
                  style={{ width: "auto" }}
                  className="h-[260px] object-contain sm:h-[300px]"
                />
              </div>
            </div>

            {/* Text */}
            <div className="text-center md:text-left">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-brand">
                Aapka Guide
              </p>
              <h2 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
                AstroGuru Ashutosh
              </h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground">
                Vedic astrology ke sath kaam karte hue unka focus sirf ek cheez
                par hai — <span className="font-semibold text-foreground">clarity dena, darana nahi.</span>
              </p>
              <div className="mt-6 space-y-3">
                {[
                  { emoji: "📖", text: "Kundli ko simple language mein samjhana — bina jargon ke" },
                  { emoji: "🧭", text: "Aapke actual questions pe focus — career, rishte, paisa" },
                  { emoji: "🌿", text: "Human approach — aapko judge nahi kiya jaata" },
                  { emoji: "✨", text: "Tradition aur practicality ka balance" },
                ].map((item) => (
                  <div key={item.text} className="flex items-start gap-3 text-left">
                    <span className="mt-0.5 shrink-0 text-lg">{item.emoji}</span>
                    <p className="text-[14px] text-muted-foreground">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. SERVICES ──────────────────────────────────────────────────── */}
      <section className="cv-auto bg-surface px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-brand">
              VedGuide Par
            </p>
            <h2 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
              Kya Milta Hai?
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Har stage ke liye ek option — free se start, deep tak jaayein.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            {SERVICES.map((s) => (
              <div
                key={s.title}
                className={`card-hover flex flex-col rounded-2xl border p-6 shadow-sm ${
                  s.highlight
                    ? "border-brand/30 bg-gradient-to-br from-gold-light/80 to-brand-light/30"
                    : "border-border/60 bg-background"
                }`}
              >
                <div className="mb-1 text-3xl">{s.emoji}</div>
                <span
                  className={`mt-2 text-[11px] font-bold uppercase tracking-wide ${
                    s.highlight ? "text-brand" : "text-muted-foreground"
                  }`}
                >
                  {s.subtitle}
                </span>
                <h3 className="font-heading mt-1 text-xl font-bold text-foreground">
                  {s.title}
                </h3>
                <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-muted-foreground">
                  {s.desc}
                </p>
                <Link
                  id={`home-service-${s.href === "/free-kundli" ? "free-kundli" : s.href === "/kundli-report" ? "kundli-report" : "consultation"}-cta`}
                  href={s.href}
                  className={`mt-5 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all active:scale-[0.97] ${
                    s.highlight
                      ? "bg-brand text-white hover:bg-brand-hover"
                      : "border border-border/80 text-foreground hover:border-brand/40 hover:bg-surface"
                  }`}
                >
                  {s.cta} <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center">
            <Link
              id="home-browse-tools-link"
              href="/tools"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-brand underline-offset-4 hover:underline"
            >
              Browse all tools <ArrowRight size={14} />
            </Link>
          </p>
        </div>
      </section>

      {/* ─── 5. WHAT YOU'LL UNDERSTAND ────────────────────────────────────── */}
      <section className="cv-auto px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 text-center">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-brand">
              Clarity Milegi
            </p>
            <h2 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
              Aapko Kya Samajh Aayega?
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Heavy astrology terms nahi — sirf useful, real-life answers.
            </p>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-4">
            {UNDERSTAND_POINTS.map((p) => (
              <div
                key={p.title}
                className="card-hover shrink-0 w-[72vw] rounded-2xl border border-border/60 bg-surface p-5 sm:w-auto"
              >
                <div className="mb-3 text-3xl">{p.emoji}</div>
                <h3 className="font-heading text-[17px] font-bold text-foreground">
                  {p.title}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                  {p.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-9 text-center">
            <Link
              id="home-understand-free-kundli-cta"
              href="/free-kundli"
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-7 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-hover active:scale-[0.97]"
            >
              Apni Kundli Mein Dekho <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 6. HOW IT WORKS ──────────────────────────────────────────────── */}
      <section className="cv-auto bg-surface px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 text-center">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-brand">
              Simple Process
            </p>
            <h2 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
              Kaise Shuru Karein?
            </h2>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            {STEPS.map((step, i) => (
              <div
                key={step.num}
                className="relative flex flex-1 items-start gap-4 rounded-2xl border border-border/60 bg-background p-5 shadow-sm sm:flex-col sm:items-center sm:text-center"
              >
                {i < STEPS.length - 1 && (
                  <div className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-border/60 bg-background p-1 shadow-sm sm:flex">
                    <ChevronRight size={14} className="text-brand" />
                  </div>
                )}
                <div className="flex shrink-0 flex-col items-center gap-1">
                  <span className="text-3xl">{step.emoji}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-brand/60">
                    {step.num}
                  </span>
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-9 text-center">
            <Link
              id="home-how-it-works-free-kundli-cta"
              href="/free-kundli"
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-7 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-hover active:scale-[0.97]"
            >
              Abhi Shuru Karein — Free Hai <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 7. TESTIMONIALS ──────────────────────────────────────────────── */}
      <section className="cv-auto px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 text-center">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-brand">
              Real Stories
            </p>
            <h2 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
              Logon Ki Zindagi Badli
            </h2>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="card-hover shrink-0 w-[82vw] rounded-2xl border border-border/60 bg-background p-5 shadow-sm sm:w-auto"
              >
                <div className="mb-3 flex items-center gap-1">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} size={13} className="fill-gold text-gold" />
                  ))}
                  <span className="ml-auto rounded-full bg-brand-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand">
                    {t.tag}
                  </span>
                </div>
                <p className="text-[13.5px] leading-relaxed text-foreground">
                  {"\u201C"}
                  {t.text}
                  {"\u201D"}
                </p>
                <p className="mt-4 text-xs font-semibold text-muted-foreground">
                  — {t.name}, {t.city}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 8. RELATABILITY (SOFT) ───────────────────────────────────────── */}
      <section className="cv-auto bg-surface px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-brand">
            Aapko Bhi?
          </p>
          <h2 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
            Kya Aapke Saath Bhi Aisa Hota Hai?
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Akele nahi hain aap — yeh patterns bahut common hain.
          </p>

          <div className="mt-8 space-y-3">
            {RELATABLE_POINTS.map((point) => (
              <div
                key={point}
                className="flex items-center gap-3 rounded-xl border border-border/60 bg-background px-5 py-3.5 text-left shadow-sm"
              >
                <span className="shrink-0 text-lg">🌀</span>
                <p className="text-[14px] text-foreground">{point}</p>
              </div>
            ))}
          </div>

          <p className="mt-8 text-[14px] text-muted-foreground">
            Inka jawab aapki kundli mein hai.{" "}
            <span className="font-semibold text-foreground">Ashutosh ji ne hazaron logon ke liye yeh patterns decode kiye hain.</span>
          </p>
        </div>
      </section>

      {/* ─── Trust icons strip ────────────────────────────────────────────── */}
      <section className="cv-auto px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { icon: <Shield size={20} />, title: "100% Secure", desc: "Data protected, no sharing" },
              { icon: <Zap size={20} />, title: "Instant Result", desc: "No wait, no delay" },
              { icon: <Lock size={20} />, title: "Privacy First", desc: "Sirf aapka — kisi ke saath share nahi" },
            ].map((item) => (
              <div key={item.title} className="flex flex-col items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-light text-brand">
                  {item.icon}
                </div>
                <p className="text-xs font-bold text-foreground">{item.title}</p>
                <p className="text-[11px] leading-tight text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 9. FINAL CTA ─────────────────────────────────────────────────── */}
      <section className="cv-auto spiritual-pattern relative overflow-hidden px-4 py-20 text-center">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-72 w-72 rounded-full bg-brand/8 blur-3xl" />
        </div>
        <div className="relative z-10 mx-auto max-w-md">
          <div className="mb-4 text-4xl">🪔</div>
          <h2 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
            Apni Kundli Check Karein
            <br />
            <span className="shimmer-text">— Free Mein</span>
          </h2>
          <p className="mt-4 text-[14px] text-muted-foreground">
            Bas janam ki details chahiye — baaki sab Ashutosh ji ke system se
            hota hai. Free hai, 2 minute lagenge.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <Link
              id="home-final-free-kundli-cta"
              href="/free-kundli"
              className="glow-btn flex w-full max-w-[300px] items-center justify-center gap-2 rounded-2xl bg-brand px-8 py-4 text-[15px] font-bold text-white shadow-lg transition-all hover:bg-brand-hover active:scale-[0.97]"
            >
              Free Kundli Banwayein <ArrowRight size={17} />
            </Link>
            <p className="text-xs text-muted-foreground">
              Free · Instant · No signup needed
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
