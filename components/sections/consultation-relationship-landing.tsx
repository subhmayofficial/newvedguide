"use client";

import Link from "next/link";
import { useEffect, useState, type MouseEvent } from "react";
import {
  ArrowRight, Heart, Clock, Sparkles, Target, Zap, TrendingUp,
  Star, Shield, Lock, MessageCircle, ChevronDown, Check, Quote, Play,
} from "lucide-react";
import { track } from "@/lib/analytics/events";
import { getWhatsAppHref } from "@/lib/constants/contact";

// ─── Assets ───────────────────────────────────────────────────────────────────

const ASTRO_IMG = "https://primedit-cdn.b-cdn.net/ashutoshji.jpg";

const CHECKOUT_HREF = {
  "15": "/checkout/consultation?pkg=15&variant=relationship",
  "45": "/checkout/consultation?pkg=45&variant=relationship",
} as const;

// ─── Data ─────────────────────────────────────────────────────────────────────

const SIGNALS = [
  { text: "Same fights baar baar — wajah samajh nahi aati", icon: Target },
  { text: "Shaadi ki baat chal rahi hai, par sahi time pata nahi", icon: Clock },
  { text: "Partner se distance badh raha hai — kyun, clear nahi", icon: Heart },
  { text: "Compatibility ko lekar doubt — sahi insaan hai ya nahi?", icon: Sparkles },
  { text: "Akela mahsoos karte ho — koi commit nahi kar raha", icon: Zap },
];

const TIMELINE = [
  { label: "Rishte mein confusion", state: "before" },
  { label: "Compatibility clear samajh", state: "after" },
  { label: "Shaadi ki timing pata nahi", state: "before" },
  { label: "Exact favorable window mila", state: "after" },
  { label: "Same fights repeat hote", state: "before" },
  { label: "Root cause clear — solve ho saka", state: "after" },
  { label: "Commitment ka darr", state: "before" },
  { label: "Confidence ke saath decision", state: "after" },
] as const;

const WHAT_YOU_GET = [
  { icon: Heart, title: "Compatibility analysis", desc: "Partner ke saath kundli match — kahan strong hai, kahan friction." },
  { icon: Clock, title: "Shaadi ki timing", desc: "Kab favorable hai — specific period, exact number ke saath." },
  { icon: Sparkles, title: "Dosh aur blockages", desc: "Manglik ya doshas ka effect — practical, fear-free explanation." },
  { icon: Target, title: "Pattern identify hoga", desc: "Same fights baar baar kyun — exact karan samjhayenge." },
  { icon: Zap, title: "Simple remedies", desc: "Relationship ke liye specific, follow-karne layak upay." },
  { icon: TrendingUp, title: "Aage ka raasta", desc: "Decision lena hai ya wait — clear direction milegi." },
];

const SPOTLIGHT = {
  initial: "M", name: "Meera S.", city: "Pune, 28", tag: "Marriage",
  text: "Shaadi ke 2 saal baad bhi bahut tension tha. Session mein samjha — planetary period ka effect hai. Remedies follow ki. 1.5 saal ho gaye — ghar peaceful hai.",
  outcome: "Relationship stable for 1.5+ years",
};

const TESTIMONIALS = [
  {
    initial: "A", name: "Ananya P.", city: "Delhi, 26", tag: "Relationship",
    text: "3 saal ka relationship tha, commitment nahi mil raha tha. Ashutosh ji ne exact timing batayi — 4 mahine baad proposal aa gaya.",
    outcome: "Engaged in 4 months",
  },
  {
    initial: "S", name: "Sandeep R.", city: "Jaipur, 33", tag: "Marriage Timing",
    text: "Family pressure tha shaadi ke liye, par sahi time nahi pata tha. Chart se exact window mili. Wahi time pe rishta hua aur ab dono khush hain.",
    outcome: "Married within the window",
  },
];

