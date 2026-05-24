"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  Check,
  Star,
  Shield,
  Truck,
  ChevronDown,
  ChevronUp,
  Package,
  Clock,
  ArrowRight,
  Sparkles,
  Zap,
  Users,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

const KADA_IMAGE_CDN_BASE =
  "https://primedit-cdn.b-cdn.net/Images%20Product";

// TODO: replace with actual WhatsApp number
const WHATSAPP_NUMBER = "919999999999";

function kadaImageUrl(folder: number, img: number) {
  return `${KADA_IMAGE_CDN_BASE}/${folder}/${img}.png`;
}

function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

type DesignId = "classic" | "traditional" | "ornate";

const DESIGN_VARIANTS: {
  id: DesignId;
  name: string;
  folder: number;
  imageCount: number;
}[] = [
  { id: "classic",     name: "Classic Plain", folder: 1, imageCount: 3 },
  { id: "traditional", name: "Traditional",   folder: 2, imageCount: 3 },
  { id: "ornate",      name: "Ornate Finish", folder: 3, imageCount: 3 },
];

// ── Data ───────────────────────────────────────────────────────────────────────

const TICKER = [
  "🕉️ Vedic Certified",
  "💳 Cash on Delivery Available",
  "✨ Personalized Preparation",
  "🔒 Genuine Materials",
  "📦 Premium Packaging",
  "🌙 Saturn & Rahu Dosh Protection",
  "⭐ 4.9 / 5 Rating",
  "🛡️ Replacement Guarantee",
];

const SIZES = ['S — 2.2"', 'M — 2.4"', 'L — 2.6"', 'XL — 2.8"'];

const SIZE_GUIDE = [
  { size: 'S — 2.2"', wrist: '5.5–5.8"' },
  { size: 'M — 2.4"', wrist: '5.9–6.2"' },
  { size: 'L — 2.6"', wrist: '6.3–6.6"' },
  { size: 'XL — 2.8"', wrist: '6.7–7.0"' },
];

const IN_THE_BOX = [
  { icon: "⚜️", item: "Silver Kada", detail: "Handcrafted per your nakshatra" },
  { icon: "🎁", item: "Premium Gift Box", detail: "Rigid silk-lined packaging" },
  { icon: "📜", item: "Authenticity Certificate", detail: "Material quality verified" },
  { icon: "📝", item: "Care & Wear Guide", detail: "Instructions for best results" },
];

const PLATED_FEATURES = [
  "Premium silver-plated finish",
  "Visually identical to pure silver",
  "Lightweight & comfortable for daily wear",
  "Ideal entry point for astrological remedies",
];

const SILVER_FEATURES = [
  "92.5% Sterling Silver — hallmark certified",
  "Heavier, more premium feel on the wrist",
  "Higher astrological potency per Vedic texts",
  "Recommended by practising astrologers",
];

const BENEFITS = [
  {
    icon: "🪐",
    title: "Saturn & Rahu Dosh Protection",
    desc: "Balances the negative effects of Saturn and Rahu planetary periods — brings stability and a clearer sense of direction.",
  },
  {
    icon: "🧘",
    title: "Mental Peace & Calm",
    desc: "Anxious thoughts reduce with daily wear. The mind settles — wearers consistently report feeling more grounded.",
  },
  {
    icon: "⚡",
    title: "Positive Energy Flow",
    desc: "Silver's natural energetic properties attract positivity and act as a filter against environmental negativity.",
  },
  {
    icon: "💪",
    title: "Confidence & Clarity",
    desc: "Clearer decision-making and a natural growth in self-confidence — visible in daily performance and interactions.",
  },
  {
    icon: "❤️",
    title: "Emotional Stability",
    desc: "Mood swings reduce. Patience and balance come more naturally in relationships and high-pressure situations.",
  },
  {
    icon: "🛡️",
    title: "Astrological Protection",
    desc: "During planetary transitions, this kada acts as an invisible protective layer against their adverse effects.",
  },
];

const WHO_NEEDS = [
  "Going through Shani Sade Sati or Rahu Mahadasha",
  "Experiencing anxiety, overthinking, or frequent mood swings",
  "Stuck in repeating patterns in career or relationships",
  "Seeking confidence and clarity in major life decisions",
  "Wanting to seriously try a Vedic astrological remedy",
  "Looking for a premium, meaningful spiritual gift",
];

const STEPS = [
  {
    num: "01",
    icon: "🛒",
    title: "Place Your Order",
    desc: "Choose your variant and size. Pay on delivery or online — both options available.",
  },
  {
    num: "02",
    icon: "🕉️",
    title: "Personalised Preparation",
    desc: "Your kada is prepared based on your birth nakshatra. Siddh option includes full Vedic rituals.",
  },
  {
    num: "03",
    icon: "📦",
    title: "Delivered in 15–20 Days",
    desc: "After careful handcrafted preparation, shipped in premium packaging straight to your door.",
  },
];

const TESTIMONIALS = [
  {
    initial: "A",
    name: "Amit V.",
    city: "Delhi",
    tag: "Saturn Dosh",
    stars: 5,
    text: "I was going through Sade Sati. Wore the silver kada for 3 months — clarity in business improved, decisions felt easier. A genuine shift. Doesn't feel like coincidence at all.",
    outcome: "Business clarity in 3 months",
  },
  {
    initial: "P",
    name: "Priya S.",
    city: "Mumbai",
    tag: "Mental Peace",
    stars: 5,
    text: "Anxiety was overwhelming. Added the Siddh option. The peace I've experienced since has no comparison. Just wearing it feels calming — every single day.",
    outcome: "Anxiety significantly reduced",
  },
  {
    initial: "R",
    name: "Rohit M.",
    city: "Pune",
    tag: "Rahu Dosh",
    stars: 5,
    text: "Started with the silver plated version to test it. Loved it so much I ordered the pure silver too. Both feel different — the pure silver one grounds you more deeply.",
    outcome: "Ordered both variants",
  },
];

