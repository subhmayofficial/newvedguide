"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  Check,
  Star,
  Shield,
  Truck,
  Package,
  Clock,
  ArrowRight,
  Sparkles,
  Zap,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

function shImageUrl(num: number) {
  return `/7horses/${num}.webp`;
}

// ── Data ───────────────────────────────────────────────────────────────────────

const TICKER = [
  "🐴 Surya Dev Blessed",
  "💳 Cash on Delivery",
  "✨ Vastu Aligned",
  "🔒 Raw Pyrite Certified",
  "📦 Premium Packaging",
  "☀️ Career & Wealth Remedy",
  "⭐ 4.94 / 5 Rating",
  "🛡️ 7-Day Return Guarantee",
];

const IN_THE_BOX = [
  { icon: "🖼️", item: "7 Horses Raw Pyrite Frame", detail: "13 × 10.5 inch, handcrafted" },
  { icon: "📦", item: "Protective Gift Box", detail: "Rigid black kappa box with foam" },
  { icon: "📜", item: "Authenticity Certificate", detail: "Raw pyrite quality verified" },
  { icon: "📝", item: "Vastu Placement Guide", detail: "Direction & installation instructions" },
];

const BENEFITS = [
  {
    icon: "☀️",
    title: "Surya Dev's Blessing",
    desc: "Seven horses represent the chariot of the Sun God — installing this frame channels Surya Dev's energy directly into your space.",
  },
  {
    icon: "💼",
    title: "Career Growth & Recognition",
    desc: "Raw pyrite combined with seven horses creates a powerful momentum for professional advancement and visibility in your field.",
  },
  {
    icon: "💰",
    title: "Wealth Attraction",
    desc: "Pyrite is known as the 'stone of luck' — its natural properties attract money, opportunities, and financial abundance into your environment.",
  },
  {
    icon: "🪐",
    title: "Saturn's Positive Influence",
    desc: "Raw pyrite strengthens Saturn's beneficial aspects — bringing discipline, structure, and consistent long-term growth.",
  },
  {
    icon: "⚡",
    title: "Business Momentum",
    desc: "Stuck deals start moving. Pending matters resolve. Wearers consistently report a shift in business energy within weeks of installation.",
  },
  {
    icon: "🏆",
    title: "Fame & Prestige",
    desc: "The seven horses radiate outward success energy — attracting recognition, authority, and social prestige in professional circles.",
  },
];

const HORSE_NAMES = [
  { name: "गायत्री", eng: "Gayatri", meaning: "Purity" },
  { name: "बृहत्", eng: "Brihat", meaning: "Expansion" },
  { name: "अनुपूष", eng: "Anupush", meaning: "Skill" },
  { name: "जगति", eng: "Jagati", meaning: "Movement" },
  { name: "त्रिश्णु", eng: "Trishnu", meaning: "Strength" },
  { name: "उष्णि", eng: "Ushni", meaning: "Vitality" },
  { name: "पदिक", eng: "Padik", meaning: "Structure" },
];

const WHO_NEEDS = [
  "Experiencing career stagnation or professional blockages",
  "Wanting to attract more clients, deals, or business opportunities",
  "Looking to improve financial flow and wealth accumulation",
  "Seeking Vastu remedies for home or office",
  "Going through a weak Sun (Surya) period in their horoscope",
  "Business owners wanting sustained growth momentum",
  "Professionals seeking recognition and promotion",
];

const STEPS = [
  {
    num: "01",
    icon: "🛒",
    title: "Place Your Order",
    desc: "Choose Standard or Siddh Energised. Pay on delivery or prepaid — both available.",
  },
  {
    num: "02",
    icon: "🕉️",
    title: "Careful Preparation",
    desc: "Your frame is quality-checked and packed. Siddh option includes Vedic ritual energisation at an auspicious muhurat.",
  },
  {
    num: "03",
    icon: "📦",
    title: "Delivered to Your Door",
    desc: "Shipped in a rigid protective box. Free delivery pan-India, prepaid orders get priority dispatch.",
  },
];

