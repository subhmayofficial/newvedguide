"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, Shield, Truck, Check, Package, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const DESIGN_LABELS: Record<string, string> = {
  classic: "Classic Plain",
  traditional: "Traditional",
  ornate: "Ornate Finish",
};

export function CheckoutKadaPage() {
  const params = useSearchParams();
  const router = useRouter();

  const variant = (params.get("variant") || "plated") as "plated" | "silver";
  const design = params.get("design") || "classic";
  const sizeCode = params.get("size") || "M";
  const siddha = params.get("siddha") === "true";

  const basePrice = variant === "silver" ? 4499 : 699;
  const mrp = variant === "silver" ? 7999 : 1499;
  const siddhaPrice = siddha ? 299 : 0;

  const variantLabel = variant === "silver" ? "Pure Silver" : "Silver Plated";
  const designLabel = DESIGN_LABELS[design] || "Classic Plain";

  const [payment, setPayment] = useState<"cod" | "prepaid">("cod");
  const [placed, setPlaced] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const prepaidDiscount = payment === "prepaid" ? 50 : 0;
  const total = basePrice + siddhaPrice - prepaidDiscount;

  const isValid =
    form.name.trim().length >= 2 &&
    form.phone.length === 10 &&
    form.address.trim().length >= 5 &&
    form.city.trim().length >= 2 &&
    form.pincode.length === 6;

  function handlePlace() {
    if (!isValid) return;
    setPlaced(true);
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
        <p className="mb-6 text-xs text-muted-foreground">
          We'll WhatsApp you the tracking details on <strong>+91 {form.phone}</strong>
        </p>
        <div className="mb-8 w-full max-w-xs rounded-2xl border border-amber-100 bg-white p-5 text-left">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-amber-600">Order Summary</p>
          <p className="text-sm font-semibold text-foreground">{designLabel} · {variantLabel}</p>
          <p className="text-xs text-muted-foreground">Size {sizeCode} {siddha && "· Siddh Energised"}</p>
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
                <p className="text-xs text-muted-foreground">Size: {sizeCode}</p>
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
              {siddha && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Siddh Energisation</span>
                  <span className="font-semibold text-foreground">+₹299</span>
                </div>
              )}
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Delivery</span>
                <span className="font-semibold text-green-600">Free</span>
              </div>
              {prepaidDiscount > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Prepaid Discount</span>
                  <span className="font-semibold text-green-600">−₹50</span>
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
            disabled={!isValid}
            className={cn(
              "w-full rounded-2xl py-4 text-base font-black text-white shadow-lg transition-all active:scale-[0.98]",
              isValid
                ? "bg-amber-700 hover:bg-amber-800"
                : "bg-stone-300 cursor-not-allowed"
            )}
          >
            Place Order 🛒
            <p className="mt-0.5 text-xs font-normal opacity-85">
              {payment === "cod" ? "Pay on delivery · No advance needed" : "You save ₹50 on prepaid"}
            </p>
          </button>

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
