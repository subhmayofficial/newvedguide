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
  Tag,
  CreditCard,
  ShoppingCart,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SEVEN_HORSES_COD_PRICE as BASE_PRICE,
  SEVEN_HORSES_PREPAID_PRICE as PREPAID_PRICE,
  SEVEN_HORSES_SIDDH_EXTRA as SIDDH_EXTRA,
  SEVEN_HORSES_MRP as MRP,
  SEVEN_HORSES_PREPAID_DISCOUNT,
  sevenHorsesDiscountPct,
  sevenHorsesPrepaidPrice,
} from "@/lib/constants/seven-horses-pricing";

function shImageUrl(num: number) {
  return `/7horses/${num}.webp`;
}

// ── Data ───────────────────────────────────────────────────────────────────────

const PRODUCT_NAME = "7 Horses on Frame";

const TICKER = [
  "🐴 Surya Dev Blessed",
  "💳 Cash on Delivery",
  "✨ Vastu Aligned",
  "🛡️ 100% Anti-Scratchable",
  "📦 Premium Packaging",
  "☀️ Career & Wealth Remedy",
  "⭐ 4.94 / 5 Rating",
  "🛡️ 7-Day Return Guarantee",
];

const IN_THE_BOX = [
  { icon: "🖼️", item: "7 Horses on Frame", detail: "13 × 10.5 inch, handcrafted" },
  { icon: "🛡️", item: "Anti-Scratch Surface", detail: "100% scratch-resistant premium finish" },
  { icon: "📦", item: "Protective Gift Box", detail: "Rigid black kappa box with foam" },
  { icon: "📝", item: "Vastu Placement Guide", detail: "Direction & installation instructions" },
];

const BENEFITS = [
  {
    icon: "☀️",
    title: "Surya Dev's Blessing",
    desc: "Seven horses represent the chariot of the Sun God — installing this frame channels Surya Dev's energy directly into your space.",
  },
  {
    icon: "🛡️",
    title: "100% Anti-Scratchable",
    desc: "Premium scratch-resistant surface keeps the frame looking new for years — safe to wipe, dust, and display in high-traffic home or office spaces.",
  },
  {
    icon: "💼",
    title: "Career Growth & Recognition",
    desc: "In Vedic astrology, seven horses symbolise momentum and visibility — this frame is designed as a career and success remedy for your workspace.",
  },
  {
    icon: "💰",
    title: "Wealth Attraction",
    desc: "The seven horses radiate prosperity energy in Vastu — attracting money flow, opportunities, and financial abundance into your environment.",
  },
  {
    icon: "🪐",
    title: "Saturn's Positive Influence",
    desc: "Correct placement supports Saturn's beneficial aspects — bringing discipline, structure, and consistent long-term growth.",
  },
  {
    icon: "⚡",
    title: "Business Momentum",
    desc: "Stuck deals start moving. Pending matters resolve. Customers consistently report a shift in business energy within weeks of installation.",
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
    text: "Solid build and the surface still looks brand new after weeks on my office wall. I've noticed more financial opportunities since installation. Premium packaging too.",
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
    a: "For ₹251 extra, your frame is energised through specific Vedic mantras and Gangajal ritual performed at an auspicious muhurat. It is consecrated in your name, making it a spiritually activated remedy beyond a decorative frame.",
  },
  {
    q: "Is the frame anti-scratchable?",
    a: "Yes — the surface is 100% anti-scratchable with a premium protective finish. Daily dusting and gentle wiping won't leave marks, so it stays display-ready in home or office.",
  },
  {
    q: "Is Cash on Delivery available?",
    a: `Yes, COD is available pan-India at ₹${BASE_PRICE}. Prepaid orders receive priority dispatch and are priced at ₹${PREPAID_PRICE} — save ₹${SEVEN_HORSES_PREPAID_DISCOUNT} on online payment.`,
  },
  {
    q: "What if the frame arrives damaged?",
    a: "7-day return guarantee — if the product arrives damaged or defective, full replacement is guaranteed, no questions asked. We pack in a rigid kappa box with protective foam specifically to prevent transit damage.",
  },
];

const GALLERY_IMAGES = [1, 2, 3, 4, 5].map((num) => ({
  id: num,
  src: shImageUrl(num),
  alt: `${PRODUCT_NAME} — photo ${num}`,
}));

const DISC_PCT = sevenHorsesDiscountPct();

const MINI_TESTIMONIALS = [
  { initial: "S", name: "Shaurya J.", city: "Delhi", stars: 5, text: "Material is solid. Ghar mein lagaya toh dekhne mein bhi accha lagta hai. Mindset better hua aur business growth bhi hui hai honestly." },
  { initial: "R", name: "Rajesh J.", city: "Lucknow", stars: 5, text: "Two pending deals closed within a month of installing this in my office facing northeast. The energy shift is real." },
  { initial: "B", name: "Bhavna M.", city: "Pune", stars: 5, text: "Frame quality is excellent — anti-scratch surface still looks new. Financial opportunities have noticeably increased since installation." },
];