const FAQS = [
  {
    q: "What is the difference between Pure Silver and Silver Plated?",
    a: "Pure Silver is 92.5% sterling silver — heavier, more premium, and considered astrologically more potent by practising astrologers. Silver Plated looks completely identical, is lightweight, and is the perfect starting point for remedies. No one will be able to tell the difference visually.",
  },
  {
    q: "Why does delivery take 15–20 days?",
    a: "This is not a mass-produced product. Each kada is personalised based on your birth nakshatra. The Siddh option involves additional Vedic rituals performed at an auspicious muhurat. This takes time — both quality and intention are carefully ensured.",
  },
  {
    q: "What exactly is the Siddh (Energised) option?",
    a: "For ₹299 extra, your kada is energised and activated through specific Vedic mantras, Gangajal (sacred water), and performed at an auspicious muhurat — consecrated in your name. It becomes a spiritually charged remedy, not just a physical product.",
  },
  {
    q: "Is Cash on Delivery available?",
    a: "Yes, COD is available pan-India. Pay at the time of delivery. If you prefer to pay online at checkout, you get an additional ₹50 discount.",
  },
  {
    q: "What if the product is defective?",
    a: "If the product arrives defective or damaged, full replacement is guaranteed — no questions asked. Astrological results are a personal experience and may vary, but the physical quality of every product is fully guaranteed.",
  },
  {
    q: "How do I care for and maintain my silver kada?",
    a: "Wipe with a soft dry cloth after wearing. Avoid prolonged contact with soap, perfume, lotion, or water. For pure silver, a silver cleaning cloth occasionally restores shine. Store in the provided gift box when not wearing — this keeps it dust-free and preserves the finish.",
  },
];

// ── Main Component ─────────────────────────────────────────────────────────────

