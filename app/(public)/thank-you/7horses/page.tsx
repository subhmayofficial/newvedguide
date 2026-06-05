"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle2,
  Clock,
  Home,
  MessageCircle,
  PackageCheck,
  Truck,
  Sparkles,
  Star,
} from "lucide-react";
import { getWhatsAppHref } from "@/lib/constants/contact";

function ThankYouContent() {
  const params = useSearchParams();
  const orderNumber = params.get("order") ?? "";
  const paymentMethod = params.get("payment") ?? "cod";

  const waHref = getWhatsAppHref(
    `Hi VedGuide, maine 7 Horses Pyrite Frame order place kiya hai. Order number: ${orderNumber}`
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fffbeb_0%,_#fff_45%,_#fef9c3_100%)]">
      <div className="mx-auto flex min-h-screen max-w-lg flex-col px-5 py-10 text-center">

        {/* Success icon */}
        <div className="mx-auto mb-5 flex size-24 items-center justify-center rounded-full bg-emerald-100 ring-8 ring-emerald-50">
          <CheckCircle2 className="size-12 text-emerald-600" strokeWidth={2.4} />
        </div>

        <p className="text-[11px] font-black uppercase tracking-[0.25em] text-amber-700">
          Order Confirmed
        </p>
        <h1 className="mt-2 text-3xl font-black leading-tight text-stone-950">
          Your 7 Horses Frame<br />is on its way! 🐴
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-stone-500">
          Thank you for your order. Our team will pack and ship your frame with care.
          {paymentMethod === "cod"
            ? " Pay comfortably on delivery."
            : " Your payment has been received."}
        </p>

        {/* Order card */}
        <div className="mx-auto mt-7 w-full overflow-hidden rounded-3xl border border-amber-200 bg-white text-left shadow-xl shadow-amber-900/10">
          {/* Amber header */}
          <div className="bg-gradient-to-r from-amber-700 via-amber-600 to-yellow-500 px-5 py-4 text-white">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-100">
              Order Summary
            </p>
            {orderNumber && (
              <p className="mt-1 font-mono text-sm font-black">{orderNumber}</p>
            )}
          </div>

          <div className="p-5">
            {/* Product row */}
            <div className="flex items-center gap-4">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl border border-amber-100">
                <Image
                  src="/7horses/1.webp"
                  alt="7 Horses on Raw Pyrite Frame"
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-stone-900 leading-snug">
                  7 Horses on Raw Pyrite Frame
                </p>
                <p className="mt-0.5 text-xs text-stone-500">13 × 10.5 inch · Raw Pyrite</p>
                <div className="mt-1 flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={10} className="fill-amber-400 text-amber-400" />
                  ))}
                  <span className="ml-1 text-[10px] text-stone-400">4.94 · 388 reviews</span>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="mt-4 space-y-2 border-t border-stone-100 pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-500">Payment</span>
                <span className="font-semibold text-stone-900">
                  {paymentMethod === "cod" ? "Cash on Delivery" : "Paid Online ✓"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Delivery</span>
                <span className="font-semibold text-stone-900">7–10 days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Shipping</span>
                <span className="font-semibold text-green-600">FREE</span>
              </div>
            </div>
          </div>
        </div>

        {/* What happens next */}
        <div className="mx-auto mt-6 w-full space-y-3 text-left">
          {[
            {
              icon: PackageCheck,
              title: "Order received",
              desc: "Your order details are saved. Our team will review and confirm shortly.",
              color: "bg-amber-100 text-amber-700",
            },
            {
              icon: Sparkles,
              title: "Packing & preparation",
              desc: "Your frame is carefully packed in a rigid kappa box with protective foam.",
              color: "bg-amber-100 text-amber-700",
            },
            {
              icon: Truck,
              title: "Shipped to you",
              desc: "Tracking details will be sent on WhatsApp once dispatched.",
              color: "bg-amber-100 text-amber-700",
            },
            {
              icon: Clock,
              title: "Delivery in 7–10 days",
              desc: "Place it on the East or Northeast wall for best Vastu results.",
              color: "bg-green-100 text-green-700",
            },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div
              key={title}
              className="flex gap-3 rounded-2xl border border-stone-100 bg-white p-4 shadow-sm"
            >
              <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${color}`}>
                <Icon className="size-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-stone-900">{title}</p>
                <p className="mt-0.5 text-xs leading-snug text-stone-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Vastu reminder */}
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-left">
          <p className="text-xs font-black text-amber-800 uppercase tracking-wide mb-1">
            📍 Vastu Placement Reminder
          </p>
          <p className="text-xs text-amber-700 leading-relaxed">
            Place your frame on the <strong>East or Northeast</strong> wall of your office or home.
            Install on a <strong>Sunday</strong> for maximum Sun God energy. Keep it at eye level or above.
          </p>
        </div>

        {/* CTAs */}
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-6 py-4 text-sm font-black text-white shadow-lg transition-all hover:bg-[#1DAE52] active:scale-95"
          >
            <MessageCircle size={16} />
            WhatsApp Support
          </a>
          <Link
            href="/7horses"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-stone-200 bg-white px-6 py-4 text-sm font-black text-stone-700 transition-all hover:border-amber-300 active:scale-95"
          >
            <Home size={16} />
            Back to Product
          </Link>
        </div>

        <p className="mt-8 text-xs text-stone-400">
          Questions? WhatsApp us anytime — we usually reply within a few hours.
        </p>
      </div>
    </div>
  );
}

export default function SevenHorsesThankYouPage() {
  return (
    <Suspense>
      <ThankYouContent />
    </Suspense>
  );
}
