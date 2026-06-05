"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ChevronLeft,
  Shield,
  Check,
  Truck,
  Loader2,
  CreditCard,
  ShoppingCart,
  Tag,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type PaymentMethod = "cod" | "prepaid";

const MRP = 2900;

const STEPS = [
  { n: 1, label: "Phone" },
  { n: 2, label: "Address" },
  { n: 3, label: "Payment" },
] as const;

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center px-6 py-4">
      {STEPS.map(({ n, label }, idx) => (
        <div key={n} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div
              className={cn(
                "flex size-9 items-center justify-center rounded-full text-sm font-black transition-all shadow-sm",
                n < step
                  ? "bg-green-500 text-white shadow-green-200"
                  : n === step
                    ? "bg-amber-700 text-white shadow-amber-200 ring-4 ring-amber-100"
                    : "bg-stone-100 text-stone-400"
              )}
            >
              {n < step ? <Check size={15} strokeWidth={3} /> : n}
            </div>
            <span className={cn(
              "text-[10px] font-bold",
              n === step ? "text-amber-700" : n < step ? "text-green-600" : "text-stone-400"
            )}>
              {label}
            </span>
          </div>
          {idx < STEPS.length - 1 && (
            <div className={cn(
              "mb-5 h-[2px] w-14 mx-1 rounded-full transition-all",
              n < step ? "bg-green-400" : "bg-stone-200"
            )} />
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Order summary card
// ---------------------------------------------------------------------------
function OrderSummaryCard({
  siddh,
  basePrice,
  payment,
  couponDiscount,
}: {
  siddh: boolean;
  basePrice: number;
  payment: PaymentMethod;
  couponDiscount: number;
}) {
  const [open, setOpen] = useState(true);
  const prepaidDiscount = payment === "prepaid" ? 299 : 0;
  const displayTotal = basePrice - prepaidDiscount - couponDiscount;
  const saved = MRP - displayTotal;

  return (
    <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-4 py-3"
      >
        <ShoppingCart size={16} className="text-amber-700 shrink-0" />
        <span className="flex-1 text-left text-sm font-bold text-foreground">Order Summary</span>
        <span className="text-xs text-stone-500">1 item</span>
        <span className="ml-1 text-xs text-stone-400">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="border-t border-stone-100 px-4 pb-4 pt-3">
          <div className="flex items-start gap-3">
            {/* Product image */}
            <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-amber-100 bg-amber-50">
              <Image
                src="/7horses/1.webp"
                alt="7 Horses on Raw Pyrite Frame"
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground leading-snug">
                7 Horses on Raw Pyrite Frame
              </p>
              {siddh && (
                <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                  + Siddh Energised
                </span>
              )}
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-black text-green-700">
                  ₹{saved.toLocaleString("en-IN")} saved
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-base font-black text-amber-700">
                ₹{displayTotal.toLocaleString("en-IN")}
              </p>
              <p className="text-[11px] text-stone-400 line-through">
                ₹{MRP.toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          {/* Price breakdown */}
          <div className="mt-3 space-y-1.5 border-t border-stone-100 pt-3 text-xs text-stone-500">
            <div className="flex justify-between">
              <span>Product price</span>
              <span className="line-through">₹{MRP.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-green-600 font-semibold">
              <span>Discount</span>
              <span>−₹{(MRP - basePrice).toLocaleString("en-IN")}</span>
            </div>
            {couponDiscount > 0 && (
              <div className="flex justify-between text-green-600 font-semibold">
                <span>Coupon</span>
                <span>−₹{couponDiscount.toLocaleString("en-IN")}</span>
              </div>
            )}
            {payment === "prepaid" && (
              <div className="flex justify-between text-green-600 font-semibold">
                <span>Prepaid discount</span>
                <span>−₹299</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-foreground border-t border-stone-100 pt-1.5 text-sm">
              <span>Total</span>
              <span className="text-amber-700">₹{displayTotal.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-1">
                <Truck size={10} /> Delivery
              </span>
              <span className="font-semibold text-green-600">FREE</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Coupon card
// ---------------------------------------------------------------------------
function CouponCard({
  couponCode,
  setCouponCode,
  onApply,
  applied,
  discount,
  loading,
  error,
}: {
  couponCode: string;
  setCouponCode: (v: string) => void;
  onApply: () => void;
  applied: boolean;
  discount: number;
  loading: boolean;
  error: string;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3">
      <div className="flex items-center gap-2 mb-2">
        <Tag size={14} className="text-amber-600 shrink-0" />
        <span className="text-sm font-bold text-foreground">Coupon Code</span>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Enter coupon code"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
          disabled={applied}
          className={cn(
            "flex-1 rounded-xl border px-3 py-2.5 text-sm font-semibold uppercase tracking-wider placeholder:font-normal placeholder:normal-case placeholder:tracking-normal outline-none transition-all",
            applied
              ? "border-green-300 bg-green-50 text-green-700"
              : "border-stone-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
          )}
        />
        <button
          type="button"
          onClick={applied ? () => { setCouponCode(""); } : onApply}
          disabled={loading || (!applied && couponCode.trim().length === 0)}
          className={cn(
            "shrink-0 rounded-xl px-4 py-2.5 text-sm font-black transition-all",
            applied
              ? "bg-stone-100 text-stone-500 hover:bg-stone-200"
              : loading || couponCode.trim().length === 0
              ? "bg-stone-200 text-stone-400 cursor-not-allowed"
              : "bg-amber-700 text-white hover:bg-amber-800"
          )}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : applied ? "Remove" : "Apply"}
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}
      {applied && discount > 0 && (
        <p className="mt-1.5 flex items-center gap-1 text-xs font-bold text-green-600">
          <Check size={12} strokeWidth={3} /> ₹{discount} discount applied!
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function SevenHorsesCheckoutPage() {
  const params = useSearchParams();
  const router = useRouter();

  const siddh = params.get("siddh") === "1";
  const basePrice = siddh ? 1998 : 1699;

  // step: 1=phone, 2=address, 3=payment
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [payment, setPayment] = useState<PaymentMethod>("cod");

  // Coupon
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [razorpayReady, setRazorpayReady] = useState(false);
  const [razorpayOpen, setRazorpayOpen] = useState(false);

  const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const prepaidDiscount = payment === "prepaid" ? 299 : 0;
  const displayTotal = basePrice - prepaidDiscount - couponDiscount;

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
    const pin = form.pincode;
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
          setForm((f) => ({
            ...f,
            city: f.city || po.District,
            state: f.state || po.State,
          }));
        }
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [form.pincode]);

  // ---- Apply coupon ----
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

  function handleRemoveCoupon() {
    setCouponCode("");
    setCouponApplied(false);
    setCouponDiscount(0);
    setCouponError("");
  }

  // ---- Step 1 → 2: validate phone ----
  function handlePhoneContinue() {
    if (phone.length !== 10) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }
    setError("");
    setStep(2);
  }

  // ---- Step 2 → 3: validate address ----
  function handleAddressContinue() {
    if (form.name.trim().length < 2) {
      setError("Enter your full name.");
      return;
    }
    if (form.pincode.length !== 6) {
      setError("Enter a valid 6-digit pincode.");
      return;
    }
    if (form.address.trim().length < 5) {
      setError("Enter your full address.");
      return;
    }
    if (form.city.trim().length < 2) {
      setError("Enter your city.");
      return;
    }
    if (form.state.trim().length < 2) {
      setError("Enter your state.");
      return;
    }
    setError("");
    setStep(3);
  }

  // ---- Step 2: Place order ----
  async function handlePlaceOrder() {
    setError("");
    setLoading(true);
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
            fullName: form.name,
            phone,
            address: form.address,
            city: form.city,
            state: form.state,
            pincode: form.pincode,
          },
          attribution: {
            sourcePage: "/checkout/7horses",
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
        router.push(`/thank-you/7horses?order=${json.orderNumber}`);
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
        description: `7 Horses on Raw Pyrite Frame${siddh ? " (Siddh Energised)" : ""}`,
        order_id: json.razorpayOrderId,
        prefill: { name: form.name, contact: phone },
        notes: { order_id: dbId, product: "seven_horses_pyrite_frame" },
        theme: { color: "#B45309" },
        modal: {
          ondismiss: () => {
            setRazorpayOpen(false);
            setLoading(false);
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
            setLoading(true);
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
            router.push(`/thank-you/7horses?order=${orderNumber}`);
          } catch (verifyError) {
            setError(verifyError instanceof Error ? verifyError.message : "Payment verification failed.");
          } finally {
            setLoading(false);
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
        setLoading(false);
        setError("Payment failed. Please try again or choose COD.");
      });
      rzp.open();
      setRazorpayOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place order.");
    } finally {
      if (!razorpayOpen) setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-16">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-stone-100 bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-lg items-center">
          <button
            type="button"
            onClick={() => (step > 1 ? setStep(1) : router.back())}
            className="flex size-8 items-center justify-center rounded-full hover:bg-stone-100"
          >
            <ChevronLeft size={20} className="text-foreground" />
          </button>
          <span className="flex-1 text-center text-sm font-bold text-foreground">
            {step === 1 ? "Mobile Number" : step === 2 ? "Delivery Address" : "Payment"}
          </span>
          <span className="flex items-center gap-1 text-xs font-medium text-green-600">
            <Shield size={12} />
            100% Secure
          </span>
        </div>
      </div>

      {/* Prepaid banner */}
      <div className="bg-green-600 px-4 py-2 text-center text-xs font-bold text-white">
        🎁 ₹299 off on prepaid · Free shipping pan-India
      </div>

      <div className="mx-auto max-w-lg space-y-3 px-4 pt-4">

        {/* Order summary — always visible */}
        <OrderSummaryCard
          siddh={siddh}
          basePrice={basePrice}
          payment={payment}
          couponDiscount={couponDiscount}
        />

        {/* Coupon */}
        <CouponCard
          couponCode={couponCode}
          setCouponCode={(v) => {
            setCouponCode(v);
            if (couponApplied) { setCouponApplied(false); setCouponDiscount(0); }
            setCouponError("");
          }}
          onApply={() => void handleApplyCoupon()}
          applied={couponApplied}
          discount={couponDiscount}
          loading={couponLoading}
          error={couponError}
        />

        {/* Step indicator */}
        <div className="rounded-2xl border border-stone-200 bg-white">
          <StepIndicator step={step} />
        </div>

        {/* ── STEP 1: Phone ── */}
        {step === 1 && (
          <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
            <div className="border-b border-stone-100 px-5 py-4">
              <h2 className="text-base font-bold text-foreground">Enter your mobile number</h2>
              <p className="text-xs text-muted-foreground mt-0.5">We'll send order updates on WhatsApp</p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">Mobile Number *</label>
                <div className="flex">
                  <span className="flex items-center rounded-l-xl border border-r-0 border-stone-200 bg-stone-50 px-3 text-sm font-medium text-muted-foreground select-none">
                    +91
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "")); setError(""); }}
                    onKeyDown={(e) => { if (e.key === "Enter") handlePhoneContinue(); }}
                    className="flex-1 rounded-r-xl border border-stone-200 px-4 py-3 text-sm placeholder:text-stone-400 outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                  />
                </div>
              </div>
              {error && <p className="text-xs font-medium text-red-600">{error}</p>}
              <button
                type="button"
                onClick={handlePhoneContinue}
                disabled={phone.length !== 10}
                className={cn(
                  "w-full rounded-2xl py-4 text-sm font-black text-white transition-all active:scale-[0.98]",
                  phone.length !== 10 ? "cursor-not-allowed bg-stone-300" : "bg-amber-700 hover:bg-amber-800"
                )}
              >
                Continue →
              </button>
              <p className="text-center text-[10px] text-muted-foreground">🔒 Your details are safe and never shared</p>
            </div>
          </div>
        )}

        {/* ── STEP 2: Address ── */}
        {step === 2 && (
          <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
            <div className="border-b border-stone-100 px-5 py-4">
              <h2 className="text-base font-bold text-foreground">Delivery details</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Where should we deliver your order?</p>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">Full Name *</label>
                <input
                  type="text"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setError(""); }}
                  className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm placeholder:text-stone-400 outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">Pincode *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="6-digit pincode"
                  maxLength={6}
                  value={form.pincode}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, pincode: e.target.value.replace(/\D/g, ""), city: "", state: "" }));
                    setError("");
                  }}
                  className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm placeholder:text-stone-400 outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">Address *</label>
                <textarea
                  placeholder="House no., Street, Area, Landmark"
                  rows={2}
                  value={form.address}
                  onChange={(e) => { setForm((f) => ({ ...f, address: e.target.value })); setError(""); }}
                  className="w-full resize-none rounded-xl border border-stone-200 px-4 py-3 text-sm placeholder:text-stone-400 outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground">City *</label>
                  <input
                    type="text"
                    placeholder="City"
                    value={form.city}
                    onChange={(e) => { setForm((f) => ({ ...f, city: e.target.value })); setError(""); }}
                    className="w-full rounded-xl border border-stone-200 px-3 py-3 text-sm placeholder:text-stone-400 outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground">State *</label>
                  <input
                    type="text"
                    placeholder="State"
                    value={form.state}
                    onChange={(e) => { setForm((f) => ({ ...f, state: e.target.value })); setError(""); }}
                    className="w-full rounded-xl border border-stone-200 px-3 py-3 text-sm placeholder:text-stone-400 outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                  />
                </div>
              </div>
              {error && <p className="text-xs font-medium text-red-600">{error}</p>}
              <button
                type="button"
                onClick={handleAddressContinue}
                className="w-full rounded-2xl bg-amber-700 py-4 text-sm font-black text-white transition-all hover:bg-amber-800 active:scale-[0.98]"
              >
                Continue to Payment →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Payment ── */}
        {step === 3 && (
          <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
            <div className="border-b border-stone-100 px-5 py-4">
              <h2 className="text-base font-bold text-foreground">Choose payment method</h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 gap-3">
                {/* COD */}
                <button
                  type="button"
                  onClick={() => setPayment("cod")}
                  className={cn(
                    "rounded-2xl border-2 p-4 text-left transition-all",
                    payment === "cod"
                      ? "border-amber-500 bg-amber-50"
                      : "border-stone-200 bg-white hover:border-stone-300"
                  )}
                >
                  <span className="text-2xl">🚚</span>
                  <p className="mt-2 text-xs font-bold text-foreground">Cash on Delivery</p>
                  <p className="mt-0.5 text-base font-black text-amber-700">
                    ₹{(basePrice - couponDiscount).toLocaleString("en-IN")}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Pay on arrival</p>
                </button>

                {/* Prepaid */}
                <button
                  type="button"
                  onClick={() => setPayment("prepaid")}
                  className={cn(
                    "relative rounded-2xl border-2 p-4 text-left transition-all",
                    payment === "prepaid"
                      ? "border-amber-500 bg-amber-50"
                      : "border-stone-200 bg-white hover:border-stone-300"
                  )}
                >
                  <span className="absolute right-2 top-2 rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] font-black text-green-700">
                    Save ₹299
                  </span>
                  <CreditCard size={22} className="text-amber-700" />
                  <p className="mt-2 text-xs font-bold text-foreground">Pay Online</p>
                  <p className="mt-0.5 text-base font-black text-amber-700">
                    ₹{(basePrice - 299 - couponDiscount).toLocaleString("en-IN")}
                  </p>
                  <p className="text-[10px] text-muted-foreground">UPI · Cards · Net Banking</p>
                </button>
              </div>

              {/* Total */}
              <div className="mt-4 flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                <span className="text-sm text-muted-foreground">Total payable</span>
                <span className="text-xl font-black text-amber-700">₹{displayTotal.toLocaleString("en-IN")}</span>
              </div>

              {error && <p className="mt-3 text-xs font-medium text-red-600">{error}</p>}

              <button
                type="button"
                onClick={() => void handlePlaceOrder()}
                disabled={loading || razorpayOpen}
                className={cn(
                  "mt-3 w-full rounded-2xl py-4 text-base font-black text-white shadow-lg transition-all active:scale-[0.98]",
                  loading || razorpayOpen ? "cursor-not-allowed bg-stone-300" : "bg-amber-700 hover:bg-amber-800"
                )}
              >
                {loading || razorpayOpen ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <Loader2 size={18} className="animate-spin" />
                    {razorpayOpen ? "Complete payment in popup..." : "Placing order..."}
                  </span>
                ) : (
                  <>
                    Place Order →
                    <span className="mt-0.5 block text-xs font-normal opacity-80">
                      {payment === "cod" ? "Pay on delivery · No advance needed" : "You save ₹299 on prepaid"}
                    </span>
                  </>
                )}
              </button>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><Shield size={10} /> 100% Secure</span>
                <span>·</span>
                <span className="flex items-center gap-1"><Truck size={10} /> Free Delivery</span>
                <span>·</span>
                <span>7-Day Returns</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