const FAQS = [
  { q: "Kya aap match-making bhi karte ho?", a: "Haan, partner ki details ke saath compatibility discuss kar sakte hain. Bina partner details ke bhi aapki apni chart se relationship pattern clear ho jata hai." },
  { q: "Kya Manglik dosh sach mein problem deta hai?", a: "Effect hota hai, lekin remedies se manage ho jata hai. Session mein fear nahi — practical solution milega." },
  { q: "Breakup ho gaya hai — kya wapas aane ka chance dekh sakte ho?", a: "Chart se current period aur possibility discuss kar sakte hain. Honest answer milega — chahe positive ho ya nahi." },
  { q: "Shaadi ki exact date bhi bata sakte ho?", a: "Favorable period/window batate hain — exact muhurta ke liye 45 min session better hai jisme detailed timing cover hoti hai." },
  { q: "Session Hindi ya English mein hoga?", a: "Dono mein comfortable — jo bhi aapko aasan lage. AstroGuru Ashutosh Hindi aur English dono mein session karte hain." },
  { q: "Mera data confidential rahega?", a: "Bilkul. Aapki birth details aur conversation 100% private rakhi jati hai, kisi third party ke saath share nahi hoti." },
  { q: "Booking ke baad time reschedule kar sakte hain?", a: "Haan, slot confirm hone se pehle WhatsApp par bata dein — hum aapke liye doosra time adjust kar dete hain." },
  { q: "Agar session se satisfied nahi hue toh?", a: "Hamara goal hai ki aapko clear, honest answer mile. Koi issue ho toh seedha WhatsApp par humse baat karein — hum resolve karne ki koshish karte hain." },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function ConsultationRelationshipLanding() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    track.consultationPageViewed("consultation_landing_relationship");
  }, []);

  function handlePackagesClick(e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    track.consultationProductSelected("compare_packages");
    document.getElementById("packages")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="overflow-x-hidden bg-[oklch(0.985_0.008_20)] text-[oklch(0.24_0.03_15)]">
      <style>{`
        @keyframes rel-float    { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-8px) rotate(1deg); } }
        @keyframes rel-pulse    { 0%, 100% { opacity: 0.55; transform: scale(1); } 50% { opacity: 1; transform: scale(1.08); } }
        @keyframes rel-shimmer  { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes rel-orbit    { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes rel-drift    { 0%, 100% { opacity: 0.18; transform: translateY(0); } 50% { opacity: 0.32; transform: translateY(-6px); } }
        .rel-float   { animation: rel-float 6s ease-in-out infinite; }
        .rel-pulse   { animation: rel-pulse 2.2s ease-in-out infinite; }
        .rel-orbit   { animation: rel-orbit 60s linear infinite; }
        .rel-drift   { animation: rel-drift 5s ease-in-out infinite; }
        .rel-gradient-text {
          background: linear-gradient(90deg, #9f1239 0%, #e11d48 35%, #fb7185 55%, #9f1239 100%);
          background-size: 200% auto;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          animation: rel-shimmer 4s linear infinite;
        }
      `}</style>

      {/* ═══ 1. HERO — two charts becoming one ═══════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[oklch(0.22_0.06_15)] via-[oklch(0.28_0.09_12)] to-[oklch(0.36_0.1_18)] py-14 sm:py-20">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{ backgroundImage: "radial-gradient(circle at 2px 2px, oklch(0.9 0.05 15) 1px, transparent 0)", backgroundSize: "34px 34px" }}
        />
        <div className="rel-drift pointer-events-none absolute -top-16 right-[8%] h-72 w-72 rounded-full bg-rose-500/15 blur-3xl" />
        <div className="rel-drift pointer-events-none absolute bottom-[-4rem] left-[4%] h-80 w-80 rounded-full bg-fuchsia-500/10 blur-3xl [animation-delay:-2.5s]" />

        <div className="relative mx-auto max-w-5xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            {/* Identity strip — face + name + verified, compact */}
            <div className="mx-auto mb-4 inline-flex items-center gap-2.5 rounded-full border border-rose-300/25 bg-white/5 py-1.5 pl-1.5 pr-4 backdrop-blur-sm">
              <div className="relative size-7 shrink-0 overflow-hidden rounded-full ring-1 ring-rose-300/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ASTRO_IMG} alt="AstroGuru Ashutosh" className="size-full object-cover" />
              </div>
              <span className="flex items-center gap-1 text-[11px] font-bold text-rose-100/95">
                AstroGuru Ashutosh
                <Check className="size-3 rounded-full bg-rose-400 p-0.5 text-[oklch(0.22_0.06_15)]" strokeWidth={4} />
              </span>
            </div>

            <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-rose-300/25 bg-white/5 px-3.5 py-1.5 backdrop-blur-sm">
              <span className="rel-pulse size-1.5 rounded-full bg-rose-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-rose-200/95">
                Relationship &amp; Marriage Guidance · Live Chat or Call
              </span>
            </div>

            <h1 className="font-heading text-[1.7rem] font-bold leading-[1.15] tracking-tight text-white sm:text-[2.3rem] lg:text-[3.1rem]">
              Apne Rishte Ki <span className="rel-gradient-text">Sachai</span> Jaaniye
            </h1>

            <p className="mx-auto mt-4 max-w-lg text-[13px] leading-relaxed text-rose-50/85 sm:text-[15px]">
              Rishta stuck lagta hai ya shaadi ki timing samajh nahi aa rahi?{" "}
              <span className="font-semibold text-white/95">
                Ek live chat ya call session — exact jawab milega: kyun aisa ho raha hai, aur kab clarity aayegi.
              </span>
            </p>

            {/* Video placeholder — 16:9 */}
            <div className="mx-auto mt-7 w-full max-w-xl">
              <button
                type="button"
                className="group relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl border border-rose-300/25 bg-gradient-to-br from-rose-950/60 via-[oklch(0.3_0.08_14)] to-fuchsia-950/40 shadow-[0_12px_40px_-12px_rgba(225,29,72,0.4)]"
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.12]"
                  style={{ backgroundImage: "radial-gradient(circle at 2px 2px, oklch(0.9 0.05 15) 1px, transparent 0)", backgroundSize: "28px 28px" }}
                />
                <span className="relative z-[1] flex size-14 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm transition-transform group-hover:scale-110 group-active:scale-95 sm:size-16">
                  <Play className="size-6 fill-white text-white sm:size-7" />
                </span>
                <span className="absolute bottom-3 left-3 rounded-md bg-black/30 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-rose-100/80">
                  Video coming soon
                </span>
              </button>
            </div>

            <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
              <Link
                href={CHECKOUT_HREF["15"]}
                onClick={() => track.consultationProductSelected("15min")}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-fuchsia-500 px-6 py-3.5 text-[14px] font-bold text-white shadow-[0_10px_28px_-8px_rgba(225,29,72,0.55)] transition-all hover:brightness-110 active:scale-[0.97] sm:w-auto"
              >
                15 Min Session Book Karein
                <ArrowRight className="size-4" />
              </Link>
              <a
                href="#packages"
                onClick={handlePackagesClick}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-3.5 text-[14px] font-bold text-white transition-all hover:bg-white/15 active:scale-[0.97] sm:w-auto"
              >
                Plans Dekhein
              </a>
            </div>

            <p className="mt-3 text-[11px] font-medium text-rose-100/70">
              Sessions starting <span className="font-bold text-rose-200">₹1,499</span> · Razorpay se secure payment
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-[11px] text-rose-100/70">
              <span className="flex items-center gap-1.5"><Lock className="size-3" /> 100% Confidential</span>
              <span>·</span>
              <span className="flex items-center gap-1.5"><Star className="size-3 fill-rose-300 text-rose-300" /> 5,000+ couples helped</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 2. STATS STRIP ═══════════════════════════════════════════════════ */}
      <section className="border-b border-rose-200/50 bg-white py-9">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 px-4 sm:grid-cols-4">
          {[
            { n: "1237+", l: "Sessions done" },
            { n: "4.9★", l: "Avg rating" },
            { n: "4+ Yrs", l: "Experience" },
            { n: "15+", l: "Countries" },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <p className="font-heading text-2xl font-bold text-rose-600 sm:text-3xl">{s.n}</p>
              <p className="mt-1 text-xs font-medium text-rose-900/55">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ 3. SIGNAL CHECKLIST ═════════════════════════════════════════════ */}
      <section className="mx-auto max-w-2xl px-4 py-16 sm:py-20">
        <p className="text-center text-[11px] font-bold uppercase tracking-widest text-rose-500">Quick check</p>
        <h2 className="mt-2 text-center font-heading text-3xl font-bold text-rose-950 sm:text-4xl">
          Kya Yeh Signals Familiar Lagte Hain?
        </h2>

        <div className="mt-10 overflow-hidden rounded-3xl border border-rose-200/70 bg-gradient-to-b from-rose-50 to-white shadow-sm">
          {SIGNALS.map((s, i) => (
            <div
              key={s.text}
              className={`flex items-center gap-4 px-5 py-4 ${i !== SIGNALS.length - 1 ? "border-b border-rose-100" : ""}`}
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <s.icon className="size-4" strokeWidth={2} />
              </div>
              <span className="text-[13.5px] leading-snug text-rose-950/85">{s.text}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-3xl border-2 border-rose-200 bg-gradient-to-br from-rose-100 via-rose-50 to-fuchsia-50 p-6 text-center shadow-sm">
          <p className="font-heading text-xl font-bold text-rose-950 sm:text-2xl">Yeh sirf bad luck nahi.</p>
          <p className="mt-2 text-[14.5px] leading-relaxed text-rose-950/65">
            Aapki kundli mein relationship pattern dikhta hai — partner compatibility, timing, aur blockages.{" "}
            <span className="font-semibold text-rose-950">
              Ek session mein clear: kya chal raha hai, aur shaadi/rishta kab smooth hoga.
            </span>
          </p>
          <a
            href="#packages"
            onClick={handlePackagesClick}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-rose-700 active:scale-[0.97]"
          >
            Dono Plans Dekhein <ArrowRight className="size-4" />
          </a>
        </div>
      </section>

      {/* ═══ 4. SKEPTIC QUOTE ═════════════════════════════════════════════════ */}
      <section className="border-y border-rose-200/60 bg-[oklch(0.24_0.06_15)] py-14 text-white">
        <div className="mx-auto max-w-xl px-4 text-center">
          <Quote className="mx-auto size-7 text-rose-300/60" />
          <h2 className="mt-4 font-heading text-2xl font-bold sm:text-3xl">
            &ldquo;Main astrology mein believe nahi karta.&rdquo;
          </h2>
          <p className="mt-5 text-[15px] leading-relaxed text-rose-50/82">
            Theek hai. Hamare zyaada clients pehle yahi sochte the.
            <br className="hidden sm:block" />
            Ek baar aao — suno — phir decide karo khud.
          </p>
          <a
            href="#packages"
            onClick={handlePackagesClick}
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-rose-300/40 bg-rose-400/10 px-6 py-3 text-sm font-bold text-rose-200 transition-all hover:bg-rose-400/15"
          >
            15 Min Trial Session Dekho <ArrowRight className="size-4" />
          </a>
        </div>
      </section>

      {/* ═══ 5. TIMELINE — today vs after session ═══════════════════════════ */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:py-20">
        <p className="text-center text-[11px] font-bold uppercase tracking-widest text-rose-500">Transformation</p>
        <h2 className="mt-2 text-center font-heading text-3xl font-bold text-rose-950 sm:text-4xl">
          Ek Session Ke Baad
        </h2>

        <div className="relative mt-12">
          <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-rose-200 via-rose-300 to-fuchsia-200 sm:block" />
          <div className="space-y-3">
            {Array.from({ length: TIMELINE.length / 2 }).map((_, i) => {
              const before = TIMELINE[i * 2];
              const after = TIMELINE[i * 2 + 1];
              return (
                <div key={before.label} className="grid items-center gap-2 sm:grid-cols-[1fr_2.5rem_1fr]">
                  <div className="flex items-center gap-2 rounded-xl border border-rose-200/70 bg-rose-50/70 px-4 py-3 text-[13px] text-rose-950/80 sm:justify-end sm:text-right">
                    <span>{before.label}</span>
                  </div>
                  <div className="hidden justify-center sm:flex">
                    <div className="relative flex size-7 items-center justify-center rounded-full bg-white ring-2 ring-rose-300">
                      <Heart className="size-3.5 fill-rose-400 text-rose-400" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-200/70 bg-emerald-50/70 px-4 py-3 text-[13px] font-medium text-emerald-900/85">
                    <Check className="size-3.5 shrink-0 text-emerald-600" strokeWidth={3} />
                    <span>{after.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 text-center">
          <a
            href="#packages"
            onClick={handlePackagesClick}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-rose-700 active:scale-[0.97]"
          >
            Yeh Result Chahiye <ArrowRight className="size-4" />
          </a>
        </div>
      </section>

      {/* ═══ 6. WHAT YOU GET ══════════════════════════════════════════════════ */}
      <section className="border-y border-rose-200/50 bg-gradient-to-b from-rose-50/60 to-white py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4">
          <p className="text-center text-[11px] font-bold uppercase tracking-widest text-rose-500">Session mein</p>
          <h2 className="mt-2 text-center font-heading text-3xl font-bold text-rose-950 sm:text-4xl">
            Sirf Aapke Rishte Par — Poora Focus
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm text-rose-950/55">
            Koi generic compatibility match nahi. Aapki chart, aapka rishta, specific guidance.
          </p>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {WHAT_YOU_GET.map(({ icon: Icon, title, desc }) => (
              <li
                key={title}
                className="flex gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-rose-100"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-fuchsia-500 text-white">
                  <Icon className="size-5" strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-rose-950">{title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-rose-950/55">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ═══ 7. SPOTLIGHT STORY + TESTIMONIALS ═══════════════════════════════ */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:py-20">
        <p className="text-center text-[11px] font-bold uppercase tracking-widest text-rose-500">Real stories</p>
        <h2 className="mt-2 text-center font-heading text-3xl font-bold text-rose-950 sm:text-4xl">
          Unka Rishta Badla — Ek Session Mein
        </h2>

        <div className="mt-10 grid gap-5 lg:grid-cols-[1.3fr_1fr]">
          {/* Spotlight */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-600 to-fuchsia-600 p-7 text-white shadow-lg sm:p-9">
            <Quote className="absolute -right-2 -top-2 size-24 text-white/10" />
            <div className="relative flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-white/15 font-heading text-lg font-bold">
                {SPOTLIGHT.initial}
              </div>
              <div>
                <p className="text-sm font-bold">{SPOTLIGHT.name}</p>
                <p className="text-xs text-white/70">{SPOTLIGHT.city} · {SPOTLIGHT.tag}</p>
              </div>
            </div>
            <p className="relative mt-5 text-[15px] leading-relaxed text-white/90">
              &ldquo;{SPOTLIGHT.text}&rdquo;
            </p>
            <div className="relative mt-6 inline-flex items-center gap-2 rounded-xl bg-white/15 px-3.5 py-2">
              <Check className="size-3.5 text-white" strokeWidth={3} />
              <p className="text-[12px] font-bold">{SPOTLIGHT.outcome}</p>
            </div>
          </div>

          {/* Secondary testimonials */}
          <div className="space-y-4">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-2xl border border-rose-100 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-rose-100 font-heading text-sm font-bold text-rose-600">
                    {t.initial}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-rose-950">{t.name}</p>
                    <p className="text-[11px] text-rose-950/50">{t.city}</p>
                  </div>
                  <span className="ml-auto rounded-full bg-rose-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-rose-500">
                    {t.tag}
                  </span>
                </div>
                <p className="mt-3 text-[12.5px] leading-relaxed text-rose-950/75">&ldquo;{t.text}&rdquo;</p>
                <p className="mt-3 text-[11px] font-bold text-emerald-600">✓ {t.outcome}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 8. GURU INTRO ════════════════════════════════════════════════════ */}
      <section className="border-t border-rose-200/50 bg-gradient-to-b from-white to-rose-50/40 py-16 sm:py-20">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-10 px-4 md:flex-row md:gap-14">
          <div className="rel-float relative shrink-0">
            <div className="rel-orbit pointer-events-none absolute inset-[-16px] rounded-full border border-dashed border-rose-300/50" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ASTRO_IMG}
              alt="AstroGuru Ashutosh"
              decoding="async"
              className="relative z-[1] mx-auto h-[240px] w-auto rounded-[1.5rem] object-cover shadow-2xl ring-4 ring-rose-200 sm:h-[280px]"
            />
          </div>
          <div className="text-center md:text-left">
            <p className="text-[11px] font-bold uppercase tracking-widest text-rose-500">Aapka Guide</p>
            <h2 className="mt-2 font-heading text-3xl font-bold text-rose-950 sm:text-4xl">AstroGuru Ashutosh</h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-rose-950/60">
              Main sirf chart nahi padhta — aapke rishte ki situation samajhta hoon.
              Har session mein ek hi goal hota hai:{" "}
              <span className="font-semibold text-rose-950">
                aapko woh clarity milni chahiye jo aap saalon se dhoondh rahe hain.
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* ═══ 9. PACKAGES ══════════════════════════════════════════════════════ */}
      <section id="packages" className="scroll-mt-20 bg-rose-50/40 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4">
          <p className="text-center text-[11px] font-bold uppercase tracking-widest text-rose-500">Investment</p>
          <h2 className="mt-2 text-center font-heading text-3xl font-bold text-rose-950 sm:text-4xl">
            Apna Session Choose Karein
          </h2>
          <p className="mx-auto mt-3 max-w-md text-center text-sm text-rose-950/55">
            Seedha AstroGuru ke saath — koi assistant, koi script nahi.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            <div className="relative flex flex-col rounded-3xl border-2 border-rose-500 bg-gradient-to-b from-rose-100/70 to-white p-6 shadow-lg shadow-rose-200/60 sm:p-8">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-rose-600 px-4 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                Most Popular
              </span>
              <p className="text-sm font-semibold text-rose-600">Complete session</p>
              <p className="mt-1 font-heading text-5xl font-bold text-rose-950">45 Min</p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-rose-950">₹4,999</p>
              <p className="mt-3 text-sm text-rose-950/55">Poora relationship reading — compatibility, timing, doshas, remedies.</p>
              <div className="mt-4 rounded-xl bg-rose-100/60 px-4 py-3 text-xs space-y-1">
                <p className="font-bold text-rose-600 text-[11px] uppercase tracking-wide mb-2">Kya milega:</p>
                {["Full kundli + compatibility analysis", "Marriage/relationship timing", "Dosh check + remedies", "Session recording"].map((f) => (
                  <div key={f} className="flex items-center gap-2 text-rose-950/85">
                    <Check className="size-3.5 shrink-0 text-rose-600" strokeWidth={3} /> {f}
                  </div>
                ))}
              </div>
              <Link
                href={CHECKOUT_HREF["45"]}
                onClick={() => track.consultationProductSelected("45min")}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-rose-700 active:scale-[0.97]"
              >
                Book 45 Min Session <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="flex flex-col rounded-3xl border-2 border-rose-200 bg-white p-6 shadow-sm sm:p-8">
              <p className="text-sm font-semibold text-rose-600">Quick focus</p>
              <p className="mt-1 font-heading text-5xl font-bold text-rose-950">15 Min</p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-rose-950">₹1,499</p>
              <p className="mt-3 text-sm text-rose-950/55">Ek specific sawal apne rishte ke baare mein — clear answer.</p>
              <div className="mt-4 space-y-2">
                {["Personalized kundli reading", "One specific question — clear answer", "Focused remedy guidance"].map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm text-rose-950/85">
                    <Check className="size-3.5 shrink-0 text-rose-600" strokeWidth={3} /> {f}
                  </div>
                ))}
              </div>
              <Link
                href={CHECKOUT_HREF["15"]}
                onClick={() => track.consultationProductSelected("15min")}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-rose-950 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-rose-900 active:scale-[0.97]"
              >
                Book 15 Min Session <ArrowRight className="size-4" />
              </Link>
              <p className="mt-3 text-center text-[11px] text-rose-950/50">
                Ek dinner se bhi kam — ek decision ke liye
              </p>
            </div>
          </div>

          <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-[11px] font-medium text-rose-950/55">
            <Shield className="size-3.5 text-rose-500" /> Razorpay se 100% secure payment — cards, UPI, netbanking sab supported
          </p>
        </div>
      </section>

      {/* ═══ 9b. HOW IT WORKS — booking se session tak ═══════════════════════ */}
      <section className="border-t border-rose-200/50 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-2xl px-4">
          <p className="text-center text-[11px] font-bold uppercase tracking-widest text-rose-500">Process</p>
          <h2 className="mt-2 text-center font-heading text-3xl font-bold text-rose-950 sm:text-4xl">
            Booking Se Session Tak
          </h2>
          <p className="mx-auto mt-3 max-w-sm text-center text-sm text-rose-950/55">
            Clear 4-step process — plan se booking tak sab simple aur direct.
          </p>

          <div className="mt-10 space-y-3">
            {[
              { title: "Plan Select Karein", desc: "15 min ya 45 min relationship consultation choose karein." },
              { title: "Details Fill Karein", desc: "Naam, WhatsApp number, DOB aur optional partner details." },
              { title: "Secure Payment Karein", desc: "Razorpay ke through payment complete karke booking lock karein." },
              { title: "Slot Confirm Milega", desc: "24h ke andar WhatsApp par chat ya call ka time confirm ho jayega." },
            ].map((item, idx) => (
              <div
                key={item.title}
                className="flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50/30 px-4 py-4 shadow-sm"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-fuchsia-500 text-xs font-bold text-white">
                  {idx + 1}
                </div>
                <div>
                  <p className="text-sm font-semibold text-rose-950">{item.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-rose-950/55">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-rose-200/70 bg-rose-50/50 px-4 py-3 text-center">
            <p className="text-xs font-medium text-rose-950/70">
              Payment ke baad booking confirm ho jata hai, phir session ka exact time WhatsApp par milta hai.
            </p>
          </div>

          <div className="mt-6 text-center">
            <a
              href={getWhatsAppHref("Hi VedGuide team, mujhe relationship consultation ke baare mein ek sawal puchhna hai.")}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track.consultationProductSelected("whatsapp_pre_sales")}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-5 py-3 text-sm font-bold text-rose-600 shadow-sm transition-all hover:bg-rose-50 active:scale-[0.97]"
            >
              <MessageCircle className="size-4" /> Confused? Pehla Sawal WhatsApp Pe Puchhein
            </a>
          </div>
        </div>
      </section>

      {/* ═══ 10. FAQ ══════════════════════════════════════════════════════════ */}
      <section className="border-t border-rose-200/50 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-2xl px-4">
          <p className="text-center text-[11px] font-bold uppercase tracking-widest text-rose-500">Sawaal?</p>
          <h2 className="mt-2 text-center font-heading text-3xl font-bold text-rose-950 sm:text-4xl">
            Honest Answers
          </h2>
          <div className="mt-10 space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-rose-100 bg-rose-50/30 shadow-sm">
                <button
                  type="button"
                  className="flex w-full items-start gap-3 px-5 py-4 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="flex-1 text-sm font-semibold text-rose-950">{faq.q}</span>
                  <ChevronDown
                    className={`mt-0.5 size-4 shrink-0 text-rose-500 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="border-t border-rose-100 bg-white px-5 py-4">
                    <p className="text-sm leading-relaxed text-rose-950/65">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 11. FINAL CTA ════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden border-t border-rose-200/50 bg-gradient-to-br from-[oklch(0.24_0.07_15)] via-[oklch(0.3_0.1_12)] to-[oklch(0.38_0.11_18)] py-20 pb-32 text-white">
        <div className="rel-drift pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-500/10 blur-3xl" />
        <div className="relative mx-auto max-w-lg px-4 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-rose-300/25 bg-white/5 px-4 py-2">
            <span className="rel-pulse size-2 rounded-full bg-rose-400" />
            <span className="text-xs font-bold text-rose-200/90">
              Sirf 6 private slots aaj available — focused attention ke liye
            </span>
          </div>

          <h2 className="font-heading text-3xl font-bold leading-tight sm:text-4xl">
            Apna Rishta. <br />
            <span className="rel-gradient-text">Apni Clarity.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-sm text-[15px] leading-relaxed text-rose-50/82">
            Bas janm ki details chahiye — partner ki bhi ho toh better.
            15 min se shuru karein — seedha apne rishte ke baare mein.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3">
            <Link
              href={CHECKOUT_HREF["15"]}
              onClick={() => track.consultationProductSelected("15min")}
              className="inline-flex w-full max-w-[300px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-fuchsia-500 px-8 py-4 text-[15px] font-bold text-white shadow-[0_8px_32px_-8px_rgba(225,29,72,0.55)] transition-all hover:brightness-110 active:scale-[0.97]"
            >
              15 Min Session Book Karein <ArrowRight className="size-4" />
            </Link>
            <Link
              href={CHECKOUT_HREF["45"]}
              onClick={() => track.consultationProductSelected("45min")}
              className="inline-flex w-full max-w-[300px] items-center justify-center gap-2 rounded-2xl border border-rose-300/40 bg-white/10 px-8 py-4 text-[15px] font-bold text-rose-100 transition-all hover:bg-white/15 active:scale-[0.97]"
            >
              45 Min Deep Session Book Karein
            </Link>
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-rose-100/70">
              <span className="flex items-center gap-1.5"><Lock className="size-3" /> 100% Confidential</span>
              <span className="flex items-center gap-1.5"><Shield className="size-3" /> Razorpay Secured</span>
              <span className="flex items-center gap-1.5"><MessageCircle className="size-3" /> WhatsApp Support</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 12. STICKY BOTTOM BAR — always visible ══════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-rose-200 bg-white/95 px-3 py-2.5 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] backdrop-blur-md pb-[max(0.625rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <div className="relative size-11 shrink-0 overflow-hidden rounded-xl ring-1 ring-rose-100 sm:size-12">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ASTRO_IMG} alt="AstroGuru Ashutosh" className="size-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-bold text-rose-950 sm:text-xs">Relationship Consultation</p>
            <p className="text-[10px] font-semibold text-rose-600 sm:text-xs">Starting ₹1,499 · Razorpay secured</p>
          </div>
          <a
            href="#packages"
            onClick={handlePackagesClick}
            className="shrink-0 rounded-2xl bg-gradient-to-r from-rose-500 to-fuchsia-500 px-5 py-3 text-sm font-bold text-white shadow-lg transition-all hover:brightness-110 active:scale-95 flex items-center gap-1.5 sm:px-6"
          >
            Plan Choose Karein <ArrowRight className="size-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
