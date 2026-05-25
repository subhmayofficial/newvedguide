"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeft, Shield, Truck, Check, Package, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  KADA_DESIGN_LABELS,
  KADA_SIZE_LABELS,
  KADA_VARIANTS,
  FALLBACK_KADA_PRICING,
  kadaTotalPaise,
  kadaVariantMrpPaise,
  kadaVariantPricePaise,
  parseKadaVariant,
  type KadaDesign,
  type KadaPricing,
  type KadaPaymentMethod,
  type KadaSizeCode,
  type KadaVariant,
} from "@/lib/products/kada";

type PlacedOrder = {
  orderDbId: string;
  orderNumber: string;
  paymentMethod: KadaPaymentMethod;
};

const DESIGN_OPTIONS: KadaDesign[] = ["classic", "traditional", "ornate"];
const SIZE_OPTIONS: KadaSizeCode[] = ["S", "M", "L", "XL"];

function parseOptionalKadaDesign(raw: string | null): KadaDesign | null {
  return raw === "classic" || raw === "traditional" || raw === "ornate" ? raw : null;
}

function parseOptionalKadaSize(raw: string | null): KadaSizeCode | null {
  return raw === "S" || raw === "M" || raw === "L" || raw === "XL" ? raw : null;
}

export function CheckoutKadaPage({
  pricing = FALLBACK_KADA_PRICING,
}: {
  pricing?: KadaPricing;
}) {
  const params = useSearchParams();
  const router = useRouter();

  const [variant, setVariant] = useState<KadaVariant>(() =>
    parseKadaVariant(params.get("variant"))
  );
  const siddha = params.get("siddha") === "true";

  const variantConfig = KADA_VARIANTS[variant];
  const basePricePaise = kadaVariantPricePaise(variant, pricing);
  const mrpPaise = kadaVariantMrpPaise(variant, pricing);
  const siddhaPricePaise = siddha ? pricing.siddhaPricePaise : 0;

  const variantLabel = variantConfig.label;
  const [payment, setPayment] = useState<KadaPaymentMethod>("cod");
  const [design, setDesign] = useState<KadaDesign | null>(() =>
    parseOptionalKadaDesign(params.get("design"))
  );
  const [sizeCode, setSizeCode] = useState<KadaSizeCode | null>(() =>
    parseOptionalKadaSize(params.get("size"))
  );
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [razorpayOpen, setRazorpayOpen] = useState(false);
  const [razorpayReady, setRazorpayReady] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const prepaidDiscountPaise = payment === "prepaid" ? pricing.prepaidDiscountPaise : 0;
  const totalPaise = kadaTotalPaise({ variant, siddha, paymentMethod: payment, pricing });
  const basePrice = basePricePaise / 100;
  const mrp = mrpPaise / 100;
  const siddhaPrice = siddhaPricePaise / 100;
  const prepaidDiscount = prepaidDiscountPaise / 100;
  const total = totalPaise / 100;
  const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const designLabel = design ? KADA_DESIGN_LABELS[design] : "Select design";
  const sizeLabel = sizeCode ? KADA_SIZE_LABELS[sizeCode] : "Select size";

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

  const isValid =
    form.name.trim().length >= 2 &&
    form.phone.length === 10 &&
    form.address.trim().length >= 5 &&
    form.city.trim().length >= 2 &&
    form.pincode.length === 6 &&
    Boolean(design && sizeCode);

  function completeOrder(order: PlacedOrder) {
    setPlaced(order);
    sessionStorage.setItem(
      "kada_order_complete",
      JSON.stringify({
        orderId: order.orderDbId,
        orderNumber: order.orderNumber,
        paymentMethod: order.paymentMethod,
        variantLabel,
        designLabel,
        sizeLabel,
        totalPaise,
        phone: form.phone,
        siddha,
      })
    );
    router.push("/thank-you/kada");
  }

  async function handlePlace() {
    if (!design || !sizeCode) {
      setError("Select your Kada design and size to continue.");
      return;
    }
    if (!isValid) return;
    setError("");

    setLoading(true);
    try {
      const res = await fetch("/api/products/kada/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountPaise: totalPaise,
          paymentMethod: payment,
          product: { variant, design, size: sizeCode, siddha },
          customer: {
            fullName: form.name,
            phone: form.phone,
            address: form.address,
            city: form.city,
            state: form.state,
            pincode: form.pincode,
          },
          attribution: {
            sourcePage: "/checkout/kada",
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
        completeOrder({
          orderDbId: json.orderDbId,
          orderNumber: json.orderNumber,
          paymentMethod: payment,
        });
        return;
      }

      const dbId = json.orderDbId;
      const orderNumber = json.orderNumber;

      if (!razorpayKeyId || razorpayKeyId.includes("your_razorpay")) {
        throw new Error("Online payment is not configured. Please choose COD.");
      }
      if (!json.razorpayOrderId) {
        throw new Error("Payment order could not be created. Please try COD.");
      }
      if (!razorpayReady || !window.Razorpay) {
        throw new Error("Payment window is still loading. Please wait a second and try again.");
      }

      const options = {
        key: razorpayKeyId,
        amount: json.amountPaise ?? totalPaise,
        currency: json.currency ?? "INR",
        name: "VedGuide",
        description: `${designLabel} ${variantLabel} Kada`,
        order_id: json.razorpayOrderId,
        prefill: {
          name: form.name,
          contact: form.phone,
        },
        notes: {
          order_id: dbId,
          product: "vedic_kada",
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
            completeOrder({ orderDbId: dbId, orderNumber, paymentMethod: payment });
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

  if (placed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-amber-50 px-5 text-center">
        <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-green-100">
          <Check size={36} className="text-green-600 stroke-[2.5]" />
        </div>
        <h1 className="font-heading mb-2 text-2xl font-bold text-foreground">
          Order Placed! 🎉
        </h1>
        <p className="mb-1 text-sm text-muted-foreground">
          Thank you, {form.name.split(" ")[0]}. Your Vedic Kada order is confirmed.
        </p>
        <p className="mb-1 font-mono text-xs font-semibold text-amber-800">
          {placed.orderNumber}
        </p>
        <p className="mb-6 text-xs text-muted-foreground">
          {placed.paymentMethod === "cod" ? "COD order saved." : "Payment received."} We'll WhatsApp tracking details on <strong>+91 {form.phone}</strong>.
        </p>
        <div className="mb-8 w-full max-w-xs rounded-2xl border border-amber-100 bg-white p-5 text-left">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-amber-600">Order Summary</p>
          <p className="text-sm font-semibold text-foreground">{designLabel} · {variantLabel}</p>
          <p className="text-xs text-muted-foreground">Size {sizeLabel} {siddha && "· Siddh Energised"}</p>
          <div className="mt-3 border-t border-stone-100 pt-3 flex justify-between">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-sm font-black text-amber-700">₹{total.toLocaleString("en-IN")}</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Truck size={11} />
            Delivered in 15–20 days
          </div>
        </div>
        <button
          onClick={() => router.push("/products/kada")}
          className="text-sm font-semibold text-amber-700 underline underline-offset-2"
        >
          ← Back to product
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-10">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-stone-100 bg-white px-4 py-3.5 shadow-sm">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex size-8 items-center justify-center rounded-full hover:bg-stone-100"
          >
            <ChevronLeft size={20} className="text-foreground" />
          </button>
          <h1 className="text-base font-bold text-foreground">Checkout</h1>
          <div className="ml-auto flex items-center gap-1.5 text-xs font-medium text-green-600">
            <Shield size={12} />
            Secure
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 pt-5 space-y-4">

        {/* Order Summary */}
        <div className="rounded-2xl border border-amber-100 bg-white overflow-hidden">
          <div className="bg-amber-50 px-4 py-3 border-b border-amber-100">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-700">Order Summary</p>
          </div>
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-3xl">
                ⚜️
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">Astrological Vedic Kada</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{designLabel} · {variantLabel}</p>
                <p className="text-xs text-muted-foreground">Size: {sizeLabel}</p>
                {siddha && (
                  <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                    + Siddh Energised
                  </span>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-black text-amber-700">₹{basePrice.toLocaleString("en-IN")}</p>
                <p className="text-[10px] text-muted-foreground line-through">₹{mrp.toLocaleString("en-IN")}</p>
              </div>
            </div>

            <div className="mt-4 space-y-2 border-t border-stone-100 pt-3">
              <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-2.5">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-stone-600">
                      Your Kada choice
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      Pick the type, design and size that fits you best.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push("/products/kada")}
                    className="shrink-0 rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[10px] font-bold text-stone-600"
                  >
                    View product
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {(["plated", "silver"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => {
                        setVariant(v);
                        setError("");
                      }}
                      className={cn(
                        "rounded-lg border px-1.5 py-1.5 text-[10px] font-bold transition-all",
                        variant === v
                          ? "border-amber-500 bg-amber-500 text-white shadow-sm"
                          : "border-stone-200 bg-white text-stone-700 hover:border-amber-300"
                      )}
                    >
                      {KADA_VARIANTS[v].label.replace(" Kada", "")}
                    </button>
                  ))}
                </div>

                <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                  {DESIGN_OPTIONS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        setDesign(d);
                        setError("");
                      }}
                      className={cn(
                        "rounded-lg border px-1.5 py-1.5 text-[10px] font-bold transition-all",
                        design === d
                          ? "border-amber-500 bg-amber-500 text-white shadow-sm"
                          : "border-stone-200 bg-white text-stone-700 hover:border-amber-300"
                      )}
                    >
                      {KADA_DESIGN_LABELS[d].replace(" Finish", "")}
                    </button>
                  ))}
                </div>

                <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                  {SIZE_OPTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setSizeCode(s);
                        setError("");
                      }}
                      className={cn(
                        "rounded-lg border px-1.5 py-1.5 text-center text-[10px] font-black transition-all",
                        sizeCode === s
                          ? "border-stone-900 bg-stone-900 text-white shadow-sm"
                          : "border-stone-200 bg-white text-stone-700 hover:border-stone-400"
                      )}
                    >
                      {s}
                      <span className="mt-0.5 block text-[8px] font-semibold opacity-75">
                        {KADA_SIZE_LABELS[s].split(" - ")[1]}
                      </span>
                    </button>
                  ))}
                </div>

                {(!design || !sizeCode) && (
                  <p className="mt-2 rounded-lg border border-amber-200 bg-white px-2.5 py-1.5 text-center text-[11px] font-semibold text-amber-700">
                    Select a design and size to continue.
                  </p>
                )}
              </div>

              {siddha && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Siddh Energisation</span>
                  <span className="font-semibold text-foreground">+₹{siddhaPrice.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Delivery</span>
                <span className="font-semibold text-green-600">Free</span>
              </div>
              {prepaidDiscount > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Prepaid Discount</span>
                  <span className="font-semibold text-green-600">−₹{prepaidDiscount.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-stone-100 pt-2">
                <span className="text-sm font-bold text-foreground">Total</span>
                <span className="text-lg font-black text-amber-700">₹{total.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {[
                { Icon: Package, text: "Handcrafted" },
                { Icon: Clock, text: "15–20 Days" },
                { Icon: Shield, text: "Replacement Guarantee" },
              ].map(({ Icon, text }) => (
                <span key={text} className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
                  <Icon size={10} />
                  {text}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Delivery Details */}
        <div className="rounded-2xl border bg-white overflow-hidden">
          <div className="border-b border-stone-100 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Delivery Details</p>
          </div>
          <div className="p-4 space-y-3">
            {/* Name */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">Full Name *</label>
              <input
                type="text"
                placeholder="Your full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm placeholder:text-stone-400 outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">
                WhatsApp Number * <span className="font-normal text-muted-foreground">(tracking sent here)</span>
              </label>
              <div className="flex">
                <span className="flex items-center rounded-l-xl border border-r-0 border-stone-200 bg-stone-50 px-3 text-sm text-muted-foreground">
                  +91
                </span>
                <input
                  type="tel"
                  placeholder="10-digit number"
                  maxLength={10}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })}
                  className="flex-1 rounded-r-xl border border-stone-200 px-4 py-3 text-sm placeholder:text-stone-400 outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">Full Address *</label>
              <textarea
                placeholder="House no., Street, Area, Landmark"
                rows={2}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full resize-none rounded-xl border border-stone-200 px-4 py-3 text-sm placeholder:text-stone-400 outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              />
            </div>

            {/* City + Pincode */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">City *</label>
                <input
                  type="text"
                  placeholder="City"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm placeholder:text-stone-400 outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">Pincode *</label>
                <input
                  type="text"
                  placeholder="6-digit"
                  maxLength={6}
                  value={form.pincode}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "") })}
                  className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm placeholder:text-stone-400 outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                />
              </div>
            </div>

            {/* State */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">State *</label>
              <input
                type="text"
                placeholder="State"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm placeholder:text-stone-400 outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              />
            </div>
          </div>
        </div>

        {/* Payment */}
        <div className="rounded-2xl border bg-white overflow-hidden">
          <div className="border-b border-stone-100 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Payment Method</p>
          </div>
          <div className="p-4 space-y-2.5">
            {/* COD */}
            <div
              onClick={() => setPayment("cod")}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-4 transition-all",
                payment === "cod"
                  ? "border-amber-500 bg-amber-50"
                  : "border-stone-200 bg-white hover:border-stone-300"
              )}
            >
              <div className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                payment === "cod" ? "border-amber-500 bg-amber-500" : "border-stone-300"
              )}>
                {payment === "cod" && <div className="size-2 rounded-full bg-white" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">Cash on Delivery</p>
                <p className="text-xs text-muted-foreground">Pay when your order arrives</p>
              </div>
              <span className="text-2xl">💵</span>
            </div>

            {/* Prepaid */}
            <div
              onClick={() => setPayment("prepaid")}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-4 transition-all",
                payment === "prepaid"
                  ? "border-amber-500 bg-amber-50"
                  : "border-stone-200 bg-white hover:border-stone-300"
              )}
            >
              <div className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                payment === "prepaid" ? "border-amber-500 bg-amber-500" : "border-stone-300"
              )}>
                {payment === "prepaid" && <div className="size-2 rounded-full bg-white" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">Pay Online</p>
                <p className="text-xs text-muted-foreground">UPI · Cards · Net Banking</p>
              </div>
              <span className="rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-black text-green-700">
                ₹50 OFF
              </span>
            </div>
          </div>
        </div>

        {/* Place Order */}
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total payable</span>
            <span className="text-xl font-black text-amber-700">₹{total.toLocaleString("en-IN")}</span>
          </div>

          <button
            onClick={handlePlace}
            disabled={!isValid || loading || razorpayOpen}
            className={cn(
              "w-full rounded-2xl py-4 text-base font-black text-white shadow-lg transition-all active:scale-[0.98]",
              isValid && !loading && !razorpayOpen
                ? "bg-amber-700 hover:bg-amber-800"
                : "bg-stone-300 cursor-not-allowed"
            )}
          >
            {loading || razorpayOpen ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                {razorpayOpen ? "Complete payment..." : "Placing order..."}
              </span>
            ) : (
              "Place Order"
            )}
            <p className="mt-0.5 text-xs font-normal opacity-85">
              {payment === "cod" ? "Pay on delivery · No advance needed" : "You save ₹50 on prepaid"}
            </p>
          </button>

          {error && (
            <p className="mt-2 rounded-xl border border-amber-200 bg-white px-3 py-2 text-center text-xs font-medium text-amber-700">
              {error}
            </p>
          )}

          {!isValid && (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Please fill all required fields to place your order
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><Shield size={10} /> 100% Secure</span>
            <span>·</span>
            <span className="flex items-center gap-1"><Truck size={10} /> Free Delivery</span>
            <span>·</span>
            <span>Replacement Guarantee</span>
          </div>
        </div>
      </div>
    </div>
  );
}