const TESTIMONIALS = [
  {
    initial: "R",
    name: "Rajesh J.",
    city: "Lucknow",
    tag: "Career Growth",
    stars: 5,
    text: "Installed it in my office facing northeast as instructed. Within a month, two pending deals closed and I got a recognition award. This frame genuinely shifts the energy of the room.",
    outcome: "Two deals closed in one month",
  },
  {
    initial: "B",
    name: "Bhavna M.",
    city: "Pune",
    tag: "Wealth Attraction",
    stars: 5,
    text: "The raw pyrite quality is exceptional — heavy and authentic. I've noticed more financial opportunities coming my way since installation. Premium packaging too.",
    outcome: "Visible financial improvement",
  },
  {
    initial: "S",
    name: "Shaurya J.",
    city: "Delhi",
    tag: "Business Momentum",
    stars: 5,
    text: "Solid quality, beautiful craftsmanship. My mindset shifted and business momentum picked up within weeks. The seven horses really do look powerful on the wall.",
    outcome: "Business momentum picked up",
  },
];

const POPUP_NAMES = [
  "Rahul S.", "Priya M.", "Amit K.", "Sneha R.", "Vikram P.", "Anjali T.", "Rohit G.", "Meena D.",
  "Suresh B.", "Kavita N.", "Deepak J.", "Sunita C.", "Anil V.", "Pooja A.", "Manoj L.", "Ritu S.",
  "Sanjay H.", "Geeta P.", "Vikas M.", "Nisha R.", "Rajesh T.", "Lakshmi K.", "Karan B.", "Smita G.",
  "Naveen J.", "Asha C.", "Tarun V.", "Divya N.", "Mohit A.", "Rekha L.", "Saurabh H.", "Puja P.",
  "Ankit M.", "Shruti R.", "Gaurav T.", "Neha K.", "Ritesh B.", "Pallavi G.", "Sumit J.", "Kamla C.",
  "Rajan V.", "Swati N.", "Vivek A.", "Bharti L.", "Sachin H.", "Usha P.", "Harsh M.", "Nidhi R.",
  "Pawan T.", "Seema K.", "Nikhil B.", "Komal G.", "Rajiv J.", "Sudha C.", "Varun V.", "Manju N.",
  "Lokesh A.", "Preeti L.", "Devesh H.", "Rani P.", "Chirag M.", "Archana R.", "Tushar T.", "Savita K.",
];

const POPUP_CITIES = [
  "Delhi", "Mumbai", "Bangalore", "Chennai", "Hyderabad", "Pune", "Kolkata", "Ahmedabad",
  "Jaipur", "Surat", "Lucknow", "Kanpur", "Nagpur", "Indore", "Bhopal", "Patna",
  "Vadodara", "Ludhiana", "Agra", "Nashik", "Meerut", "Rajkot", "Varanasi", "Amritsar",
  "Allahabad", "Ranchi", "Coimbatore", "Jodhpur", "Madurai", "Raipur",
];

const POPUP_ITEMS = ["7 Horses Standard Frame", "7 Horses Siddh Energised Frame"];

const FAQS = [
  {
    q: "Where exactly should I place the 7 Horses frame?",
    a: "Vastu recommends the East or Northeast wall of your home or office. Avoid placing it in bathrooms, bedrooms, or facing the main entrance directly. Sunday is the ideal day to install it, aligned with Sun God energy.",
  },
  {
    q: "What is the Siddh Energised option?",
    a: "For ₹299 extra, your frame is energised through specific Vedic mantras and Gangajal ritual performed at an auspicious muhurat. It is consecrated in your name, making it a spiritually activated remedy beyond a decorative frame.",
  },
  {
    q: "Is the pyrite raw or polished?",
    a: "The frame uses raw, unpolished pyrite — which Vedic texts consider more potent for attracting wealth energy. Raw pyrite retains its natural crystal structure and energetic properties better than polished stone.",
  },
  {
    q: "Is Cash on Delivery available?",
    a: "Yes, COD is available pan-India. Prepaid orders receive priority dispatch and ₹299 off on prepaid orders.",
  },
  {
    q: "What if the frame arrives damaged?",
    a: "7-day return guarantee — if the product arrives damaged or defective, full replacement is guaranteed, no questions asked. We pack in a rigid kappa box with protective foam specifically to prevent transit damage.",
  },
];