// ── OfferCard ──────────────────────────────────────────────────────────────────
function OfferCard({ onBuyNow }: { onBuyNow: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3 rounded-2xl border-2 border-amber-200 bg-amber-50 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-700 text-white text-xs font-black">%</span>
        <span className="flex-1 text-sm font-bold text-stone-800">Vedic Special Offer</span>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1 rounded-full bg-amber-600 px-3 py-1 text-xs font-black text-white"
        >
          {open ? "Hide" : "View Offer"} {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>
      {open && (
        <div className="border-t border-amber-200 bg-amber-100/60 px-4 py-4 space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0">🎁</span>
            <div>
              <p className="text-sm font-black text-stone-900">₹{SEVEN_HORSES_PREPAID_DISCOUNT} off on Prepaid — Pay only ₹{PREPAID_PRICE}</p>
              <p className="text-xs text-stone-600 mt-0.5">Pay online at checkout and get it for ₹{PREPAID_PRICE} — no coupon needed.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0">🔶</span>
            <div>
              <p className="text-sm font-black text-stone-900">Free Shipping Pan-India</p>
              <p className="text-xs text-stone-600 mt-0.5">No shipping charge on any order. Delivered in a rigid protective box.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onBuyNow}
            className="w-full rounded-xl bg-amber-600 py-3 text-sm font-black text-white transition-all hover:bg-amber-700"
          >
            Claim Offer — Buy Now →
          </button>
        </div>
      )}
    </div>
  );
}