export function KadaProductPage() {
  const [variant, setVariant] = useState<"plated" | "silver">("plated");
  const [designId, setDesignId] = useState<DesignId>("classic");
  const [size, setSize] = useState(SIZES[1]);
  const [siddha, setSiddha] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [stickyVisible, setStickyVisible] = useState(false);
  const [viewersCount, setViewersCount] = useState(17);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  const heroRef = useRef<HTMLDivElement>(null);
  const orderRef = useRef<HTMLDivElement>(null);

  const activeDesign =
    DESIGN_VARIANTS.find((d) => d.id === designId) ?? DESIGN_VARIANTS[0];
  const galleryImages = Array.from({ length: activeDesign.imageCount }, (_, i) => ({
    id: i,
    src: kadaImageUrl(activeDesign.folder, i + 1),
    alt: `${activeDesign.name} — photo ${i + 1}`,
  }));
  const safeActiveImage = Math.min(activeImage, galleryImages.length - 1);

  const basePrice = variant === "silver" ? 4499 : 699;
  const mrp = variant === "silver" ? 7999 : 1499;
  const discPct = variant === "silver" ? 43 : 53;
  const savings = mrp - basePrice;

  function selectDesign(id: DesignId) {
    setDesignId(id);
    setActiveImage(0);
  }

  function whatsappUrl() {
    const variantLabel = variant === "silver" ? "Pure Silver" : "Silver Plated";
    const siddhaLabel = siddha ? " with Siddh Energisation" : "";
    const msg = encodeURIComponent(
      `Namaste! I want to order the ${activeDesign.name} ${variantLabel} Kada (Size: ${size})${siddhaLabel}. Please help me complete my order. 🙏`
    );
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
  }

  useEffect(() => {
    setViewersCount(Math.floor(Math.random() * 14) + 11);
    const id = setInterval(() => {
      setViewersCount((v) =>
        Math.max(8, Math.min(28, v + (Math.random() > 0.5 ? 1 : -1)))
      );
    }, 7000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => setStickyVisible(!e.isIntersecting),
      { threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const els = document.querySelectorAll('[data-anim]');
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('anim-on'); obs.unobserve(e.target); }
      }),
      { threshold: 0.12 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const router = useRouter();

  const scrollToOrder = () =>
    orderRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const goToCheckout = () => {
    const params = new URLSearchParams({
      variant,
      design: designId,
      size: size.split(" ")[0],
    });
    router.push(`/checkout/kada?${params.toString()}`);
  };

  return (
    <>
      <style>{`
        @keyframes kada-float {
          0%, 100% { transform: translateY(0px) rotate(-1deg); }
          50% { transform: translateY(-14px) rotate(1deg); }
        }
        @keyframes kada-shimmer-text {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
        @keyframes kada-ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes kada-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(180,83,9,0); }
          50% { box-shadow: 0 0 32px 4px rgba(180,83,9,0.45); }
        }
        @keyframes kada-particle {
          0% { transform: translateY(0) scale(1); opacity: 0.7; }
          100% { transform: translateY(-80px) scale(0.1); opacity: 0; }
        }
        @keyframes kada-ping-slow {
          0% { transform: scale(1); opacity: 0.8; }
          70% { transform: scale(1.6); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }
        @keyframes kada-pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        @keyframes kada-silver-shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .kada-silver-price-area {
          background: linear-gradient(160deg, #f0f4f8 0%, #dce5ee 12%, #edf2f7 25%, #c8d6e0 38%, #e2eaf2 52%, #d4dfe8 65%, #eaf0f6 78%, #ccd8e4 90%, #e8f0f6 100%);
          position: relative;
        }
        .kada-silver-price-area::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.45) 50%, transparent 70%);
          background-size: 200% 100%;
          animation: kada-silver-shimmer 3s ease-in-out infinite;
          pointer-events: none;
        }
        .kada-float { animation: kada-float 5s ease-in-out infinite; }
        .kada-shimmer-text {
          background: linear-gradient(90deg, #92400e 0%, #d97706 30%, #fbbf24 50%, #d97706 70%, #92400e 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: kada-shimmer-text 4s linear infinite;
        }
        .kada-ticker-track {
          display: flex;
          width: max-content;
          animation: kada-ticker 32s linear infinite;
        }
        .kada-glow-btn { animation: kada-glow 2.5s ease-in-out infinite; }
        .kada-particle {
          position: absolute;
          border-radius: 50%;
          animation: kada-particle ease-out infinite;
        }
        .kada-ping-slow { animation: kada-ping-slow 2.5s cubic-bezier(0,0,0.2,1) infinite; }
        .kada-pulse-dot { animation: kada-pulse-dot 1.8s ease-in-out infinite; }
        [data-anim] { opacity: 0; transform: translateY(22px); transition: opacity 0.55s ease, transform 0.55s ease; }
        [data-anim].anim-on { opacity: 1; transform: none; }
        [data-anim-d="1"] { transition-delay: 0.08s; }
        [data-anim-d="2"] { transition-delay: 0.16s; }
        [data-anim-d="3"] { transition-delay: 0.24s; }
        [data-anim-d="4"] { transition-delay: 0.32s; }
        [data-anim-d="5"] { transition-delay: 0.40s; }
        [data-anim-d="6"] { transition-delay: 0.48s; }
      `}</style>

      <div className="min-h-screen bg-[var(--background)] pb-[5.5rem] md:pb-0">

        {/* ════════════════════════════════════════
            HERO
        ════════════════════════════════════════ */}
        <section
          ref={heroRef}
          className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-[#fff8f0] to-orange-50/40 pt-10 pb-16 md:pt-16 md:pb-24"
        >
          <div className="pointer-events-none absolute -top-32 -right-32 size-[500px] rounded-full border border-amber-200/30 opacity-60" />
          <div className="pointer-events-none absolute -top-20 -right-20 size-[350px] rounded-full border border-amber-200/20 opacity-40" />
          <div className="pointer-events-none absolute -bottom-40 -left-40 size-[600px] rounded-full border border-amber-100/40 opacity-40" />

          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {[...Array(14)].map((_, i) => (
              <div
                key={i}
                className="kada-particle bg-amber-400/30"
                style={{
                  width: `${4 + (i % 4) * 3}px`,
                  height: `${4 + (i % 4) * 3}px`,
                  left: `${(i * 19) % 92}%`,
                  top: `${15 + (i * 11) % 65}%`,
                  animationDelay: `${i * 0.35}s`,
                  animationDuration: `${3.5 + (i % 3) * 0.8}s`,
                }}
              />
            ))}
          </div>

          <div className="relative mx-auto max-w-6xl px-5">
            {/* Top badge row */}
            <div className="mb-5 flex flex-wrap items-center justify-center gap-2 md:justify-start">
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-100/80 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-700 backdrop-blur-sm">
                <Sparkles size={11} />
                Vedic Astrological Remedy
                <Sparkles size={11} />
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3.5 py-1.5 text-xs font-bold text-green-700">
                <Users size={11} />
                5,000+ Happy Customers
              </span>
            </div>

            {/* Title — sits above image on mobile, above 2-col grid on desktop */}
            <h1 className="font-heading mb-6 text-center text-3xl font-bold leading-[1.15] md:mb-8 md:text-4xl lg:text-[2.8rem]">
              Control Your Emotions & Attract{" "}
              <span className="kada-shimmer-text">Positive Energy</span>
              <br className="hidden sm:block" />
              {" "}with an <strong>Astrological Vedic Kada</strong>
            </h1>

            <div className="mx-auto max-w-md">
              {/* Product Image */}
              <div className="relative mx-auto max-w-[340px]">
                {/* Golden glow halo */}
                <div className="pointer-events-none absolute inset-0 rounded-[2.5rem]" style={{ background: "radial-gradient(ellipse at center, rgba(251,191,36,0.18) 0%, transparent 70%)", transform: "scale(1.15)" }} />
                <div className="kada-float relative aspect-square w-full overflow-hidden rounded-[2.5rem] border border-amber-100 bg-white shadow-2xl">
                  <Image
                    key={`${designId}-${safeActiveImage}`}
                    src={galleryImages[safeActiveImage].src}
                    alt={galleryImages[safeActiveImage].alt}
                    fill
                    className="object-cover transition-opacity duration-300"
                    sizes="340px"
                    priority={safeActiveImage === 0}
                  />
                  <div className="absolute right-4 top-4 flex flex-col items-center rounded-2xl bg-red-500 px-3 py-2 text-white shadow-lg">
                    <span className="text-lg font-black leading-none">{discPct}%</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wide">OFF</span>
                  </div>
                  <div className="pointer-events-none absolute inset-0 rounded-[2.5rem] bg-gradient-to-tr from-transparent via-white/20 to-transparent" />
                </div>

                {/* Rating chip */}
                <div className="absolute -top-3 -right-3 flex items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-xl border border-amber-100">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={10} className="fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs font-bold text-foreground">4.9</p>
                </div>
              </div>

              {/* Thumbnails */}
              <div className="mt-4 flex flex-wrap justify-center gap-2.5">
                {galleryImages.map((img, i) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    aria-label={img.alt}
                    aria-pressed={safeActiveImage === i}
                    className={cn(
                      "relative size-14 shrink-0 overflow-hidden rounded-2xl border-2 bg-white transition-all",
                      safeActiveImage === i
                        ? "scale-105 border-amber-500 shadow-md shadow-amber-200"
                        : "border-transparent opacity-60 hover:opacity-100"
                    )}
                  >
                    <Image src={img.src} alt="" fill className="object-cover" sizes="44px" />
                  </button>
                ))}
              </div>

              {/* Divider before design variants */}
              <div className="mt-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-amber-100" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Choose Design</span>
                <div className="h-px flex-1 bg-amber-100" />
              </div>

              {/* Design variants */}
              <div className="mt-4">
                <p className="mb-3 text-center text-sm text-foreground">
                  <span className="text-muted-foreground">Design: </span>
                  <span className="font-semibold">{activeDesign.name}</span>
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {DESIGN_VARIANTS.map((d) => {
                    const thumbSrc = kadaImageUrl(d.folder, 1);
                    const selected = designId === d.id;
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => selectDesign(d.id)}
                        aria-label={`Design ${d.name}`}
                        aria-pressed={selected}
                        className={cn(
                          "overflow-hidden rounded-2xl border-2 bg-white transition-all",
                          selected
                            ? "border-amber-600 shadow-lg ring-2 ring-amber-600/20"
                            : "border-stone-200 hover:border-amber-300"
                        )}
                      >
                        <div className="relative aspect-square w-full bg-stone-50">
                          <Image
                            src={thumbSrc}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 33vw, 160px"
                          />
                          {selected && (
                            <div className="absolute inset-0 bg-amber-500/10" />
                          )}
                        </div>
                        <div className="border-t border-stone-100 px-2 py-2.5 text-center">
                          <p className="text-[11px] font-semibold leading-tight text-stone-700">
                            {d.name}
                          </p>
                          <p className="mt-1 text-[10px] font-bold text-amber-600">
                            ₹699 – ₹4,499
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price + viewers + CTA */}
              <div className="mt-6 text-center">
                <div className="mb-3 flex items-center justify-center gap-2.5">
                  <span className="kada-pulse-dot inline-block size-2 rounded-full bg-red-500" />
                  <span className="text-xs text-muted-foreground">
                    <span className="font-bold text-foreground">{viewersCount} people</span> viewing right now
                  </span>
                </div>

                {/* Price indicator */}
                <div className="mb-4 flex items-baseline justify-center gap-3">
                  <span className="font-heading text-4xl font-black text-amber-600">From ₹699</span>
                  <span className="text-base font-medium text-stone-400 line-through">₹1,499</span>
                </div>

                <div className="mb-4 flex flex-wrap justify-center gap-2">
                  {[
                    { Icon: Shield, text: "Secure" },
                    { Icon: Truck, text: "COD Available" },
                    { Icon: Package, text: "Handcrafted" },
                    { Icon: Clock, text: "15–20 Day Delivery" },
                  ].map(({ Icon, text }) => (
                    <span
                      key={text}
                      className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1.5 text-[11px] font-semibold text-amber-800 shadow-sm"
                    >
                      <Icon size={11} />
                      {text}
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={scrollToOrder}
                  className="kada-glow-btn w-full rounded-2xl bg-amber-700 px-8 py-4 text-base font-bold text-white transition-all hover:bg-amber-800 active:scale-95 flex items-center justify-center gap-2"
                >
                  Select Size & Order Now
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            TICKER
        ════════════════════════════════════════ */}
        <div className="overflow-hidden bg-amber-700 py-3">
          <div className="kada-ticker-track">
            {[...TICKER, ...TICKER].map((text, i) => (
              <span
                key={i}
                className="inline-flex items-center whitespace-nowrap px-6 text-sm font-semibold text-white"
              >
                {text}
                <span className="mx-4 opacity-40">✦</span>
              </span>
            ))}
          </div>
        </div>

        {/* ════════════════════════════════════════
            CHOOSE YOUR KADA
        ════════════════════════════════════════ */}
        <section
          ref={orderRef}
          className="scroll-mt-6 bg-gradient-to-br from-amber-50/60 via-white to-orange-50/20 py-16 px-5"
        >
          <div className="mx-auto max-w-3xl">
            {/* Stock urgency */}
            <div className="mb-8 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3.5">
              <div className="flex items-center justify-center gap-2.5">
                <span className="kada-pulse-dot inline-block size-2.5 shrink-0 rounded-full bg-red-500" />
                <p className="text-sm font-black text-orange-900">
                  ⚡ Only <span className="text-red-600">14 pieces</span> left at this price — offer ends soon
                </p>
              </div>
              {/* Stock bar */}
              <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-orange-200">
                <div className="h-full w-[22%] rounded-full bg-gradient-to-r from-red-500 to-orange-400" />
              </div>
              <div className="mt-1 flex justify-between text-[10px] font-semibold text-orange-600">
                <span>14 remaining</span>
                <span>86 sold</span>
              </div>
            </div>

            <div className="mb-10 text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-600">
                Select Your Kada
              </span>
              <h2 className="font-heading mt-2 text-3xl font-bold text-foreground md:text-4xl">
                Choose Your Variant
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Same Vedic design — pick the material that fits your purpose
              </p>
            </div>

            {/* Variant Cards */}
            <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:items-start sm:relative">

              {/* ── Silver Plated ── good but standard */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setVariant("plated")}
                onKeyDown={(e) => e.key === "Enter" && setVariant("plated")}
                className={cn(
                  "flex flex-col rounded-3xl overflow-hidden cursor-pointer border-2 bg-white transition-all duration-200",
                  variant === "plated"
                    ? "border-amber-400 shadow-xl shadow-amber-100"
                    : "border-stone-200 hover:border-amber-300 hover:shadow-lg"
                )}
              >
                {/* Price area */}
                <div className="flex items-start justify-between border-b border-stone-100 px-5 pb-5 pt-5">
                  <div>
                    <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-stone-400">Silver Plated</p>
                    <p className="font-heading text-5xl font-black leading-none text-amber-700">₹699</p>
                    <p className="mt-1.5 text-sm font-medium text-stone-400 line-through">₹1,499</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 pt-1">
                    <span className="rounded-xl bg-green-500 px-2.5 py-1 text-xs font-black text-white">53% OFF</span>
                    {variant === "plated" && (
                      <div className="flex size-7 items-center justify-center rounded-full bg-amber-500 shadow">
                        <Check size={14} className="text-white stroke-[3]" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="flex flex-col flex-1 px-5 pb-5 pt-4">
                  <p className="font-heading text-xl font-black leading-tight text-stone-900">Daily Wear Kada</p>
                  <p className="mb-4 mt-1 text-xs font-medium text-stone-400">Daily Vedic remedy for beginners</p>
                  <div className="mb-5 flex flex-wrap gap-2">
                    {["Lightweight", "Budget-Friendly", "Daily Wear", "For Beginners"].map((t) => (
                      <span key={t} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">{t}</span>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setVariant("plated"); }}
                    className={cn(
                      "mt-auto w-full rounded-2xl py-3.5 text-sm font-black transition-all",
                      variant === "plated"
                        ? "bg-amber-600 text-white hover:bg-amber-700"
                        : "border-2 border-amber-400 text-amber-700 hover:bg-amber-50"
                    )}
                  >
                    {variant === "plated" ? "✓ Selected" : "Choose Silver Plated"}
                  </button>
                </div>
              </div>

              {/* OR divider badge — visible only on sm+ two-column layout */}
              <div className="hidden sm:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 size-9 items-center justify-center rounded-full border-2 border-amber-200 bg-white shadow-md">
                <span className="text-[10px] font-black text-amber-500">OR</span>
              </div>

              {/* ── Pure Silver ── visibly more premium */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setVariant("silver")}
                onKeyDown={(e) => e.key === "Enter" && setVariant("silver")}
                className={cn(
                  "flex flex-col rounded-3xl overflow-hidden cursor-pointer border-2 transition-all duration-200",
                  variant === "silver"
                    ? "border-amber-500 shadow-2xl shadow-amber-200"
                    : "border-amber-300 shadow-md shadow-amber-100 hover:border-amber-500 hover:shadow-xl hover:shadow-amber-200"
                )}
              >
                {/* Recommended banner */}
                <div className="flex items-center justify-between bg-amber-700 px-5 py-3">
                  <div className="flex items-center gap-2">
                    <Star size={13} className="shrink-0 fill-amber-300 text-amber-300" />
                    <span className="text-xs font-black uppercase tracking-widest text-white">Most Recommended</span>
                  </div>
                  <span className="text-xs font-bold text-amber-300">Best Choice →</span>
                </div>

                {/* Price area — brushed silver metallic texture */}
                <div className="kada-silver-price-area flex items-start justify-between border-b border-slate-300 px-5 pb-5 pt-5">
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <span
                        className="inline-block size-3.5 rounded-full ring-2 ring-amber-300 shadow"
                        style={{ background: "linear-gradient(135deg, #fef3c7 0%, #d97706 45%, #fbbf24 75%, #92400e 100%)" }}
                      />
                      <span
                        className="inline-block size-3 rounded-full"
                        style={{ background: "linear-gradient(135deg, #e2e8f0 0%, #94a3b8 45%, #f1f5f9 75%, #64748b 100%)" }}
                      />
                      <span className="text-[11px] font-black uppercase tracking-widest text-slate-600">92.5% Sterling Silver</span>
                    </div>
                    <p className="font-heading text-6xl font-black leading-none text-amber-700">₹4,499</p>
                    <p className="mt-1.5 text-sm font-semibold text-slate-400 line-through">₹7,999</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 pt-1">
                    <span className="rounded-xl bg-amber-600 px-3 py-1.5 text-sm font-black text-white shadow">43% OFF</span>
                    {variant === "silver" && (
                      <div className="flex size-7 items-center justify-center rounded-full bg-amber-600 shadow-lg">
                        <Check size={14} className="text-white stroke-[3]" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="flex flex-col flex-1 bg-slate-50 px-5 pb-5 pt-4">
                  <p className="font-heading text-xl font-black leading-tight text-stone-900">Pure Silver Kada</p>
                  <p className="mb-4 mt-1 text-xs font-bold text-amber-600">Original silver — highest astrological potency</p>
                  <div className="mb-5 flex flex-wrap gap-2">
                    {["92.5% Sterling", "Premium Weight", "Long-Lasting", "Hallmark Certified"].map((t) => (
                      <span key={t} className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">{t}</span>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setVariant("silver"); }}
                    className="mt-auto w-full rounded-2xl bg-amber-700 py-4 text-sm font-black text-white shadow-lg shadow-amber-200 transition-all hover:bg-amber-800"
                  >
                    {variant === "silver" ? "✓ Selected" : "Choose Pure Silver"}
                  </button>
                </div>
              </div>
            </div>

            {/* Size Selection */}
            <div className="mb-6 rounded-3xl border border-stone-100 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-foreground">Select Your Size</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Currently selected: <span className="font-semibold text-amber-700">{size}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSizeGuide((v) => !v)}
                  className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition-all hover:bg-amber-100"
                >
                  <Info size={11} />
                  Size Guide
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2.5">
                {SIZES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSize(s)}
                    className={cn(
                      "flex flex-col items-center rounded-2xl border-2 px-2 py-3.5 transition-all",
                      size === s
                        ? "border-amber-500 bg-amber-500 text-white shadow-lg shadow-amber-200"
                        : "border-stone-200 bg-white text-foreground hover:border-amber-300"
                    )}
                  >
                    <span className="text-sm font-black">{s.split(" ")[0]}</span>
                    <span
                      className={cn(
                        "mt-1 text-[10px]",
                        size === s ? "text-amber-100" : "text-muted-foreground"
                      )}
                    >
                      {s.split("— ")[1]}
                    </span>
                  </button>
                ))}
              </div>

              {showSizeGuide && (
                <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50/80 p-4">
                  <p className="mb-3 text-xs font-bold text-amber-800">
                    📏 Wrap a soft tape or string around your wrist and measure
                  </p>
                  <div className="space-y-1.5">
                    {SIZE_GUIDE.map(({ size: sg, wrist }) => (
                      <button
                        key={sg}
                        type="button"
                        onClick={() => setSize(sg)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-xs text-left transition-all",
                          size === sg
                            ? "border-amber-400 bg-white font-bold text-amber-700 shadow-sm"
                            : "border-transparent text-muted-foreground hover:bg-white/60"
                        )}
                      >
                        <span>{sg}</span>
                        <span>Wrist: {wrist}</span>
                        {size === sg && <Check size={12} className="text-amber-500 stroke-[3]" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* CTA */}
            <button
              type="button"
              onClick={goToCheckout}
              className="kada-glow-btn w-full rounded-3xl bg-amber-700 py-5 text-lg font-black text-white shadow-xl transition-all hover:bg-amber-800 active:scale-[0.98]"
            >
              Proceed to Checkout →
              <p className="mt-1 text-sm font-normal opacity-85">Secure · Free Shipping · COD Available</p>
            </button>

            <p className="mt-3 text-center text-xs text-muted-foreground">
              💳 ₹50 off on prepaid &nbsp;|&nbsp; 🔒 100% Secure Checkout
            </p>
          </div>
        </section>

        {/* ══ WHAT'S IN THE BOX ══ */}
        <section className="bg-amber-950 py-16 px-5">
          <div className="mx-auto max-w-4xl">
            <div className="mb-10 text-center" data-anim>
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-400">Unboxing</span>
              <h2 className="font-heading mt-2 text-3xl font-black text-white md:text-4xl">What's in the Box</h2>
              <p className="mt-2 text-sm text-stone-400">Every order arrives ready — nothing spared</p>
            </div>
            <div className="grid grid-cols-2 gap-px bg-white/10 md:grid-cols-4" data-anim data-anim-d="1">
              {IN_THE_BOX.map((item) => (
                <div key={item.item} className="flex flex-col items-center gap-3 bg-amber-950 px-4 py-10 text-center">
                  <span className="text-5xl">{item.icon}</span>
                  <p className="text-sm font-black text-white">{item.item}</p>
                  <p className="text-xs text-stone-500 leading-snug">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ BENEFITS ══ */}
        <section className="relative overflow-hidden bg-gradient-to-b from-amber-900 to-amber-950 py-24 px-5 text-white">
          <div className="pointer-events-none absolute -top-32 right-0 size-[500px] rounded-full bg-amber-500/5 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 -left-20 size-96 rounded-full bg-orange-600/5 blur-3xl" />

          <div className="relative mx-auto max-w-3xl">
            <div className="mb-16 text-center" data-anim>
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-400">Astrological Benefits</span>
              <h2 className="font-heading mt-3 text-4xl font-black text-white md:text-5xl">What It Does For You</h2>
              <p className="mt-3 text-sm text-amber-300/70 md:text-base">Not just a bracelet — a Vedic remedy worn on the wrist</p>
            </div>

            <div className="divide-y divide-white/10">
              {BENEFITS.map((b, i) => (
                <div
                  key={b.title}
                  data-anim
                  data-anim-d={String(Math.min(i + 1, 6))}
                  className="group flex items-start gap-5 py-7 transition-all hover:bg-white/3 -mx-4 px-4 rounded-2xl"
                >
                  <span className="font-heading shrink-0 w-10 text-right text-4xl font-black text-white/10 group-hover:text-white/20 transition-colors">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-4xl shrink-0 mt-0.5">{b.icon}</span>
                  <div>
                    <h3 className="font-heading text-xl font-black text-white">{b.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-amber-200/60">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-16 text-center" data-anim>
              <button
                onClick={scrollToOrder}
                className="kada-glow-btn inline-flex items-center gap-3 rounded-2xl bg-amber-400 px-10 py-4 text-base font-black text-amber-950 transition-all hover:bg-amber-300 active:scale-95"
              >
                <Zap size={18} />
                Order Now
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </section>

        {/* ══ WHO NEEDS IT ══ */}
        <section className="bg-white py-24 px-5">
          <div className="mx-auto max-w-2xl">
            <div className="mb-12 text-center" data-anim>
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-600">Is It For You?</span>
              <h2 className="font-heading mt-3 text-4xl font-black text-stone-900 md:text-5xl">
                This Kada Is<br />For You If...
              </h2>
            </div>

            <div className="space-y-2">
              {WHO_NEEDS.map((item, i) => (
                <div
                  key={item}
                  data-anim
                  data-anim-d={String(Math.min(i + 1, 6))}
                  className="group flex items-center gap-4 rounded-2xl border border-transparent px-5 py-4 transition-all hover:border-amber-200 hover:bg-amber-50/50"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-100 shadow-sm group-hover:bg-amber-200 transition-colors">
                    <Check size={16} className="text-amber-700 stroke-[2.5]" />
                  </div>
                  <span className="text-base font-semibold leading-snug text-stone-800">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-10 rounded-3xl bg-gradient-to-br from-amber-700 to-amber-900 p-8 text-center text-white" data-anim>
              <div className="relative mx-auto mb-5 size-20 flex items-center justify-center">
                <div className="kada-ping-slow absolute inset-0 rounded-full border-2 border-amber-300/40" />
                <div className="absolute inset-3 rounded-full border border-amber-400/30" />
                <span className="relative z-10 text-4xl">🪬</span>
              </div>
              <h3 className="font-heading text-2xl font-black">Planetary Protection</h3>
              <p className="mt-1 mb-5 text-xs text-amber-200">Counteracts the effects of these doshas</p>
              <div className="space-y-2 text-left">
                {[
                  { planet: "शनि (Saturn)", label: "Shani Dosh", effect: "Obstacles, delays, karmic weight", dot: "bg-blue-400" },
                  { planet: "राहु (Rahu)",  label: "Rahu Dosh",  effect: "Confusion, sudden upheaval",      dot: "bg-purple-400" },
                  { planet: "केतु (Ketu)",  label: "Ketu Dosh",  effect: "Detachment, spiritual blocks",    dot: "bg-orange-400" },
                ].map(({ planet, label, effect, dot }) => (
                  <div key={planet} className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className={cn("size-2 shrink-0 rounded-full", dot)} />
                      <div>
                        <p className="text-sm font-bold text-white">{planet}</p>
                        <p className="text-[11px] text-amber-200/70">{effect}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-black text-white">{label}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={scrollToOrder}
                className="mt-6 w-full rounded-2xl bg-white py-3.5 text-sm font-black text-amber-800 transition-all hover:bg-amber-50"
              >
                Order Now →
              </button>
            </div>
          </div>
        </section>

        {/* ══ HOW IT WORKS ══ */}
        <section className="bg-stone-50 py-24 px-5">
          <div className="mx-auto max-w-xl">
            <div className="mb-16 text-center" data-anim>
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-600">Simple Process</span>
              <h2 className="font-heading mt-3 text-4xl font-black text-stone-900 md:text-5xl">From Order<br />to Your Door</h2>
            </div>

            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-7 top-8 bottom-8 w-0.5 bg-gradient-to-b from-amber-400 via-amber-600 to-amber-300" />
              <div className="space-y-0">
                {STEPS.map((step, i) => (
                  <div key={step.num} data-anim data-anim-d={String(i + 1)} className="relative flex gap-7 pb-12 last:pb-0">
                    <div className="relative z-10 flex size-14 shrink-0 items-center justify-center rounded-2xl bg-amber-700 shadow-lg shadow-amber-200/60">
                      <span className="text-2xl">{step.icon}</span>
                    </div>
                    <div className="pt-2">
                      <span className="text-[11px] font-black uppercase tracking-widest text-amber-600">Step {step.num}</span>
                      <h3 className="font-heading mt-0.5 text-2xl font-black text-stone-900">{step.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-stone-500">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══ TESTIMONIALS ══ */}
        <section className="bg-amber-950 py-24 px-5 text-white">
          <div className="mx-auto max-w-4xl">
            <div className="mb-14 text-center" data-anim>
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-400">Real Stories</span>
              <h2 className="font-heading mt-3 text-4xl font-black text-white md:text-5xl">Results People Are Seeing</h2>
              <div className="mt-4 flex items-center justify-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} className="fill-amber-400 text-amber-400" />
                ))}
                <span className="ml-2 text-sm text-stone-400">4.9 / 5 · 127 verified reviews</span>
              </div>
            </div>

            {/* Featured */}
            <div className="mb-5 rounded-3xl border border-white/10 bg-white/5 p-8 md:p-10" data-anim>
              <div className="font-serif text-8xl leading-none text-amber-600/30 select-none">"</div>
              <p className="mt-1 text-lg font-semibold leading-relaxed text-white md:text-xl">
                {TESTIMONIALS[0].text}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <div className="flex size-11 items-center justify-center rounded-full bg-amber-700 text-base font-black text-white shadow">
                  {TESTIMONIALS[0].initial}
                </div>
                <div>
                  <p className="font-bold text-white">{TESTIMONIALS[0].name} · {TESTIMONIALS[0].city}</p>
                  <div className="mt-0.5 flex gap-0.5">
                    {[...Array(TESTIMONIALS[0].stars)].map((_, i) => (
                      <Star key={i} size={12} className="fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
                <div className="ml-auto rounded-full border border-green-500/30 bg-green-900/40 px-4 py-1.5 text-xs font-bold text-green-400">
                  ✓ {TESTIMONIALS[0].outcome}
                </div>
              </div>
            </div>

            {/* Smaller two */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {TESTIMONIALS.slice(1).map((t, i) => (
                <div key={t.name} data-anim data-anim-d={String(i + 1)} className="rounded-3xl border border-white/10 bg-white/5 p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[...Array(t.stars)].map((_, j) => (
                        <Star key={j} size={12} className="fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="rounded-full bg-amber-900/60 px-2.5 py-0.5 text-[10px] font-bold text-amber-400">{t.tag}</span>
                  </div>
                  <p className="mb-4 text-sm italic leading-relaxed text-stone-300">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-full bg-amber-700 text-xs font-black text-white">{t.initial}</div>
                    <div>
                      <p className="text-sm font-bold text-white">{t.name}</p>
                      <p className="text-xs text-stone-500">{t.city}</p>
                    </div>
                  </div>
                  <div className="mt-4 rounded-xl border border-green-800/40 bg-green-900/20 px-3 py-2">
                    <p className="text-xs font-semibold text-green-400">✓ {t.outcome}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ TRUST STRIP ══ */}
        <section className="bg-amber-700 py-16 px-5" data-anim>
          <div className="mx-auto max-w-4xl">
            <div className="grid grid-cols-2 divide-x divide-amber-600 md:grid-cols-4">
              {[
                { stat: "4.9/5", label: "Average Rating", sub: "127 reviews" },
                { stat: "100%", label: "Genuine Materials", sub: "Hallmark certified" },
                { stat: "15+",  label: "Years Vedic Expertise", sub: "Practising astrologers" },
                { stat: "Free", label: "Shipping Pan-India",   sub: "Cash on delivery" },
              ].map(({ stat, label, sub }) => (
                <div key={label} className="flex flex-col items-center px-4 py-6 text-center text-white md:py-8">
                  <div className="font-heading text-4xl font-black md:text-5xl">{stat}</div>
                  <div className="mt-1.5 text-xs font-bold text-amber-100">{label}</div>
                  <div className="mt-0.5 text-[10px] text-amber-300">{sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ FAQ ══ */}
        <section className="bg-white py-24 px-5">
          <div className="mx-auto max-w-2xl">
            <div className="mb-14 text-center" data-anim>
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-600">FAQs</span>
              <h2 className="font-heading mt-3 text-4xl font-black text-stone-900 md:text-5xl">Common Questions</h2>
            </div>

            <div className="divide-y divide-stone-100">
              {FAQS.map((faq, i) => (
                <div key={i} data-anim data-anim-d={String(Math.min(i + 1, 6))}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="flex w-full items-start justify-between gap-6 py-6 text-left"
                  >
                    <span className={cn("text-base font-bold leading-snug transition-colors", openFaq === i ? "text-amber-700" : "text-stone-900")}>
                      {faq.q}
                    </span>
                    <div className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-all mt-0.5",
                      openFaq === i ? "border-amber-500 bg-amber-500 text-white" : "border-stone-200 text-stone-400"
                    )}>
                      {openFaq === i
                        ? <ChevronUp size={14} className="text-white" />
                        : <ChevronDown size={14} />}
                    </div>
                  </button>
                  {openFaq === i && (
                    <div className="pb-6">
                      <p className="border-l-2 border-amber-400 pl-4 text-sm leading-relaxed text-stone-500">{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ FINAL CTA ══ */}
        <section className="relative overflow-hidden bg-gradient-to-br from-amber-900 via-amber-800 to-amber-950 px-5 py-28 text-center text-white">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="kada-particle bg-amber-400/15"
                style={{
                  width: `${4 + (i % 4) * 3}px`,
                  height: `${4 + (i % 4) * 3}px`,
                  left: `${(i * 17) % 91}%`,
                  top: `${10 + (i * 13) % 70}%`,
                  animationDelay: `${i * 0.4}s`,
                  animationDuration: `${3 + (i % 3) * 0.8}s`,
                }}
              />
            ))}
          </div>
          <div className="relative mx-auto max-w-xl" data-anim>
            <div className="mb-6 text-7xl">⚜️</div>
            <h2 className="font-heading mb-4 text-4xl font-black md:text-5xl">
              Wear Your Protection.<br />Start Today.
            </h2>
            <p className="mb-10 text-sm text-amber-300 md:text-base">
              Starts at ₹699 · Cash on Delivery · Delivered in 15–20 days
            </p>
            <button
              onClick={scrollToOrder}
              className="kada-glow-btn inline-flex items-center gap-3 rounded-2xl bg-amber-400 px-12 py-5 text-xl font-black text-amber-950 shadow-2xl transition-all hover:bg-amber-300 active:scale-95"
            >
              <Sparkles size={22} />
              Order Now — ₹{basePrice.toLocaleString("en-IN")}
              <ArrowRight size={22} />
            </button>
            <p className="mt-5 text-xs text-amber-500">
              No advance payment · Pay on delivery · Free shipping
            </p>
          </div>
        </section>

        {/* ════════════════════════════════════════
            STICKY BOTTOM BAR
        ════════════════════════════════════════ */}
        <div
          className={cn(
            "fixed bottom-0 left-0 right-0 z-50 border-t border-amber-100 bg-white/95 px-4 py-3 shadow-2xl backdrop-blur-md transition-all duration-300",
            "translate-y-0 opacity-100 pointer-events-auto md:pointer-events-none",
            stickyVisible
              ? "md:translate-y-0 md:opacity-100 md:pointer-events-auto"
              : "md:translate-y-full md:opacity-0"
          )}
        >
          <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-amber-700">
                  ₹{basePrice.toLocaleString("en-IN")}
                </span>
                <span className="text-sm text-muted-foreground line-through">
                  ₹{mrp.toLocaleString("en-IN")}
                </span>
              </div>
              <p className="truncate text-[11px] text-amber-600">
                {activeDesign.name} ·{" "}
                {variant === "silver" ? "Pure Silver" : "Silver Plated"} · {size}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={scrollToOrder}
                className="rounded-2xl bg-amber-700 px-6 py-3 text-sm font-black text-white shadow-lg transition-all hover:bg-amber-800 active:scale-95"
              >
                Buy Now 🛒
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