const GALLERY_IMAGES = [1, 2, 3, 4, 5].map((num) => ({
  id: num,
  src: shImageUrl(num),
  alt: `7 Horses on Raw Pyrite Frame — photo ${num}`,
}));

const BASE_PRICE = 1699;
const MRP = 2900;
const DISC_PCT = 41;

// ── Main Component ─────────────────────────────────────────────────────────────

export function SevenHorsesProductPage() {
  const router = useRouter();

  const [siddh, setSiddh] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [slideDir, setSlideDir] = useState<"right" | "left">("right");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [stickyVisible, setStickyVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ h: 20, m: 14, s: 44 });

  const heroRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const [popup, setPopup] = useState<{ name: string; city: string; item: string } | null>(null);
  const popupIndexRef = useRef(Math.floor(Math.random() * POPUP_NAMES.length));

  const displayPrice = siddh ? BASE_PRICE + 299 : BASE_PRICE;

  function goToImage(idx: number) {
    setSlideDir(idx > activeImage ? "right" : "left");
    setActiveImage(idx);
  }

  const goToCheckout = () => {
    const params = new URLSearchParams({ siddh: siddh ? "1" : "0" });
    router.push(`/checkout/7horses?${params.toString()}`);
  };

  // Countdown timer
  useEffect(() => {
    const id = setInterval(() => {
      setTimeLeft((prev) => {
        let { h, m, s } = prev;
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) { h = 23; m = 59; s = 59; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Sticky bar observer
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

  // Purchase popup
  useEffect(() => {
    function showNext() {
      const idx = popupIndexRef.current % POPUP_NAMES.length;
      const cityIdx = Math.floor(Math.random() * POPUP_CITIES.length);
      const itemIdx = Math.floor(Math.random() * POPUP_ITEMS.length);
      setPopup({ name: POPUP_NAMES[idx], city: POPUP_CITIES[cityIdx], item: POPUP_ITEMS[itemIdx] });
      popupIndexRef.current = (idx + 1) % POPUP_NAMES.length;
      setTimeout(() => setPopup(null), 3500);
    }
    const first = setTimeout(() => {
      showNext();
      const interval = setInterval(showNext, Math.floor(Math.random() * 2000) + 4000);
      return () => clearInterval(interval);
    }, 4000);
    return () => clearTimeout(first);
  }, []);

  // Scroll animation observer
  useEffect(() => {
    const els = document.querySelectorAll("[data-anim]");
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("anim-on");
            obs.unobserve(e.target);
          }
        }),
      { threshold: 0.12 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <>
      <style>{`
        @keyframes sh-shimmer-text {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
        @keyframes sh-ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes sh-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(180,83,9,0); }
          50% { box-shadow: 0 0 32px 4px rgba(180,83,9,0.45); }
        }
        @keyframes sh-particle {
          0% { transform: translateY(0) scale(1); opacity: 0.7; }
          100% { transform: translateY(-80px) scale(0.1); opacity: 0; }
        }
        @keyframes sh-ping-slow {
          0% { transform: scale(1); opacity: 0.8; }
          70% { transform: scale(1.6); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }
        @keyframes sh-pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        @keyframes sh-slide-right {
          from { transform: translateX(105%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes sh-slide-left {
          from { transform: translateX(-105%); opacity: 0; }
          to   { transform: translateX(0);     opacity: 1; }
        }
        .sh-slide-in-right { animation: sh-slide-right 0.36s cubic-bezier(0.25,0.46,0.45,0.94) forwards; }
        .sh-slide-in-left  { animation: sh-slide-left  0.36s cubic-bezier(0.25,0.46,0.45,0.94) forwards; }
        .sh-shimmer-text {
          background: linear-gradient(90deg, #92400e 0%, #b45309 30%, #f59e0b 50%, #b45309 70%, #92400e 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: sh-shimmer-text 4s linear infinite;
        }
        .sh-ticker-track {
          display: flex;
          width: max-content;
          animation: sh-ticker 32s linear infinite;
        }
        .sh-glow-btn { animation: sh-glow 2.5s ease-in-out infinite; }
        .sh-particle {
          position: absolute;
          border-radius: 50%;
          animation: sh-particle ease-out infinite;
        }
        .sh-ping-slow { animation: sh-ping-slow 2.5s cubic-bezier(0,0,0.2,1) infinite; }
        .sh-pulse-dot { animation: sh-pulse-dot 1.8s ease-in-out infinite; }
        @keyframes sh-popup-in {
          0%   { transform: translateY(-24px) scale(0.92); opacity: 0; }
          60%  { transform: translateY(4px)   scale(1.02); opacity: 1; }
          100% { transform: translateY(0)     scale(1);    opacity: 1; }
        }
        @keyframes sh-popup-out {
          from { transform: translateY(0); opacity: 1; }
          to   { transform: translateY(-16px); opacity: 0; }
        }
        .sh-popup-enter { animation: sh-popup-in 0.44s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .sh-popup-exit  { animation: sh-popup-out 0.28s ease-in forwards; }
        [data-anim] { opacity: 0; transform: translateY(22px); transition: opacity 0.55s ease, transform 0.55s ease; }
        [data-anim].anim-on { opacity: 1; transform: none; }
        [data-anim-d="1"] { transition-delay: 0.08s; }
        [data-anim-d="2"] { transition-delay: 0.16s; }
        [data-anim-d="3"] { transition-delay: 0.24s; }
        [data-anim-d="4"] { transition-delay: 0.32s; }
        [data-anim-d="5"] { transition-delay: 0.40s; }
        [data-anim-d="6"] { transition-delay: 0.48s; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="min-h-screen bg-white pb-[5.5rem] md:pb-0">

        {/* ════════════════════════════════════════
            1. PRODUCT IMAGE AREA
        ════════════════════════════════════════ */}
        <section ref={heroRef} className="bg-white pt-4 pb-0">
          <div className="mx-auto max-w-lg px-4">
            {/* Main image */}
            <div
              className="relative aspect-square w-full overflow-hidden rounded-2xl bg-stone-50"
              onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
              onTouchEnd={(e) => {
                if (touchStartX.current === null) return;
                const diff = touchStartX.current - e.changedTouches[0].clientX;
                if (Math.abs(diff) > 40) {
                  if (diff > 0) goToImage(Math.min(activeImage + 1, GALLERY_IMAGES.length - 1));
                  else goToImage(Math.max(activeImage - 1, 0));
                }
                touchStartX.current = null;
              }}
            >
              <div
                key={activeImage}
                className={cn(
                  "absolute inset-0",
                  slideDir === "right" ? "sh-slide-in-right" : "sh-slide-in-left"
                )}
              >
                <Image
                  src={GALLERY_IMAGES[activeImage].src}
                  alt={GALLERY_IMAGES[activeImage].alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 512px) 100vw, 512px"
                  priority={activeImage === 0}
                />
              </div>

              {/* Dot indicators overlaid at bottom of image */}
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
                {GALLERY_IMAGES.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => goToImage(i)}
                    aria-label={`Image ${i + 1}`}
                    className={cn(
                      "rounded-full transition-all duration-300",
                      activeImage === i
                        ? "w-5 h-2 bg-amber-500"
                        : "size-2 bg-white/70 hover:bg-white"
                    )}
                  />
                ))}
              </div>
            </div>

            {/* 2. Thumbnail strip */}
            <div className="mt-3 flex gap-2 overflow-x-auto hide-scrollbar">
              {GALLERY_IMAGES.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => goToImage(i)}
                  aria-label={img.alt}
                  aria-pressed={activeImage === i}
                  className={cn(
                    "relative size-16 shrink-0 overflow-hidden rounded-xl border-2 bg-stone-50 transition-all",
                    activeImage === i
                      ? "border-amber-500 shadow-md shadow-amber-200"
                      : "border-stone-200 opacity-60 hover:opacity-100"
                  )}
                >
                  <Image src={img.src} alt="" fill className="object-cover" sizes="64px" />
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            3. PRODUCT INFO SECTION
        ════════════════════════════════════════ */}
        <section className="mx-auto max-w-lg px-4 mt-4">
          {/* Title */}
          <h1 className="text-2xl font-black text-stone-900 leading-tight">
            Limited Edition — 7 Horses on Raw Pyrite Frame
          </h1>

          {/* Benefit tag chips */}
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
              Attracts Money
            </span>
            <span className="border border-amber-500 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">
              Attracts Fame &amp; Recognition
            </span>
          </div>

          {/* Rating row */}
          <div className="mt-2 flex items-center gap-1.5">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={13} className="fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-sm font-semibold text-stone-700">4.94</span>
            <span className="text-sm text-stone-400">· 388 reviews</span>
          </div>

          {/* ════════════════════════════════════════
              4. PRICE CARD
          ════════════════════════════════════════ */}
          <div className="mt-4 border border-stone-200 rounded-2xl p-4">
            {/* Price row */}
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-3xl font-black text-stone-900">
                ₹{displayPrice.toLocaleString("en-IN")}
              </span>
              <span className="text-base text-stone-400 line-through">
                ₹{MRP.toLocaleString("en-IN")}
              </span>
              <span className="bg-red-500 text-white rounded px-2 py-0.5 text-xs font-black">
                {DISC_PCT}% OFF
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-1">Inclusive of all taxes</p>

            <hr className="my-3 border-stone-100" />

            {/* Countdown */}
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-green-600 shrink-0" />
              <span className="text-xs text-stone-600">Offer ends in</span>
              <span className="text-sm font-black text-green-600 tabular-nums">
                {pad(timeLeft.h)} hr : {pad(timeLeft.m)} min : {pad(timeLeft.s)} sec
              </span>
            </div>
          </div>

          {/* ════════════════════════════════════════
              5. SIDDH ADD-ON TOGGLE
          ════════════════════════════════════════ */}
          <div className="mt-3 rounded-2xl border border-stone-200 p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  checked={siddh}
                  onChange={(e) => setSiddh(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={cn(
                    "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                    siddh
                      ? "bg-amber-600 border-amber-600"
                      : "border-stone-300 bg-white"
                  )}
                >
                  {siddh && <Check size={12} className="text-white stroke-[3]" />}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-stone-900">
                  Add Siddh Energisation{" "}
                  <span className="text-amber-600 font-black">(+₹299)</span>
                </p>
                <p className="text-xs text-stone-500 mt-0.5 leading-snug">
                  Vedic rituals performed at auspicious muhurat, energised in your name
                </p>
              </div>
            </label>
          </div>

          {/* ════════════════════════════════════════
              6. CASHBACK BANNER
          ════════════════════════════════════════ */}
          <div className="bg-green-600 text-white rounded-2xl p-3 mt-3 text-center text-sm font-bold">
            🎁 ₹299 off on prepaid orders
          </div>

          {/* ════════════════════════════════════════
              7. CTA BUTTONS
          ════════════════════════════════════════ */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={goToCheckout}
              className="border-2 border-amber-600 text-amber-700 bg-white font-black rounded-2xl py-4 text-sm transition-all hover:bg-amber-50 active:scale-95"
            >
              Add to Cart
            </button>
            <button
              type="button"
              onClick={goToCheckout}
              className="sh-glow-btn bg-amber-600 text-white font-black rounded-2xl py-4 text-sm transition-all hover:bg-amber-700 active:scale-95 flex items-center justify-center gap-1.5"
            >
              Buy Now <ArrowRight size={15} />
            </button>
          </div>

          {/* ════════════════════════════════════════
              8. TRUST CHIPS ROW
          ════════════════════════════════════════ */}
          <div className="mt-4 flex flex-wrap gap-2 justify-center pb-6">
            {[
              { icon: <Truck size={11} />, text: "Free Shipping" },
              { icon: <Package size={11} />, text: "COD Available" },
              { icon: <Shield size={11} />, text: "7-Day Returns" },
              { icon: <Sparkles size={11} />, text: "Handcrafted" },
            ].map(({ icon, text }) => (
              <span
                key={text}
                className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-800"
              >
                {icon}
                {text}
              </span>
            ))}
          </div>
        </section>

        {/* ════════════════════════════════════════
            9. TICKER STRIP
        ════════════════════════════════════════ */}
        <div className="overflow-hidden bg-amber-700 py-3">
          <div className="sh-ticker-track">
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
            10. WHAT'S IN THE BOX
        ════════════════════════════════════════ */}
        <section className="bg-amber-950 py-16 px-5">
          <div className="mx-auto max-w-4xl">
            <div className="mb-10 text-center" data-anim>
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-400">Unboxing</span>
              <h2 className="font-heading mt-2 text-3xl font-black text-white md:text-4xl">What&apos;s in the Box</h2>
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

        {/* ════════════════════════════════════════
            11. BENEFITS
        ════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-gradient-to-b from-amber-900 to-amber-950 py-24 px-5 text-white">
          <div className="pointer-events-none absolute -top-32 right-0 size-[500px] rounded-full bg-amber-500/5 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 -left-20 size-96 rounded-full bg-orange-600/5 blur-3xl" />

          <div className="relative mx-auto max-w-3xl">
            <div className="mb-16 text-center" data-anim>
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-400">Astrological Benefits</span>
              <h2 className="font-heading mt-3 text-4xl font-black text-white md:text-5xl">What It Does For You</h2>
              <p className="mt-3 text-sm text-amber-300/70 md:text-base">Not just décor — a Vastu-aligned prosperity remedy</p>
            </div>

            <div className="divide-y divide-white/10">
              {BENEFITS.map((b, i) => (
                <div
                  key={b.title}
                  data-anim
                  data-anim-d={String(Math.min(i + 1, 6))}
                  className="group flex items-start gap-5 py-7 transition-all hover:bg-white/[0.03] -mx-4 px-4 rounded-2xl"
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
                onClick={goToCheckout}
                className="sh-glow-btn inline-flex items-center gap-3 rounded-2xl bg-amber-400 px-10 py-4 text-base font-black text-amber-950 transition-all hover:bg-amber-300 active:scale-95"
              >
                <Zap size={18} />
                Order Now
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            12. MYTHOLOGY — 7 Horse Names
        ════════════════════════════════════════ */}
        <section className="bg-amber-950 py-24 px-5">
          <div className="mx-auto max-w-3xl">
            <div className="mb-14 text-center" data-anim>
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-400">Vedic Mythology</span>
              <h2 className="font-heading mt-3 text-4xl font-black text-white md:text-5xl">
                The Seven Divine Horses of Surya Dev
              </h2>
              <p className="mt-3 text-sm text-amber-300/70 md:text-base">
                Each horse carries a divine quality — together they pull the Sun God&apos;s chariot across the sky
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" data-anim data-anim-d="1">
              {HORSE_NAMES.map((horse, i) => (
                <div
                  key={horse.eng}
                  className="flex items-center gap-4 rounded-2xl border border-amber-800/50 bg-amber-900/40 px-5 py-4"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-700/60 text-sm font-black text-amber-300">
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <p className="font-heading text-lg font-black text-amber-300">{horse.name}</p>
                      <p className="text-sm font-semibold text-stone-400">({horse.eng})</p>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-500">{horse.meaning}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 rounded-3xl border border-amber-700/40 bg-amber-900/30 p-6 text-center" data-anim>
              <span className="text-4xl">☀️</span>
              <p className="mt-3 text-sm leading-relaxed text-amber-200/80">
                In Vedic texts, these seven horses represent the seven rays of the Sun — each ray carrying a specific form of cosmic energy into your space when the frame is installed correctly.
              </p>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            13. VASTU PLACEMENT
        ════════════════════════════════════════ */}
        <section className="bg-white py-24 px-5">
          <div className="mx-auto max-w-2xl">
            <div className="mb-12 text-center" data-anim>
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-600">Placement Guide</span>
              <h2 className="font-heading mt-3 text-4xl font-black text-stone-900 md:text-5xl">
                Where to Place<br />Your Frame
              </h2>
              <p className="mt-3 text-sm text-stone-500">Correct placement maximises the Vastu benefit</p>
            </div>

            <div className="grid grid-cols-2 gap-4" data-anim data-anim-d="1">
              {[
                { icon: "🧭", label: "Direction", value: "East or Northeast Wall", note: "Never place facing main entrance" },
                { icon: "📅", label: "Best Day to Install", value: "Sunday", note: "Aligns with Surya Dev's energy" },
                { icon: "🏢", label: "Ideal Rooms", value: "Office, Living Room", note: "Study Room, Reception also ideal" },
                { icon: "🚫", label: "Avoid", value: "Bathrooms, Bedrooms", note: "Do not place on the floor" },
              ].map(({ icon, label, value, note }) => (
                <div key={label} className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5">
                  <span className="text-3xl">{icon}</span>
                  <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-amber-600">{label}</p>
                  <p className="mt-1 text-base font-black text-stone-900">{value}</p>
                  <p className="mt-1 text-xs text-stone-400">{note}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-3xl bg-gradient-to-br from-amber-700 to-amber-900 p-8 text-center text-white" data-anim>
              <div className="relative mx-auto mb-5 size-20 flex items-center justify-center">
                <div className="sh-ping-slow absolute inset-0 rounded-full border-2 border-amber-300/40" />
                <div className="absolute inset-3 rounded-full border border-amber-400/30" />
                <span className="relative z-10 text-4xl">🐴</span>
              </div>
              <h3 className="font-heading text-2xl font-black">A Vastu Placement Guide is Included</h3>
              <p className="mt-2 mb-5 text-sm text-amber-200">
                Every order ships with detailed placement instructions — direction, height, and best practices from Vastu Shastra.
              </p>
              <button
                onClick={goToCheckout}
                className="w-full rounded-2xl bg-white py-3.5 text-sm font-black text-amber-800 transition-all hover:bg-amber-50"
              >
                Order Now →
              </button>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            14. WHO NEEDS IT
        ════════════════════════════════════════ */}
        <section className="bg-white py-24 px-5">
          <div className="mx-auto max-w-2xl">
            <div className="mb-12 text-center" data-anim>
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-600">Is It For You?</span>
              <h2 className="font-heading mt-3 text-4xl font-black text-stone-900 md:text-5xl">
                This Frame Is<br />For You If...
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
          </div>
        </section>

        {/* ════════════════════════════════════════
            15. HOW IT WORKS
        ════════════════════════════════════════ */}
        <section className="bg-stone-50 py-24 px-5">
          <div className="mx-auto max-w-xl">
            <div className="mb-16 text-center" data-anim>
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-600">Simple Process</span>
              <h2 className="font-heading mt-3 text-4xl font-black text-stone-900 md:text-5xl">From Order<br />to Your Wall</h2>
            </div>

            <div className="relative">
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

        {/* ════════════════════════════════════════
            16. TESTIMONIALS
        ════════════════════════════════════════ */}
        <section className="bg-amber-950 py-24 px-5 text-white">
          <div className="mx-auto max-w-4xl">
            <div className="mb-14 text-center" data-anim>
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-400">Real Stories</span>
              <h2 className="font-heading mt-3 text-4xl font-black text-white md:text-5xl">Results People Are Seeing</h2>
              <div className="mt-4 flex items-center justify-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} className="fill-amber-400 text-amber-400" />
                ))}
                <span className="ml-2 text-sm text-stone-400">4.94 / 5 · 388 verified reviews</span>
              </div>
            </div>

            {/* Featured */}
            <div className="mb-5 rounded-3xl border border-white/10 bg-white/5 p-8 md:p-10" data-anim>
              <div className="font-serif text-8xl leading-none text-amber-600/30 select-none">&quot;</div>
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
                  <p className="mb-4 text-sm italic leading-relaxed text-stone-300">&quot;{t.text}&quot;</p>
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

        {/* ════════════════════════════════════════
            17. TRUST STRIP
        ════════════════════════════════════════ */}
        <section className="bg-amber-700 py-16 px-5" data-anim>
          <div className="mx-auto max-w-4xl">
            <div className="grid grid-cols-2 divide-x divide-amber-600 md:grid-cols-4">
              {[
                { stat: "4.94/5", label: "Average Rating", sub: "388 reviews" },
                { stat: "100%", label: "Raw Pyrite", sub: "Authenticated" },
                { stat: "7-Day", label: "Return Guarantee", sub: "Hassle-free" },
                { stat: "Free", label: "Shipping Pan-India", sub: "COD available" },
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

        {/* ════════════════════════════════════════
            18. FAQ
        ════════════════════════════════════════ */}
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

        {/* ════════════════════════════════════════
            19. FINAL CTA
        ════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-gradient-to-br from-amber-900 via-amber-800 to-amber-950 px-5 py-28 text-center text-white">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="sh-particle bg-amber-400/15"
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
            <div className="mb-6 text-7xl">🐴</div>
            <h2 className="font-heading mb-4 text-4xl font-black md:text-5xl">
              Transform Your Space.<br />Attract Success Today.
            </h2>
            <p className="mb-10 text-sm text-amber-300 md:text-base">
              ₹1,699 · Cash on Delivery · Free Shipping Pan-India
            </p>
            <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
              <button
                onClick={goToCheckout}
                className="border-2 border-amber-300 text-white font-black rounded-2xl py-4 text-sm transition-all hover:bg-white/10 active:scale-95"
              >
                Add to Cart
              </button>
              <button
                onClick={goToCheckout}
                className="sh-glow-btn inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-400 py-4 text-sm font-black text-amber-950 shadow-2xl transition-all hover:bg-amber-300 active:scale-95"
              >
                <Sparkles size={16} />
                Buy Now
              </button>
            </div>
            <p className="mt-5 text-xs text-amber-500">
              No advance payment · Pay on delivery · Free shipping
            </p>
          </div>
        </section>

        {/* ════════════════════════════════════════
            20. STICKY BOTTOM BAR
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
                <span className="text-xl font-black text-stone-900">
                  ₹{displayPrice.toLocaleString("en-IN")}
                </span>
                <span className="text-sm text-stone-400 line-through">
                  ₹{MRP.toLocaleString("en-IN")}
                </span>
                <span className="text-xs font-black text-red-500">{DISC_PCT}% OFF</span>
              </div>
              <p className="truncate text-[11px] text-amber-600">
                {siddh ? "Siddh Energised" : "Standard"} · 7 Horses Raw Pyrite
              </p>
            </div>
            <button
              type="button"
              onClick={goToCheckout}
              className="sh-glow-btn shrink-0 rounded-2xl bg-amber-600 px-6 py-3 text-sm font-black text-white shadow-lg transition-all hover:bg-amber-700 active:scale-95 flex items-center gap-1.5"
            >
              Buy Now <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* ════════════════════════════════════════
            21. PURCHASE POPUP
        ════════════════════════════════════════ */}
        {popup && (
          <div className="sh-popup-enter fixed top-16 right-3 z-[60] max-w-[240px]">
            <div className="flex items-center gap-3 rounded-2xl border border-amber-100 bg-white px-3.5 py-3 shadow-2xl shadow-amber-200/50">
              <div className="relative shrink-0">
                <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-200 text-sm font-black text-amber-700">
                  {popup.name[0]}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 flex size-3 items-center justify-center rounded-full bg-green-500">
                  <span className="size-1.5 rounded-full bg-white" />
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-black text-stone-800 leading-snug">
                  {popup.name}
                  <span className="font-semibold text-stone-500"> from {popup.city}</span>
                </p>
                <p className="text-[10px] text-amber-600 font-semibold leading-tight mt-0.5">
                  purchased {popup.item}
                </p>
                <p className="text-[9px] text-stone-400 mt-0.5">just now ✓</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