// ── MiniTestimonials ───────────────────────────────────────────────────────────
function MiniTestimonials() {
  const [idx, setIdx] = useState(0);
  const t = MINI_TESTIMONIALS[idx];
  return (
    <div className="mt-3 rounded-2xl border border-stone-200 bg-white overflow-hidden">
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-black text-amber-700">{t.initial}</div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-stone-800">{t.name}</span>
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[9px] font-bold text-green-700">✓ Verified</span>
            </div>
            <div className="flex gap-0.5 mt-0.5">
              {[...Array(t.stars)].map((_, i) => <Star key={i} size={10} className="fill-amber-400 text-amber-400" />)}
            </div>
          </div>
          <span className="ml-auto text-[10px] text-stone-400">{t.city}</span>
        </div>
        <p className="text-xs text-stone-600 leading-relaxed line-clamp-3">"{t.text}"</p>
      </div>
      <div className="flex items-center justify-between border-t border-stone-100 px-4 py-2">
        <button type="button" onClick={() => setIdx((i) => (i - 1 + MINI_TESTIMONIALS.length) % MINI_TESTIMONIALS.length)}
          className="flex size-7 items-center justify-center rounded-full border border-stone-200 text-stone-500 hover:bg-stone-50">
          <ChevronDown size={13} className="rotate-90" />
        </button>
        <div className="flex gap-1.5">
          {MINI_TESTIMONIALS.map((_, i) => (
            <button key={i} type="button" onClick={() => setIdx(i)}
              className={cn("rounded-full transition-all", i === idx ? "w-5 h-2 bg-amber-500" : "size-2 bg-stone-300")} />
          ))}
        </div>
        <button type="button" onClick={() => setIdx((i) => (i + 1) % MINI_TESTIMONIALS.length)}
          className="flex size-7 items-center justify-center rounded-full border border-stone-200 text-stone-500 hover:bg-stone-50">
          <ChevronDown size={13} className="-rotate-90" />
        </button>
      </div>
    </div>
  );
}

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

  const displayPrice = siddh ? BASE_PRICE + SIDDH_EXTRA : BASE_PRICE;

  // ── Bottom-sheet checkout state ────────────────────────────────────────────
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [checkoutForm, setCheckoutForm] = useState({ name: "", address: "", city: "", state: "", pincode: "" });
  const [payment, setPayment] = useState<"cod" | "prepaid">("cod");
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [razorpayReady, setRazorpayReady] = useState(false);
  const [razorpayOpen, setRazorpayOpen] = useState(false);

  const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const basePrice = siddh ? BASE_PRICE + SIDDH_EXTRA : BASE_PRICE; // COD price
  const prepaidDiscount = payment === "prepaid" ? SEVEN_HORSES_PREPAID_DISCOUNT : 0; // ₹100 off
  const displayTotal = basePrice - prepaidDiscount - couponDiscount;

  function openCheckout() {
    setCheckoutOpen(true);
    setCheckoutStep(1);
    setCheckoutError("");
    setTimeout(() => setSheetVisible(true), 16);
  }

  function closeCheckout() {
    setSheetVisible(false);
    setTimeout(() => { setCheckoutOpen(false); setCheckoutStep(1); }, 380);
  }

  function advanceStep(nextStep: number) {
    setSheetVisible(false);
    setTimeout(() => {
      setCheckoutStep(nextStep);
      setCheckoutError("");
      setSheetVisible(true);
    }, 380);
  }

  // Load Razorpay script
  useEffect(() => {
    let cancelled = false;
    function markReady() {
      if (!cancelled && typeof window !== "undefined" && window.Razorpay) {
        setRazorpayReady(true);
      }
    }
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    if (existing) {
      if (window.Razorpay) markReady();
      else existing.addEventListener("load", markReady, { once: true });
    } else {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.addEventListener("load", markReady, { once: true });
      document.head.appendChild(script);
    }
    return () => { cancelled = true; };
  }, []);

  // Auto-fetch city/state from pincode
  useEffect(() => {
    const pin = checkoutForm.pincode;
    if (pin.length !== 6) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
        const data = (await res.json()) as Array<{
          Status: string;
          PostOffice?: Array<{ District: string; State: string }>;
        }>;
        if (cancelled) return;
        if (data?.[0]?.Status === "Success" && data[0].PostOffice?.[0]) {
          const po = data[0].PostOffice[0];
          setCheckoutForm((f) => ({
            ...f,
            city: f.city || po.District,
            state: f.state || po.State,
          }));
        }
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [checkoutForm.pincode]);

  async function handleApplyCoupon() {
    if (!couponCode.trim()) return;
    setCouponError("");
    setCouponLoading(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim(), amountPaise: basePrice * 100 }),
      });
      const json = (await res.json()) as {
        valid?: boolean;
        discountPaise?: number;
        error?: string;
        message?: string;
      };
      if (!res.ok || !json.valid) {
        throw new Error(json.error ?? json.message ?? "Invalid or expired coupon.");
      }
      const disc = Math.round((json.discountPaise ?? 0) / 100);
      setCouponDiscount(disc);
      setCouponApplied(true);
    } catch (err) {
      setCouponError(err instanceof Error ? err.message : "Invalid coupon.");
    } finally {
      setCouponLoading(false);
    }
  }

  async function handlePlaceOrder() {
    setCheckoutError("");
    setCheckoutLoading(true);
    const amountPaise = displayTotal * 100;

    try {
      const res = await fetch("/api/products/7horses/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountPaise,
          paymentMethod: payment,
          product: { siddh },
          couponCode: couponApplied ? couponCode : undefined,
          customer: {
            fullName: checkoutForm.name,
            phone,
            address: checkoutForm.address,
            city: checkoutForm.city,
            state: checkoutForm.state,
            pincode: checkoutForm.pincode,
          },
          attribution: {
            sourcePage: "/7horses",
            referrer: typeof document !== "undefined" ? document.referrer || undefined : undefined,
          },
        }),
      });

      const json = (await res.json()) as {
        success?: boolean;
        error?: string;
        orderDbId?: string;
        orderNumber?: string;
        razorpayOrderId?: string;
        amountPaise?: number;
        currency?: string;
        paymentBypassed?: boolean;
      };

      if (!res.ok || !json.success || !json.orderDbId || !json.orderNumber) {
        throw new Error(json.error ?? "Could not create order.");
      }

      if (payment === "cod" || json.paymentBypassed) {
        router.push(`/thank-you/7horses?order=${json.orderNumber}&payment=${payment}`);
        return;
      }

      // Prepaid — open Razorpay
      const dbId = json.orderDbId;
      const orderNumber = json.orderNumber;

      if (!razorpayKeyId || razorpayKeyId.includes("your_razorpay")) {
        throw new Error("Online payment is not configured. Please choose COD.");
      }
      if (!json.razorpayOrderId) {
        throw new Error("Payment order could not be created. Please try COD.");
      }
      if (!razorpayReady || !window.Razorpay) {
        throw new Error("Payment window is still loading. Please wait a moment.");
      }

      const options = {
        key: razorpayKeyId,
        amount: json.amountPaise ?? amountPaise,
        currency: json.currency ?? "INR",
        name: "VedGuide",
        description: `${PRODUCT_NAME}${siddh ? " (Siddh Energised)" : ""}`,
        order_id: json.razorpayOrderId,
        prefill: { name: checkoutForm.name, contact: phone },
        notes: { order_id: dbId, product: "seven_horses_pyrite_frame" },
        theme: { color: "#B45309" },
        modal: {
          ondismiss: () => {
            setRazorpayOpen(false);
            setCheckoutLoading(false);
            void fetch("/api/payments/failure", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderDbId: dbId, reason: "modal_dismissed" }),
            });
          },
        },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            setRazorpayOpen(false);
            setCheckoutLoading(true);
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderDbId: dbId,
              }),
            });
            const v = (await verifyRes.json()) as { success?: boolean; error?: string };
            if (!v.success) throw new Error(v.error ?? "Payment verification failed.");
            router.push(`/thank-you/7horses?order=${orderNumber}&payment=prepaid`);
          } catch (verifyError) {
            setCheckoutError(verifyError instanceof Error ? verifyError.message : "Payment verification failed.");
          } finally {
            setCheckoutLoading(false);
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", async () => {
        await fetch("/api/payments/failure", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderDbId: dbId, reason: "razorpay_failed" }),
        });
        setRazorpayOpen(false);
        setCheckoutLoading(false);
        setCheckoutError("Payment failed. Please try again or choose COD.");
      });
      rzp.open();
      setRazorpayOpen(true);
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : "Could not place order.");
    } finally {
      if (!razorpayOpen) setCheckoutLoading(false);
    }
  }

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

      <div className="min-h-screen bg-white pb-[5.5rem]">

        {/* ════════════════════════════════════════
            1. PRODUCT IMAGE AREA + INFO (2-col on desktop)
        ════════════════════════════════════════ */}
        <section ref={heroRef} className="bg-white pt-4 pb-0">
          <div className="mx-auto max-w-6xl md:px-8 lg:px-12">
          <div className="md:grid md:grid-cols-2 md:gap-12 md:items-start md:pt-8">
          <div className="px-4 md:px-0">
            {/* Main image */}
            <div
              className="relative aspect-square w-full overflow-hidden rounded-2xl bg-stone-50 md:rounded-3xl"
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
            <div className="mt-3 flex gap-2 overflow-x-auto hide-scrollbar px-4 md:px-0">
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
          </div>{/* end left column (px-4 wrapper) */}

          {/* RIGHT COLUMN: product info */}
          <div className="mx-auto max-w-lg px-4 mt-4 md:max-w-none md:px-0 md:mt-0 md:sticky md:top-6">
          {/* Title */}
          <h1 className="text-2xl font-black text-stone-900 leading-tight md:text-3xl lg:text-4xl">
            Limited Edition — {PRODUCT_NAME}
          </h1>

          {/* Benefit tag chips */}
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">💰 Attracts Money</span>
            <span className="bg-amber-600 text-white px-3 py-1 rounded-full text-xs font-bold">☀️ Surya Dev Blessed</span>
            <span className="bg-stone-800 text-white px-3 py-1 rounded-full text-xs font-bold">🛡️ 100% Anti-Scratchable</span>
            <span className="border border-amber-400 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">🏆 Accelerates Career</span>
            <span className="border border-stone-300 text-stone-600 px-3 py-1 rounded-full text-xs font-bold">✨ Attracts Fame &amp; Recognition</span>
          </div>

          {/* Rating row */}
          <div className="mt-2.5 flex items-center gap-1.5">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={13} className="fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-sm font-bold text-stone-700">4.94</span>
            <span className="text-sm text-stone-400">· 388 verified reviews</span>
          </div>

          {/* ── PRICE CARD ── */}
          <div className="mt-4 border-2 border-amber-200 rounded-2xl overflow-hidden">
            {/* Summer Sale banner */}
            <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2">
              <span className="text-sm">☀️</span>
              <span className="text-xs font-black text-white uppercase tracking-wider">Summer Sale — Limited Time Offer</span>
            </div>
            <div className="p-4">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-3xl font-black text-stone-900 md:text-4xl">
                  ₹{displayPrice.toLocaleString("en-IN")}
                </span>
                <span className="text-base text-stone-400 line-through">
                  ₹{MRP.toLocaleString("en-IN")}
                </span>
                <span className="bg-stone-900 text-white rounded-lg px-2.5 py-1 text-xs font-black">
                  {DISC_PCT}% OFF
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <p className="text-xs text-stone-400">Inclusive of all taxes · Free delivery included</p>
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-green-50 border border-green-100 px-3 py-2">
                <Clock size={13} className="text-green-600 shrink-0" />
                <span className="text-xs text-stone-500">Offer ends in</span>
                <span className="text-sm font-black text-green-600 tabular-nums">
                  {pad(timeLeft.h)} hr : {pad(timeLeft.m)} min : {pad(timeLeft.s)} sec
                </span>
              </div>
            </div>
          </div>

          {/* ── SPECIAL OFFER CARD ── */}
          <OfferCard onBuyNow={openCheckout} />

          {/* ── SIDDH UPGRADE ── */}
          <div className="mt-3">
            <p className="text-xs font-black text-stone-500 uppercase tracking-wider mb-2">
              ⚡ Upgrade to 10× More Powerful Siddh Version
            </p>
            <label
              className={cn(
                "flex items-start gap-3 cursor-pointer rounded-2xl border-2 p-4 transition-all",
                siddh ? "border-amber-500 bg-amber-50" : "border-stone-200 bg-white hover:border-amber-300"
              )}
            >
              <div className="relative mt-0.5 shrink-0">
                <input type="checkbox" checked={siddh} onChange={(e) => setSiddh(e.target.checked)} className="sr-only" />
                <div className={cn("w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                  siddh ? "bg-amber-600 border-amber-600" : "border-stone-300 bg-white"
                )}>
                  {siddh && <Check size={12} className="text-white stroke-[3]" />}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-stone-900">
                  Get Siddh Energised Frame{" "}
                  <span className="text-amber-600">(Pran Pratishtha)</span>
                </p>
                <p className="text-xs text-stone-500 mt-0.5 leading-snug">
                  Vedic mantras + Gangajal ritual at auspicious muhurat — energised in your name
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-black text-amber-600">+₹{SIDDH_EXTRA}</p>
                <Info size={14} className="text-stone-400 mt-1 ml-auto" />
              </div>
            </label>
          </div>

          {/* ── INLINE MINI TESTIMONIALS ── */}
          <MiniTestimonials />

          {/* ── STOCK URGENCY ── */}
          <div className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <span className="sh-pulse-dot inline-block size-2 rounded-full bg-red-500 shrink-0" />
            <p className="text-sm font-black text-amber-900">⏰ Only <span className="text-red-600">27 units</span> left at this price ⏰</p>
          </div>

          {/* ── CASHBACK BANNER ── */}
          <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-green-600 px-4 py-3">
            <p className="text-sm font-bold text-white">🎁 Pay online & save ₹{SEVEN_HORSES_PREPAID_DISCOUNT} — only ₹{PREPAID_PRICE}</p>
            <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-black text-green-700">Save ₹{SEVEN_HORSES_PREPAID_DISCOUNT}</span>
          </div>

          {/* ── CTA ── */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-stone-900">₹{displayPrice.toLocaleString("en-IN")}</span>
                <span className="text-sm text-stone-400 line-through">₹{MRP.toLocaleString("en-IN")}</span>
                <span className="text-xs font-black text-green-600">{DISC_PCT}% OFF — Summer Sale</span>
              </div>
            </div>
            <button
              type="button"
              onClick={openCheckout}
              className="sh-glow-btn w-full bg-amber-600 text-white font-black rounded-2xl py-4 text-base transition-all hover:bg-amber-700 active:scale-95 flex items-center justify-center gap-2"
            >
              Buy Now <ArrowRight size={16} />
            </button>
          </div>

          {/* ── TRUST CHIPS ── */}
          <div className="mt-4 flex flex-wrap gap-2 justify-center pb-6">
            {[
              { icon: <Truck size={11} />, text: "Free Shipping" },
              { icon: <Package size={11} />, text: "COD Available" },
              { icon: <Shield size={11} />, text: "7-Day Returns" },
              { icon: <Shield size={11} />, text: "Anti-Scratchable" },
              { icon: <Sparkles size={11} />, text: "Handcrafted" },
            ].map(({ icon, text }) => (
              <span key={text} className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-800">
                {icon}{text}
              </span>
            ))}
          </div>
          </div>{/* end right column */}
          </div>{/* end md:grid */}
          </div>{/* end max-w-6xl */}
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
        <section className="bg-amber-950 py-16 px-5 md:py-24 md:px-8">
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
        <section className="relative overflow-hidden bg-gradient-to-b from-amber-900 to-amber-950 py-24 px-5 text-white md:px-8">
          <div className="pointer-events-none absolute -top-32 right-0 size-[500px] rounded-full bg-amber-500/5 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 -left-20 size-96 rounded-full bg-orange-600/5 blur-3xl" />

          <div className="relative mx-auto max-w-3xl md:max-w-4xl">
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
                onClick={openCheckout}
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
        <section className="bg-amber-950 py-24 px-5 md:px-8">
          <div className="mx-auto max-w-3xl md:max-w-5xl">
            <div className="mb-14 text-center" data-anim>
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-400">Vedic Mythology</span>
              <h2 className="font-heading mt-3 text-4xl font-black text-white md:text-5xl">
                The Seven Divine Horses of Surya Dev
              </h2>
              <p className="mt-3 text-sm text-amber-300/70 md:text-base">
                Each horse carries a divine quality — together they pull the Sun God&apos;s chariot across the sky
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4" data-anim data-anim-d="1">
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
        <section className="bg-white py-24 px-5 md:px-8">
          <div className="mx-auto max-w-2xl md:max-w-4xl">
            <div className="mb-12 text-center" data-anim>
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-600">Placement Guide</span>
              <h2 className="font-heading mt-3 text-4xl font-black text-stone-900 md:text-5xl">
                Where to Place<br />Your Frame
              </h2>
              <p className="mt-3 text-sm text-stone-500">Correct placement maximises the Vastu benefit</p>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" data-anim data-anim-d="1">
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
                onClick={openCheckout}
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
        <section className="bg-white py-24 px-5 md:px-8">
          <div className="mx-auto max-w-2xl md:max-w-4xl">
            <div className="mb-12 text-center" data-anim>
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-600">Is It For You?</span>
              <h2 className="font-heading mt-3 text-4xl font-black text-stone-900 md:text-5xl">
                This Frame Is<br />For You If...
              </h2>
            </div>

            <div className="md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-0">
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
            </div>{/* end md:grid */}
          </div>
        </section>

        {/* ════════════════════════════════════════
            15. HOW IT WORKS
        ════════════════════════════════════════ */}
        <section className="bg-stone-50 py-24 px-5 md:px-8">
          <div className="mx-auto max-w-xl md:max-w-2xl">
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
                { stat: "100%", label: "Anti-Scratchable", sub: "Premium finish" },
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
        <section className="bg-white py-24 px-5 md:px-8">
          <div className="mx-auto max-w-2xl md:max-w-3xl">
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
            <h2 className="font-heading mb-4 text-4xl font-black md:text-6xl">
              Transform Your Space.<br />Attract Success Today.
            </h2>
            <p className="mb-10 text-sm text-amber-300 md:text-base">
              ₹{BASE_PRICE.toLocaleString("en-IN")} · Cash on Delivery · Free Shipping Pan-India
            </p>
            <div className="max-w-sm mx-auto">
              <button
                onClick={openCheckout}
                className="sh-glow-btn w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-400 py-4 text-sm font-black text-amber-950 shadow-2xl transition-all hover:bg-amber-300 active:scale-95 md:px-16 md:py-6 md:text-xl"
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
            stickyVisible
              ? "translate-y-0 opacity-100 pointer-events-auto"
              : "translate-y-full opacity-0 pointer-events-none"
          )}
        >
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
            {/* Left — product info */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative hidden sm:block size-10 shrink-0 overflow-hidden rounded-xl border border-amber-100">
                <Image src="/7horses/1.webp" alt="product" fill className="object-cover" sizes="40px" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-stone-700 hidden sm:block">{PRODUCT_NAME}</p>
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-lg font-black text-stone-900">
                    ₹{displayPrice.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs text-stone-400 line-through">₹{MRP.toLocaleString("en-IN")}</span>
                  <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-black text-white">{DISC_PCT}% OFF</span>
                </div>
                <p className="text-[10px] text-amber-600 font-semibold">
                  ☀️ Summer Sale · {siddh ? "Siddh Energised" : "Standard"} · Free Delivery
                </p>
              </div>
            </div>

            {/* Right — dual CTAs */}
            <div className="flex shrink-0 items-center gap-2">
              <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-[10px] text-stone-400">Prepaid price</span>
                <span className="text-sm font-black text-green-600">₹{(displayPrice - SEVEN_HORSES_PREPAID_DISCOUNT).toLocaleString("en-IN")} <span className="text-[10px] font-normal">online</span></span>
              </div>
              <button
                type="button"
                onClick={openCheckout}
                className="sh-glow-btn rounded-2xl bg-amber-600 px-5 py-3 text-sm font-black text-white shadow-lg transition-all hover:bg-amber-700 active:scale-95 flex items-center gap-1.5"
              >
                Buy Now <ArrowRight size={14} />
              </button>
            </div>
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

      {/* ════════════════════════════════════════
          BOTTOM SHEET CHECKOUT DRAWER
      ════════════════════════════════════════ */}
      {checkoutOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={closeCheckout}
          />

          {/* Sheet */}
          <div
            className={cn(
              // Base + mobile
              "fixed z-50 bg-white shadow-2xl overflow-y-auto",
              "bottom-0 left-0 right-0 max-h-[90vh] rounded-t-3xl",
              "transition-all duration-[380ms] ease-[cubic-bezier(0.32,0.72,0,1)]",
              // Desktop override
              "md:bottom-auto md:top-1/2 md:left-1/2 md:right-auto",
              "md:w-[480px] md:max-h-[85vh] md:rounded-3xl",
              // Animation state
              sheetVisible
                ? "translate-y-0 md:-translate-x-1/2 md:-translate-y-1/2 md:opacity-100"
                : "translate-y-full md:-translate-x-1/2 md:-translate-y-[40%] md:opacity-0"
            )}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="h-1 w-12 rounded-full bg-stone-300" />
            </div>

            {/* ── Step 1: Phone ── */}
            {checkoutStep === 1 && (
              <div className="px-5 pb-8 pt-2">
                <h2 className="text-lg font-black text-foreground">Enter your mobile number</h2>
                <p className="mt-0.5 mb-5 text-xs text-muted-foreground">We&apos;ll send order updates on WhatsApp</p>

                {/* Mini order summary */}
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-3">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-xl">
                    <Image src="/7horses/1.webp" alt="product" fill className="object-cover" sizes="56px" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">{PRODUCT_NAME}</p>
                    {siddh && (
                      <span className="inline-block rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                        + Siddh Energised
                      </span>
                    )}
                    <p className="text-base font-black text-amber-700">₹{displayPrice.toLocaleString("en-IN")}</p>
                  </div>
                </div>

                <div className="flex">
                  <span className="flex items-center rounded-l-xl border border-r-0 border-stone-200 bg-stone-50 px-3 text-sm text-muted-foreground">
                    +91
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="10-digit number"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "")); setCheckoutError(""); }}
                    className="flex-1 rounded-r-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                  />
                </div>
                {checkoutError && <p className="mt-2 text-xs font-medium text-red-600">{checkoutError}</p>}

                <button
                  type="button"
                  onClick={() => {
                    if (phone.length !== 10) { setCheckoutError("Enter a valid 10-digit number."); return; }
                    setCheckoutError("");
                    advanceStep(2);
                  }}
                  disabled={phone.length !== 10}
                  className={cn(
                    "mt-5 w-full rounded-2xl py-4 text-sm font-black text-white transition-all",
                    phone.length !== 10 ? "bg-stone-300 cursor-not-allowed" : "bg-amber-700 hover:bg-amber-800"
                  )}
                >
                  Continue →
                </button>
                <p className="mt-3 text-center text-[10px] text-muted-foreground">🔒 Your details are safe and never shared</p>
              </div>
            )}

            {/* ── Step 2: Address ── */}
            {checkoutStep === 2 && (
              <div className="px-5 pb-8 pt-2 space-y-3">
                <div>
                  <h2 className="text-lg font-black text-foreground">Delivery address</h2>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-4">Where should we deliver?</p>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-foreground">Full Name *</label>
                  <input
                    type="text"
                    placeholder="Your full name"
                    value={checkoutForm.name}
                    onChange={(e) => { setCheckoutForm((f) => ({ ...f, name: e.target.value })); setCheckoutError(""); }}
                    className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-foreground">Pincode *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="6-digit pincode"
                    maxLength={6}
                    value={checkoutForm.pincode}
                    onChange={(e) => { setCheckoutForm((f) => ({ ...f, pincode: e.target.value.replace(/\D/g, ""), city: "", state: "" })); setCheckoutError(""); }}
                    className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-foreground">Address *</label>
                  <textarea
                    placeholder="House no., Street, Area, Landmark"
                    rows={2}
                    value={checkoutForm.address}
                    onChange={(e) => { setCheckoutForm((f) => ({ ...f, address: e.target.value })); setCheckoutError(""); }}
                    className="w-full resize-none rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-foreground">City *</label>
                    <input
                      type="text"
                      placeholder="City"
                      value={checkoutForm.city}
                      onChange={(e) => { setCheckoutForm((f) => ({ ...f, city: e.target.value })); setCheckoutError(""); }}
                      className="w-full rounded-xl border border-stone-200 px-3 py-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-foreground">State *</label>
                    <input
                      type="text"
                      placeholder="State"
                      value={checkoutForm.state}
                      onChange={(e) => { setCheckoutForm((f) => ({ ...f, state: e.target.value })); setCheckoutError(""); }}
                      className="w-full rounded-xl border border-stone-200 px-3 py-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                    />
                  </div>
                </div>

                {checkoutError && <p className="text-xs font-medium text-red-600">{checkoutError}</p>}

                <button
                  type="button"
                  onClick={() => {
                    if (checkoutForm.name.trim().length < 2) { setCheckoutError("Enter your full name."); return; }
                    if (checkoutForm.pincode.length !== 6) { setCheckoutError("Enter a valid 6-digit pincode."); return; }
                    if (checkoutForm.address.trim().length < 5) { setCheckoutError("Enter your full address."); return; }
                    if (checkoutForm.city.trim().length < 2) { setCheckoutError("Enter your city."); return; }
                    if (checkoutForm.state.trim().length < 2) { setCheckoutError("Enter your state."); return; }
                    setCheckoutError("");
                    advanceStep(3);
                  }}
                  className="w-full rounded-2xl bg-amber-700 py-4 text-sm font-black text-white transition-all hover:bg-amber-800"
                >
                  Continue to Payment →
                </button>
              </div>
            )}

            {/* ── Step 3: Payment ── */}
            {checkoutStep === 3 && (
              <div className="px-5 pb-8 pt-2 space-y-4">
                <div>
                  <h2 className="text-lg font-black text-foreground">Choose payment method</h2>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-4">Select how you&apos;d like to pay</p>
                </div>

                {/* Coupon code */}
                <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag size={14} className="text-amber-600 shrink-0" />
                    <span className="text-sm font-bold text-foreground">Coupon Code</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        if (couponApplied) { setCouponApplied(false); setCouponDiscount(0); }
                        setCouponError("");
                      }}
                      disabled={couponApplied}
                      className={cn(
                        "flex-1 rounded-xl border px-3 py-2.5 text-sm font-semibold uppercase tracking-wider placeholder:font-normal placeholder:normal-case placeholder:tracking-normal outline-none transition-all",
                        couponApplied
                          ? "border-green-300 bg-green-50 text-green-700"
                          : "border-stone-200 bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                      )}
                    />
                    <button
                      type="button"
                      onClick={couponApplied ? () => { setCouponCode(""); setCouponApplied(false); setCouponDiscount(0); setCouponError(""); } : () => void handleApplyCoupon()}
                      disabled={couponLoading || (!couponApplied && couponCode.trim().length === 0)}
                      className={cn(
                        "shrink-0 rounded-xl px-4 py-2.5 text-sm font-black transition-all",
                        couponApplied
                          ? "bg-stone-100 text-stone-500 hover:bg-stone-200"
                          : couponLoading || couponCode.trim().length === 0
                          ? "bg-stone-200 text-stone-400 cursor-not-allowed"
                          : "bg-amber-700 text-white hover:bg-amber-800"
                      )}
                    >
                      {couponLoading ? <Loader2 size={14} className="animate-spin" /> : couponApplied ? "Remove" : "Apply"}
                    </button>
                  </div>
                  {couponError && <p className="mt-1.5 text-xs font-medium text-red-600">{couponError}</p>}
                  {couponApplied && couponDiscount > 0 && (
                    <p className="mt-1.5 flex items-center gap-1 text-xs font-bold text-green-600">
                      <Check size={12} strokeWidth={3} /> ₹{couponDiscount} discount applied!
                    </p>
                  )}
                </div>

                {/* Payment method cards */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPayment("cod")}
                    className={cn(
                      "rounded-2xl border-2 p-4 text-left transition-all",
                      payment === "cod" ? "border-amber-500 bg-amber-50" : "border-stone-200 bg-white hover:border-stone-300"
                    )}
                  >
                    <span className="text-2xl">🚚</span>
                    <p className="mt-2 text-xs font-bold text-foreground">Cash on Delivery</p>
                    <p className="mt-0.5 text-base font-black text-amber-700">
                      ₹{(basePrice - couponDiscount).toLocaleString("en-IN")}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Pay on arrival</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPayment("prepaid")}
                    className={cn(
                      "relative rounded-2xl border-2 p-4 text-left transition-all",
                      payment === "prepaid" ? "border-amber-500 bg-amber-50" : "border-stone-200 bg-white hover:border-stone-300"
                    )}
                  >
                    <span className="absolute right-2 top-2 rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] font-black text-green-700">
                      Save ₹{SEVEN_HORSES_PREPAID_DISCOUNT}
                    </span>
                    <CreditCard size={22} className="text-amber-700" />
                    <p className="mt-2 text-xs font-bold text-foreground">Pay Online</p>
                    <p className="mt-0.5 text-base font-black text-amber-700">
                      ₹{(basePrice - SEVEN_HORSES_PREPAID_DISCOUNT - couponDiscount).toLocaleString("en-IN")}
                    </p>
                    <p className="text-[10px] text-muted-foreground">UPI · Cards · Net Banking</p>
                  </button>
                </div>

                {/* Total row */}
                <div className="flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                  <span className="text-sm text-muted-foreground">Total payable</span>
                  <span className="text-xl font-black text-amber-700">₹{displayTotal.toLocaleString("en-IN")}</span>
                </div>

                {checkoutError && <p className="text-xs font-medium text-red-600">{checkoutError}</p>}

                <button
                  type="button"
                  onClick={() => void handlePlaceOrder()}
                  disabled={checkoutLoading || razorpayOpen}
                  className={cn(
                    "w-full rounded-2xl py-4 text-base font-black text-white shadow-lg transition-all active:scale-[0.98]",
                    checkoutLoading || razorpayOpen ? "cursor-not-allowed bg-stone-300" : "bg-amber-700 hover:bg-amber-800"
                  )}
                >
                  {checkoutLoading || razorpayOpen ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <Loader2 size={18} className="animate-spin" />
                      {razorpayOpen ? "Complete payment in popup..." : "Placing order..."}
                    </span>
                  ) : (
                    <>
                      Place Order →
                      <span className="mt-0.5 block text-xs font-normal opacity-80">
                        {payment === "cod" ? "Pay on delivery · No advance needed" : `You save ₹${SEVEN_HORSES_PREPAID_DISCOUNT} — only ₹${sevenHorsesPrepaidPrice(siddh)}`}
                      </span>
                    </>
                  )}
                </button>

                <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Shield size={10} /> 100% Secure</span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><Truck size={10} /> Free Delivery</span>
                  <span>·</span>
                  <span>7-Day Returns</span>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
