"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  Shield,
  Check,
  Truck,
  Loader2,
  CreditCard,
  ShoppingCart,
} from "lucide-react";
import { cn } from "@/lib/utils";

type PaymentMethod = "cod" | "prepaid";

const MRP = 2900;

const STEPS = [
  { n: 1, label: "Phone" },
  { n: 2, label: "OTP" },
  { n: 3, label: "Address" },
  { n: 4, label: "Payment" },
] as const;

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------
function StepIndicator({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center gap-0 px-4 py-4">
      {STEPS.map(({ n, label }, idx) => (
        <div key={n} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "flex size-8 items-center justify-center rounded-full text-sm font-bold transition-all",
                n < step
                  ? "bg-green-500 text-white"
                  : n === step
                    ? "bg-amber-700 text-white"
                    : "bg-stone-200 text-stone-400"
              )}
            >
              {n < step ? <Check size={14} strokeWidth={3} /> : n}
            </div>
            <span
              className={cn(
                "mt-1 text-[10px] font-semibold",
                n === step ? "text-amber-700" : n < step ? "text-green-600" : "text-stone-400"
              )}
            >
              {label}
            </span>
          </div>
          {idx < STEPS.length - 1 && (
            <div
              className={cn(
                "mb-4 h-[2px] w-8 transition-colors",
                n < step ? "bg-green-400" : "bg-stone-200"
              )}
            />
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
}: {
  siddh: boolean;
  basePrice: number;
  payment: PaymentMethod;
}) {
  const [open, setOpen] = useState(true);
  const prepaidPrice = basePrice - 299;
  const displayTotal = payment === "prepaid" ? prepaidPrice : basePrice;
  const saved = MRP - basePrice;

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
            <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-2xl">
              🐴
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">7 Horses on Raw Pyrite Frame</p>
              {siddh && (
                <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                  + Siddh Energised
                </span>
              )}
              <div className="mt-1 flex items-center gap-2">
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
          <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-2 text-xs text-stone-500">
            <span className="flex items-center gap-1">
              <Truck size={11} /> Free delivery · 7–10 days
            </span>
            <span className="flex items-center gap-1">
              <Shield size={11} /> 100% Secure
            </span>
          </div>
        </div>
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
  const prepaidPrice = basePrice - 299;

  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);
  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [payment, setPayment] = useState<PaymentMethod>("cod");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [placed, setPlaced] = useState<{ orderNumber: string; paymentMethod: PaymentMethod } | null>(null);
  const [razorpayReady, setRazorpayReady] = useState(false);
  const [razorpayOpen, setRazorpayOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const displayTotal = payment === "prepaid" ? prepaidPrice : basePrice;

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
    return () => {
      cancelled = true;
    };
  }, []);

  // OTP countdown timer
  useEffect(() => {
    if (otpTimer <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setOtpTimer((t) => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [otpTimer]);

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
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [form.pincode]);

  // ---- Step 1: Send OTP ----
  async function handleSendOtp() {
    if (phone.length !== 10) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/phone-otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: "91" + phone }),
      });
      const json = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "Could not send OTP. Please try again.");
      }
      setOtpTimer(30);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send OTP.");
    } finally {
      setLoading(false);
    }
  }

  // ---- Step 2: Verify OTP ----
  async function handleVerifyOtp() {
    if (otp.length !== 6) {
      setError("Enter the 6-digit OTP.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/phone-otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: "91" + phone, code: otp }),
      });
      const json = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "Invalid OTP. Please try again.");
      }
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  }

  // ---- Step 2: Resend OTP ----
  async function handleResendOtp() {
    setError("");
    setOtp("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/phone-otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: "91" + phone }),
      });
      const json = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "Could not resend OTP.");
      }
      setOtpTimer(30);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend OTP.");
    } finally {
      setLoading(false);
    }
  }

  // ---- Step 3: Validate address ----
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
    setStep(4);
  }

  // ---- Step 4: Place order ----
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
            referrer: document.referrer || undefined,
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
        setPlaced({ orderNumber: json.orderNumber, paymentMethod: payment });
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
        throw new Error("Payment window is still loading. Please wait a moment and try again.");
      }

      const options = {
        key: razorpayKeyId,
        amount: json.amountPaise ?? amountPaise,
        currency: json.currency ?? "INR",
        name: "VedGuide",
        description: `7 Horses on Raw Pyrite Frame${siddh ? " (Siddh Energised)" : ""}`,
        order_id: json.razorpayOrderId,
        prefill: {
          name: form.name,
          contact: phone,
        },
        notes: {
          order_id: dbId,
          product: "seven_horses_pyrite_frame",
        },
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
            const verifyJson = (await verifyRes.json()) as { success?: boolean; error?: string };
            if (!verifyJson.success) {
              throw new Error(verifyJson.error ?? "Payment verification failed.");
            }
            setPlaced({ orderNumber, paymentMethod: payment });
            router.push(`/thank-you/7horses?order=${orderNumber}`);
          } catch (verifyError) {
            setError(
              verifyError instanceof Error
                ? verifyError.message
                : "Payment verification failed."
            );
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

  // ---- Success screen ----
  if (placed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-amber-50 px-5 text-center">
        <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-green-100">
          <Check size={36} className="text-green-600 stroke-[2.5]" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-foreground">Order Placed! 🎉</h1>
        <p className="mb-1 text-sm text-muted-foreground">
          Your 7 Horses Pyrite Frame order is confirmed.
        </p>
        <p className="mb-1 font-mono text-xs font-semibold text-amber-800">{placed.orderNumber}</p>
        <p className="mb-6 text-xs text-muted-foreground">
          {placed.paymentMethod === "cod" ? "COD order saved." : "Payment received."} We&apos;ll
          WhatsApp you tracking details on <strong>+91 {phone}</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-12">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-stone-100 bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-lg items-center">
          <button
            type="button"
            onClick={() => (step > 1 ? setStep((s) => s - 1) : router.back())}
            className="flex size-8 items-center justify-center rounded-full hover:bg-stone-100"
          >
            <ChevronLeft size={20} className="text-foreground" />
          </button>
          <span className="flex-1 text-center text-sm font-bold text-foreground">Checkout</span>
          <span className="flex items-center gap-1 text-xs font-medium text-green-600">
            <Shield size={12} />
            100% Secure Payment
          </span>
        </div>
      </div>

      {/* Prepaid banner */}
      <div className="bg-green-600 px-4 py-2 text-center text-xs font-bold text-white">
        🎁 ₹299 off on prepaid orders
      </div>

      <div className="mx-auto max-w-lg space-y-4 px-4 pt-4">
        {/* Order summary */}
        <OrderSummaryCard siddh={siddh} basePrice={basePrice} payment={payment} />

        {/* Step indicator */}
        <div className="rounded-2xl border border-stone-200 bg-white">
          <StepIndicator step={step} />
        </div>

        {/* Step content */}
        <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
          {/* ---- STEP 1: Phone ---- */}
          {step === 1 && (
            <div className="p-5">
              <h2 className="mb-1 text-base font-bold text-foreground">Enter your mobile number</h2>
              <p className="mb-4 text-xs text-muted-foreground">
                We&apos;ll send an OTP to verify your number
              </p>
              <div className="flex">
                <span className="flex items-center rounded-l-xl border border-r-0 border-stone-200 bg-stone-50 px-3 text-sm text-muted-foreground">
                  +91
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/\D/g, ""));
                    setError("");
                  }}
                  onKeyDown={(e) => { if (e.key === "Enter") void handleSendOtp(); }}
                  className="flex-1 rounded-r-xl border border-stone-200 px-4 py-3 text-sm placeholder:text-stone-400 outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                />
              </div>
              {error && (
                <p className="mt-2 text-xs font-medium text-red-600">{error}</p>
              )}
              <button
                type="button"
                onClick={() => void handleSendOtp()}
                disabled={loading || phone.length !== 10}
                className={cn(
                  "mt-4 w-full rounded-2xl py-4 text-sm font-bold text-white transition-all active:scale-[0.98]",
                  loading || phone.length !== 10
                    ? "cursor-not-allowed bg-stone-300"
                    : "bg-amber-700 hover:bg-amber-800"
                )}
              >
                {loading ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Sending OTP...
                  </span>
                ) : (
                  "Send OTP →"
                )}
              </button>
            </div>
          )}

          {/* ---- STEP 2: OTP ---- */}
          {step === 2 && (
            <div className="p-5">
              <h2 className="mb-1 text-base font-bold text-foreground">Verify your number</h2>
              <p className="mb-4 text-xs text-muted-foreground">
                OTP sent to +91 ···· {phone.slice(-4)}
              </p>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, ""));
                  setError("");
                }}
                onKeyDown={(e) => { if (e.key === "Enter") void handleVerifyOtp(); }}
                className="w-full rounded-xl border border-stone-200 px-4 py-3 text-center text-lg font-bold tracking-widest placeholder:text-stone-300 placeholder:text-sm placeholder:tracking-normal outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              />
              {error && (
                <p className="mt-2 text-xs font-medium text-red-600">{error}</p>
              )}
              <button
                type="button"
                onClick={() => void handleVerifyOtp()}
                disabled={loading || otp.length !== 6}
                className={cn(
                  "mt-4 w-full rounded-2xl py-4 text-sm font-bold text-white transition-all active:scale-[0.98]",
                  loading || otp.length !== 6
                    ? "cursor-not-allowed bg-stone-300"
                    : "bg-amber-700 hover:bg-amber-800"
                )}
              >
                {loading ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Verifying...
                  </span>
                ) : (
                  "Verify OTP →"
                )}
              </button>
              <div className="mt-3 text-center">
                {otpTimer > 0 ? (
                  <span className="text-xs text-muted-foreground">
                    Resend OTP in {otpTimer}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleResendOtp()}
                    disabled={loading}
                    className="text-xs font-semibold text-amber-700 underline underline-offset-2"
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ---- STEP 3: Address ---- */}
          {step === 3 && (
            <div className="p-5">
              <h2 className="mb-4 text-base font-bold text-foreground">Delivery details</h2>
              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Your full name"
                    value={form.name}
                    onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setError(""); }}
                    className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm placeholder:text-stone-400 outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground">
                    Pincode *
                  </label>
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
                  <label className="mb-1.5 block text-xs font-semibold text-foreground">
                    Address Line *
                  </label>
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
                    <label className="mb-1.5 block text-xs font-semibold text-foreground">
                      City *
                    </label>
                    <input
                      type="text"
                      placeholder="City"
                      value={form.city}
                      onChange={(e) => { setForm((f) => ({ ...f, city: e.target.value })); setError(""); }}
                      className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm placeholder:text-stone-400 outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-foreground">
                      State *
                    </label>
                    <input
                      type="text"
                      placeholder="State"
                      value={form.state}
                      onChange={(e) => { setForm((f) => ({ ...f, state: e.target.value })); setError(""); }}
                      className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm placeholder:text-stone-400 outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                    />
                  </div>
                </div>
              </div>
              {error && (
                <p className="mt-3 text-xs font-medium text-red-600">{error}</p>
              )}
              <button
                type="button"
                onClick={handleAddressContinue}
                className="mt-5 w-full rounded-2xl bg-amber-700 py-4 text-sm font-bold text-white transition-all hover:bg-amber-800 active:scale-[0.98]"
              >
                Continue →
              </button>
            </div>
          )}

          {/* ---- STEP 4: Payment ---- */}
          {step === 4 && (
            <div className="p-5">
              <h2 className="mb-4 text-base font-bold text-foreground">Choose payment method</h2>
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
                  <p className="mt-2 text-sm font-bold text-foreground">Cash on Delivery</p>
                  <p className="mt-0.5 text-base font-black text-amber-700">
                    ₹{basePrice.toLocaleString("en-IN")}
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
                  <span className="absolute right-3 top-3 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-black text-green-700">
                    Save ₹299
                  </span>
                  <CreditCard size={22} className="text-amber-700" />
                  <p className="mt-2 text-sm font-bold text-foreground">Pay Online</p>
                  <p className="mt-0.5 text-base font-black text-amber-700">
                    ₹{prepaidPrice.toLocaleString("en-IN")}
                  </p>
                  <p className="text-[10px] text-muted-foreground">UPI · Cards · Net Banking</p>
                </button>
              </div>

              {error && (
                <p className="mt-3 text-xs font-medium text-red-600">{error}</p>
              )}

              <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total payable</span>
                <span className="text-xl font-black text-amber-700">
                  ₹{displayTotal.toLocaleString("en-IN")}
                </span>
              </div>

              <button
                type="button"
                onClick={() => void handlePlaceOrder()}
                disabled={loading || razorpayOpen}
                className={cn(
                  "mt-3 w-full rounded-2xl py-4 text-base font-black text-white shadow-lg transition-all active:scale-[0.98]",
                  loading || razorpayOpen
                    ? "cursor-not-allowed bg-stone-300"
                    : "bg-amber-700 hover:bg-amber-800"
                )}
              >
                {loading || razorpayOpen ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <Loader2 size={18} className="animate-spin" />
                    {razorpayOpen ? "Complete payment..." : "Placing order..."}
                  </span>
                ) : (
                  <>
                    Place Order →
                    <span className="mt-0.5 block text-xs font-normal opacity-80">
                      {payment === "cod"
                        ? "Pay on delivery · No advance needed"
                        : "You save ₹299 on prepaid"}
                    </span>
                  </>
                )}
              </button>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Shield size={10} /> 100% Secure
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Truck size={10} /> Free Delivery
                </span>
                <span>·</span>
                <span>Replacement Guarantee</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
