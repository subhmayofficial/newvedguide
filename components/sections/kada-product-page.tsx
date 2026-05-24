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

function kadaImageUrl(num: number) {
  return `${KADA_IMAGE_CDN_BASE}/${num}.PNG`;
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
  imageNums: number[];
}[] = [
  { id: "classic", name: "Classic Plain", imageNums: [1, 2, 3] },
  { id: "traditional", name: "Traditional", imageNums: [4, 5, 6] },
  { id: "ornate", name: "Ornate Finish", imageNums: [7, 8] },
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
  const galleryImages = activeDesign.imageNums.map((num, i) => ({
    id: i,
    src: kadaImageUrl(num),
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

  const router = useRouter();

  const scrollToOrder = () =>
    orderRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const goToCheckout = () => {
    const params = new URLSearchParams({
      variant,
      design: designId,
      size: size.split(" ")[0],
      siddha: String(siddha),
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
              <span className="kada-shimmer-text">Positive Energy</span>{" "}
              with an Astrological Vedic Kada
            </h1>

            <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-16">
              {/* ── Left: Product Image ── */}
              <div className="order-1">
                <div className="relative mx-auto max-w-[340px] md:max-w-full">
                  <div className="kada-float relative aspect-square w-full overflow-hidden rounded-[2.5rem] border border-amber-100 bg-white shadow-2xl">
                    <Image
                      key={`${designId}-${safeActiveImage}`}
                      src={galleryImages[safeActiveImage].src}
                      alt={galleryImages[safeActiveImage].alt}
                      fill
                      className="object-cover transition-opacity duration-300"
                      sizes="(max-width: 768px) 340px, 480px"
                      priority={safeActiveImage === 0}
                    />
                    <div className="absolute right-4 top-4 flex flex-col items-center rounded-2xl bg-red-500 px-3 py-2 text-white shadow-lg">
                      <span className="text-lg font-black leading-none">{discPct}%</span>
                      <span className="text-[10px] font-semibold uppercase tracking-wide">OFF</span>
                    </div>
                    <div className="pointer-events-none absolute inset-0 rounded-[2.5rem] bg-gradient-to-tr from-transparent via-white/20 to-transparent" />
                  </div>

                  {/* Thumbnails — moved above design selector */}
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
                        <Image
                          src={img.src}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="44px"
                        />
                      </button>
                    ))}
                  </div>

                  {/* Design variants — 3-col centered grid */}
                  <div className="mt-5">
                    <p className="mb-3 text-center text-sm text-foreground md:text-left">
                      <span className="text-muted-foreground">Design: </span>
                      <span className="font-semibold">{activeDesign.name}</span>
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      {DESIGN_VARIANTS.map((d) => {
                        const thumbSrc = kadaImageUrl(d.imageNums[0]);
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
                            <div className="border-t border-stone-100 px-2 py-2 text-center">
                              <p className="text-[11px] font-semibold leading-tight text-stone-700">
                                {d.name}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Rating chip */}
                  <div className="absolute -top-3 -right-3 hidden md:flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 shadow-xl border border-amber-100">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={11} className="fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-xs font-bold text-foreground">4.9 / 5</p>
                  </div>
                </div>
              </div>

              {/* ── Right: Content ── */}
              <div className="order-2 text-center md:text-left">
                {/* Description */}
                <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
                  A handcrafted Vedic silver kada — prepared individually based on your birth nakshatra
                  to counteract Saturn and Rahu doshas. Worn daily, it works as a continuous
                  astrological remedy for the mind, emotions, and energy field.
                </p>

                {/* Key benefits */}
                <div className="mb-5 space-y-2">
                  {[
                    {
                      icon: "🪐",
                      title: "Saturn & Rahu Dosh Protection",
                      desc: "Neutralises Shani Sade Sati and Rahu Mahadasha effects",
                    },
                    {
                      icon: "🧘",
                      title: "Mental Peace & Clarity",
                      desc: "Reduces anxiety, overthinking, and emotional turbulence",
                    },
                    {
                      icon: "💪",
                      title: "Confidence & Emotional Stability",
                      desc: "Builds inner balance and self-assurance over time",
                    },
                    {
                      icon: "⚡",
                      title: "Continuous Positive Energy",
                      desc: "Silver's natural properties filter negativity around you",
                    },
                  ].map((b) => (
                    <div
                      key={b.title}
                      className="flex items-center gap-3.5 rounded-2xl border border-amber-100 bg-gradient-to-r from-amber-50/80 to-transparent px-4 py-3 transition-all hover:border-amber-200 hover:shadow-sm"
                    >
                      <span className="shrink-0 text-xl">{b.icon}</span>
                      <div className="flex-1 text-left">
                        <p className="text-xs font-bold leading-snug text-foreground">{b.title}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">{b.desc}</p>
                      </div>
                      <Check size={13} className="ml-auto shrink-0 text-amber-400 stroke-[2.5]" />
                    </div>
                  ))}
                </div>

                {/* Price preview */}
                <div className="mb-3 flex items-center justify-center gap-3 md:justify-start">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Starts at</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-amber-700">₹699</span>
                      <span className="text-sm text-muted-foreground line-through">₹1,499</span>
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">53% OFF</span>
                    </div>
                  </div>
                </div>

                <div className="mb-4 h-px bg-stone-100" />

                {/* Viewers */}
                <div className="mb-4 flex items-center justify-center gap-2 md:justify-start">
                  <span className="kada-pulse-dot inline-block size-2 rounded-full bg-red-500" />
                  <span className="text-xs text-muted-foreground">
                    <span className="font-bold text-foreground">{viewersCount} people</span>{" "}
                    viewing this right now
                  </span>
                </div>

                {/* Trust chips */}
                <div className="mb-4 flex flex-wrap justify-center gap-1.5 md:justify-start">
                  {[
                    { Icon: Shield, text: "Secure" },
                    { Icon: Truck, text: "COD Available" },
                    { Icon: Package, text: "Handcrafted" },
                    { Icon: Clock, text: "15–20 Day Delivery" },
                  ].map(({ Icon, text }) => (
                    <span
                      key={text}
                      className="inline-flex items-center gap-1.5 rounded-full border border-amber-100 bg-white/80 px-3 py-1 text-[11px] font-medium text-amber-800 shadow-sm"
                    >
                      <Icon size={11} />
                      {text}
                    </span>
                  ))}
                </div>

                {/* Desktop CTAs */}
                <div className="hidden md:flex flex-col items-stretch gap-3 max-w-sm">
                  <button
                    type="button"
                    onClick={scrollToOrder}
                    className="kada-glow-btn w-full rounded-2xl bg-amber-700 px-8 py-4 text-base font-bold text-white transition-all hover:bg-amber-800 active:scale-95 flex items-center justify-center gap-2"
                  >
                    Select Size & Order Now
                    <ArrowRight size={18} />
                  </button>
                  <a
                    href={whatsappUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-green-500 bg-green-50 px-8 py-3.5 text-sm font-bold text-green-700 transition-all hover:bg-green-100 active:scale-95"
                  >
                    <WhatsAppIcon size={18} />
                    Order on WhatsApp
                  </a>
                </div>
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
            <div className="mb-8 flex items-center justify-center gap-2.5 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3">
              <span className="kada-pulse-dot inline-block size-2 shrink-0 rounded-full bg-orange-500" />
              <p className="text-sm font-semibold text-orange-800">
                ⚡ Only <span className="font-black">14 pieces</span> left at this discounted price
              </p>
            </div>

            <div className="mb-10 text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-600">
                Select Your Kada
              </span>
              <h2 className="font-heading mt-2 text-3xl font-bold text-foreground md:text-4xl">
                Choose Your Variant
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Both look identical — the difference is in material and astrological potency
              </p>
            </div>

            {/* Variant Cards */}
            <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Silver Plated */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setVariant("plated")}
                onKeyDown={(e) => e.key === "Enter" && setVariant("plated")}
                className={cn(
                  "group relative flex flex-col text-left rounded-3xl border-2 overflow-hidden transition-all duration-200 cursor-pointer",
                  variant === "plated"
                    ? "border-amber-500 shadow-2xl shadow-amber-100"
                    : "border-border bg-white hover:border-amber-300 hover:shadow-lg"
                )}
              >
                <div className={cn(
                  "flex items-center justify-between px-5 py-4 transition-colors",
                  variant === "plated" ? "bg-amber-500" : "bg-amber-50 group-hover:bg-amber-100/60"
                )}>
                  <span className={cn(
                    "text-xs font-black uppercase tracking-widest",
                    variant === "plated" ? "text-white" : "text-amber-700"
                  )}>
                    🔥 Most Popular
                  </span>
                  <div className={cn(
                    "flex size-6 items-center justify-center rounded-full border-2 transition-all",
                    variant === "plated" ? "border-white bg-white" : "border-amber-300 bg-white"
                  )}>
                    {variant === "plated" && (
                      <Check size={13} className="text-amber-500 stroke-[3]" />
                    )}
                  </div>
                </div>
                <div className={cn(
                  "flex flex-col flex-1 p-5 transition-colors",
                  variant === "plated" ? "bg-amber-50" : "bg-white"
                )}>
                  <h3 className="font-heading text-xl font-bold text-foreground mb-1">
                    Silver Plated Kada
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                    High-quality base metal with a premium silver coating. Looks and feels exactly like pure silver.
                  </p>
                  <ul className="space-y-2 mb-5">
                    {PLATED_FEATURES.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-foreground">
                        <Check size={13} className="mt-0.5 flex-shrink-0 text-amber-500 stroke-[2.5]" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-amber-700">₹699</span>
                      <span className="text-sm text-muted-foreground line-through">₹1,499</span>
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                        53% OFF
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pure Silver */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setVariant("silver")}
                onKeyDown={(e) => e.key === "Enter" && setVariant("silver")}
                className={cn(
                  "group relative flex flex-col text-left rounded-3xl border-2 overflow-hidden transition-all duration-200 cursor-pointer",
                  variant === "silver"
                    ? "border-amber-500 shadow-2xl shadow-amber-100"
                    : "border-border bg-white hover:border-amber-300 hover:shadow-lg"
                )}
              >
                <div className={cn(
                  "flex items-center justify-between px-5 py-4 transition-colors",
                  variant === "silver" ? "bg-amber-500" : "bg-violet-50 group-hover:bg-violet-100/60"
                )}>
                  <span className={cn(
                    "text-xs font-black uppercase tracking-widest",
                    variant === "silver" ? "text-white" : "text-violet-700"
                  )}>
                    ✨ Premium
                  </span>
                  <div className={cn(
                    "flex size-6 items-center justify-center rounded-full border-2 transition-all",
                    variant === "silver" ? "border-white bg-white" : "border-violet-300 bg-white"
                  )}>
                    {variant === "silver" && (
                      <Check size={13} className="text-amber-500 stroke-[3]" />
                    )}
                  </div>
                </div>
                <div className={cn(
                  "flex flex-col flex-1 p-5 transition-colors",
                  variant === "silver" ? "bg-amber-50" : "bg-white"
                )}>
                  <h3 className="font-heading text-xl font-bold text-foreground mb-1">
                    Pure Silver Kada
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                    100% Pure Silver (92.5% Sterling). Certified quality — the variant serious astrologers recommend.
                  </p>
                  <ul className="space-y-2 mb-5">
                    {SILVER_FEATURES.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-foreground">
                        <Check size={13} className="mt-0.5 flex-shrink-0 text-amber-500 stroke-[2.5]" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-amber-700">₹4,499</span>
                      <span className="text-sm text-muted-foreground line-through">₹7,999</span>
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                        43% OFF
                      </span>
                    </div>
                  </div>
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

            {/* Siddha upsell */}
            <div
              role="checkbox"
              aria-checked={siddha}
              onClick={() => setSiddha((v) => !v)}
              className={cn(
                "mb-6 flex cursor-pointer items-start gap-3 rounded-2xl border px-5 py-4 transition-all",
                siddha
                  ? "border-amber-400 bg-amber-50 shadow-md"
                  : "border-dashed border-amber-200 bg-amber-50/40 hover:border-amber-300 hover:bg-amber-50"
              )}
            >
              <div className={cn(
                "mt-0.5 flex size-5 flex-shrink-0 items-center justify-center rounded border-2 transition-all",
                siddha ? "border-amber-500 bg-amber-500" : "border-amber-300 bg-white"
              )}>
                {siddha && <Check size={11} className="text-white stroke-[3]" />}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-start justify-between gap-1">
                  <p className="text-sm font-semibold text-foreground">
                    Add Vedic Energisation — Siddh Kiya Hua
                  </p>
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-black text-amber-700">
                    +₹299
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Your kada is activated through Vedic mantras, Gangajal, and an auspicious muhurat — consecrated in your name. Includes a Puja certificate.
                </p>
                {siddha && (
                  <p className="mt-2 text-xs font-semibold text-amber-700">
                    ✓ Siddh Energisation added to your order
                  </p>
                )}
              </div>
            </div>

            {/* CTAs */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={goToCheckout}
                className="kada-glow-btn flex flex-col items-center justify-center rounded-3xl bg-amber-700 py-4 text-base font-black text-white shadow-xl transition-all hover:bg-amber-800 active:scale-[0.98]"
              >
                Buy Now 🛒
                <span className="mt-0.5 text-xs font-normal opacity-85">COD Available</span>
              </button>
              <button
                type="button"
                onClick={goToCheckout}
                className="flex flex-col items-center justify-center rounded-3xl border-2 border-amber-500 bg-amber-50 py-4 text-base font-bold text-amber-700 transition-all hover:bg-amber-100 active:scale-[0.98]"
              >
                Checkout →
                <span className="mt-0.5 text-xs font-normal text-amber-500">Secure Payment</span>
              </button>
            </div>

            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex w-full items-center justify-center gap-2.5 rounded-3xl border-2 border-green-500 bg-green-50 py-4 text-sm font-bold text-green-700 transition-all hover:bg-green-100 active:scale-[0.98]"
            >
              <WhatsAppIcon size={20} />
              Order on WhatsApp Instead
            </a>

            <p className="mt-3 text-center text-xs text-muted-foreground">
              💳 ₹50 off on prepaid &nbsp;|&nbsp; 🔒 100% Secure Checkout
            </p>
          </div>
        </section>

        {/* ════════════════════════════════════════
            WHAT'S IN THE BOX
        ════════════════════════════════════════ */}
        <section className="border-t border-amber-50 bg-white py-16 px-5">
          <div className="mx-auto max-w-4xl">
            <div className="mb-10 text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-600">
                Unboxing Experience
              </span>
              <h2 className="font-heading mt-2 text-3xl font-bold text-foreground md:text-4xl">
                What's in the Box
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Every order arrives in premium packaging — nothing spared
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {IN_THE_BOX.map((item) => (
                <div
                  key={item.item}
                  className="flex flex-col items-center rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50/50 p-6 text-center transition-all hover:-translate-y-1 hover:shadow-md hover:shadow-amber-100"
                >
                  <div className="mb-3 text-4xl">{item.icon}</div>
                  <p className="text-sm font-bold leading-snug text-foreground">{item.item}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            BENEFITS
        ════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-gradient-to-br from-amber-950 via-amber-900 to-orange-950 py-20 px-5 text-white">
          <div className="pointer-events-none absolute -top-20 -right-20 size-64 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 size-80 rounded-full bg-orange-500/10 blur-3xl" />

          <div className="relative mx-auto max-w-5xl">
            <div className="mb-14 text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                Astrological Benefits
              </span>
              <h2 className="font-heading mt-3 text-3xl font-bold md:text-4xl">
                What This Kada Does For You
              </h2>
              <p className="mt-3 text-amber-300 text-sm md:text-base max-w-xl mx-auto">
                Not just an accessory — a complete astrological remedy system
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {BENEFITS.map((b) => (
                <div
                  key={b.title}
                  className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:bg-white/10 hover:border-amber-400/30 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-900/50"
                >
                  <div className="mb-4 text-5xl">{b.icon}</div>
                  <h3 className="font-heading mb-2 text-lg font-bold leading-snug">{b.title}</h3>
                  <p className="text-sm leading-relaxed text-amber-200/80">{b.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-14 text-center">
              <button
                onClick={scrollToOrder}
                className="inline-flex items-center gap-3 rounded-2xl bg-amber-400 px-10 py-4 text-base font-bold text-amber-950 transition-all hover:bg-amber-300 active:scale-95"
              >
                <Zap size={18} />
                Order Now
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            WHO NEEDS + PLANETARY PROTECTION
        ════════════════════════════════════════ */}
        <section className="bg-white py-20 px-5">
          <div className="mx-auto max-w-5xl">
            <div className="grid grid-cols-1 gap-14 md:grid-cols-2 md:items-start">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-amber-600">
                  Is It For You?
                </span>
                <h2 className="font-heading mt-3 mb-8 text-3xl font-bold text-foreground md:text-4xl">
                  This Kada Is For You If...
                </h2>
                <ul className="space-y-4">
                  {WHO_NEEDS.map((item) => (
                    <li key={item} className="flex items-start gap-3.5">
                      <div className="mt-0.5 flex size-5 flex-shrink-0 items-center justify-center rounded-full border border-amber-200 bg-amber-50">
                        <Check size={11} className="text-amber-600 stroke-[2.5]" />
                      </div>
                      <span className="text-sm leading-relaxed text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 p-8">
                <div className="mb-6 text-center">
                  <div className="relative mx-auto mb-6 size-28 flex items-center justify-center">
                    <div className="kada-ping-slow absolute inset-0 rounded-full border-2 border-amber-200" />
                    <div className="absolute inset-3 rounded-full border border-amber-300/60" />
                    <span className="text-5xl relative z-10">🪬</span>
                  </div>
                  <h3 className="font-heading text-2xl font-bold text-foreground">
                    Planetary Protection
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Balances effects of these planetary doshas
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      planet: "शनि (Saturn)",
                      label: "Shani Dosh",
                      effect: "Obstacles, delays, karmic weight",
                      color: "bg-blue-50 border-blue-100",
                      badge: "text-blue-700 bg-blue-100",
                    },
                    {
                      planet: "राहु (Rahu)",
                      label: "Rahu Dosh",
                      effect: "Confusion, sudden upheaval",
                      color: "bg-purple-50 border-purple-100",
                      badge: "text-purple-700 bg-purple-100",
                    },
                    {
                      planet: "केतु (Ketu)",
                      label: "Ketu Dosh",
                      effect: "Detachment, spiritual blocks",
                      color: "bg-orange-50 border-orange-100",
                      badge: "text-orange-700 bg-orange-100",
                    },
                  ].map(({ planet, label, effect, color, badge }) => (
                    <div
                      key={planet}
                      className={cn("flex items-center justify-between rounded-2xl border p-3.5", color)}
                    >
                      <div>
                        <p className="font-bold text-sm text-foreground">{planet}</p>
                        <p className="text-xs text-muted-foreground">{effect}</p>
                      </div>
                      <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-bold", badge)}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={scrollToOrder}
                  className="mt-6 w-full rounded-2xl bg-amber-700 py-3.5 text-sm font-bold text-white transition-all hover:bg-amber-800"
                >
                  Order Now →
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            HOW IT WORKS
        ════════════════════════════════════════ */}
        <section className="bg-gradient-to-br from-amber-50/80 to-orange-50/30 py-20 px-5">
          <div className="mx-auto max-w-4xl">
            <div className="mb-14 text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-600">
                Simple Process
              </span>
              <h2 className="font-heading mt-3 text-3xl font-bold text-foreground md:text-4xl">
                From Order to Delivery
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                3 steps — personalised, handcrafted, delivered
              </p>
            </div>

            <div className="relative grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="absolute top-10 left-[20%] right-[20%] hidden h-0.5 bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 md:block" />
              {STEPS.map((step) => (
                <div key={step.num} className="relative z-10 text-center">
                  <div className="relative mx-auto mb-6 size-20">
                    <div className="flex size-20 items-center justify-center rounded-3xl border-2 border-amber-200 bg-white shadow-lg">
                      <span className="text-4xl">{step.icon}</span>
                    </div>
                    <div className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-amber-700 text-[10px] font-black text-white shadow">
                      {step.num}
                    </div>
                  </div>
                  <h3 className="font-heading mb-2 text-lg font-bold text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            TESTIMONIALS
        ════════════════════════════════════════ */}
        <section className="bg-white py-20 px-5">
          <div className="mx-auto max-w-5xl">
            <div className="mb-12 text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-600">
                Real Reviews
              </span>
              <h2 className="font-heading mt-3 text-3xl font-bold text-foreground md:text-4xl">
                What Our Customers Say
              </h2>
              <div className="mt-3 flex items-center justify-center gap-1.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18} className="fill-amber-400 text-amber-400" />
                ))}
                <span className="ml-2 text-sm text-muted-foreground">4.9 / 5 · 127 verified reviews</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {TESTIMONIALS.map((t) => (
                <div
                  key={t.name}
                  className="relative overflow-hidden rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50/50 p-6"
                >
                  <div className="pointer-events-none absolute right-5 top-4 font-serif text-7xl leading-none text-amber-200 select-none">
                    "
                  </div>
                  <div className="mb-4 flex items-center gap-2 flex-wrap">
                    <div className="flex gap-0.5">
                      {[...Array(t.stars)].map((_, i) => (
                        <Star key={i} size={13} className="fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
                      {t.tag}
                    </span>
                  </div>
                  <p className="mb-5 text-sm italic leading-relaxed text-foreground">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-amber-700 text-sm font-black text-white shadow">
                      {t.initial}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.city}</p>
                    </div>
                  </div>
                  <div className="mt-4 rounded-xl border border-green-100 bg-green-50 px-3 py-2">
                    <p className="text-xs font-semibold text-green-700">✓ {t.outcome}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            TRUST STRIP
        ════════════════════════════════════════ */}
        <section className="bg-gradient-to-r from-amber-800 to-amber-700 py-14 px-5">
          <div className="mx-auto max-w-4xl">
            <div className="grid grid-cols-2 gap-8 text-center text-white md:grid-cols-4">
              {[
                { icon: "⭐", stat: "4.9 / 5", label: "Average Rating" },
                { icon: "🔒", stat: "100%", label: "Genuine Materials" },
                { icon: "🕉️", stat: "15+", label: "Years Vedic Expertise" },
                { icon: "📦", stat: "Free", label: "Shipping Pan-India" },
              ].map(({ icon, stat, label }) => (
                <div key={label} className="flex flex-col items-center">
                  <div className="mb-2 text-4xl">{icon}</div>
                  <div className="text-3xl font-black">{stat}</div>
                  <div className="mt-1 text-xs text-amber-200">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            FAQ
        ════════════════════════════════════════ */}
        <section className="bg-white py-20 px-5">
          <div className="mx-auto max-w-2xl">
            <div className="mb-12 text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-600">
                FAQs
              </span>
              <h2 className="font-heading mt-3 text-3xl font-bold text-foreground md:text-4xl">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-3">
              {FAQS.map((faq, i) => (
                <div
                  key={i}
                  className={cn(
                    "overflow-hidden rounded-2xl border transition-all",
                    openFaq === i
                      ? "border-amber-300 bg-amber-50 shadow-md"
                      : "border-border bg-white hover:border-amber-200"
                  )}
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="flex w-full items-start justify-between gap-4 p-5 text-left"
                  >
                    <span className="text-sm font-semibold leading-relaxed text-foreground">
                      {faq.q}
                    </span>
                    {openFaq === i ? (
                      <ChevronUp size={18} className="mt-0.5 flex-shrink-0 text-amber-500" />
                    ) : (
                      <ChevronDown size={18} className="mt-0.5 flex-shrink-0 text-amber-400" />
                    )}
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-5">
                      <p className="text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            FINAL CTA
        ════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-gradient-to-br from-amber-950 via-amber-900 to-orange-950 px-5 py-24 text-center text-white">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="kada-particle bg-amber-400/20"
                style={{
                  width: `${5 + (i % 3) * 4}px`,
                  height: `${5 + (i % 3) * 4}px`,
                  left: `${(i * 21) % 91}%`,
                  top: `${15 + (i * 15) % 65}%`,
                  animationDelay: `${i * 0.45}s`,
                  animationDuration: `${3.5 + (i % 3) * 0.7}s`,
                }}
              />
            ))}
          </div>

          <div className="relative mx-auto max-w-xl">
            <div className="mb-6 text-6xl">⚜️</div>
            <h2 className="font-heading mb-4 text-3xl font-bold md:text-4xl">
              Order Your Protective Kada Today
            </h2>
            <p className="mb-8 text-sm text-amber-200 md:text-base">
              Starting at ₹699. Cash on Delivery. Delivered in premium packaging within 15–20 days.
            </p>
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={scrollToOrder}
                className="kada-glow-btn inline-flex items-center gap-3 rounded-2xl bg-amber-400 px-10 py-5 text-lg font-black text-amber-950 shadow-2xl transition-all hover:bg-amber-300 active:scale-95"
              >
                <Sparkles size={22} />
                Order Now — Starting ₹{basePrice.toLocaleString("en-IN")}
                <ArrowRight size={22} />
              </button>
              <a
                href={whatsappUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 rounded-2xl border-2 border-green-400 bg-green-500/10 px-8 py-3.5 text-sm font-bold text-green-300 transition-all hover:bg-green-500/20 active:scale-95"
              >
                <WhatsAppIcon size={18} />
                Order on WhatsApp
              </a>
            </div>
            <p className="mt-5 text-xs text-amber-400">
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
                {variant === "silver" ? "Pure Silver" : "Silver Plated"}{" "}
                {siddha && "· Siddh"} · {size}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <a
                href={whatsappUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex size-11 items-center justify-center rounded-2xl border-2 border-green-400 bg-green-50 text-green-600 transition-all hover:bg-green-100"
                aria-label="Order on WhatsApp"
              >
                <WhatsAppIcon size={20} />
              </a>
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
