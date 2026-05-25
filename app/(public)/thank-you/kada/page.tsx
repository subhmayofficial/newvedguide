"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  Home,
  MessageCircle,
  PackageCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getWhatsAppHref } from "@/lib/constants/contact";

type KadaThankYouState = {
  orderId: string;
  orderNumber: string;
  paymentMethod: "cod" | "prepaid";
  variantLabel: string;
  designLabel: string;
  sizeLabel: string;
  totalPaise: number;
  phone: string;
  siddha: boolean;
};

let cachedOrder: KadaThankYouState | null = null;

export default function KadaThankYouPage() {
  const router = useRouter();
  const [order, setOrder] = useState<KadaThankYouState | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("kada_order_complete");
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as KadaThankYouState;
        if (parsed.orderId && parsed.orderNumber) {
          cachedOrder = parsed;
          sessionStorage.removeItem("kada_order_complete");
          const raf = requestAnimationFrame(() => setOrder(parsed));
          return () => cancelAnimationFrame(raf);
        }
      } catch {
        /* fall through */
      }
    }

    if (cachedOrder) {
      const raf = requestAnimationFrame(() => setOrder(cachedOrder));
      return () => cancelAnimationFrame(raf);
    }

    router.replace("/products/kada");
  }, [router]);

  if (!order) return null;

  const waHref = getWhatsAppHref(
    `Hi VedGuide, maine Vedic Kada order place kiya hai. Order number: ${order.orderNumber}`
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fff7ed_0%,#fff_40%,#fef3c7_100%)]">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-5 py-12 text-center">
        <div className="mx-auto mb-5 flex size-24 items-center justify-center rounded-full bg-emerald-100 ring-8 ring-emerald-50">
          <CheckCircle2 className="size-12 text-emerald-600" strokeWidth={2.4} />
        </div>

        <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-700">
          Order Confirmed
        </p>
        <h1 className="font-heading mt-2 text-3xl font-black leading-tight text-stone-950 md:text-5xl">
          Your Vedic Kada
          <br />
          is being prepared
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-stone-600 md:text-base">
          Thank you. Your order is saved and our team will prepare, pack, and ship it with care.
          Delivery usually takes <strong>15-20 days</strong>.
        </p>

        <div className="mx-auto mt-8 w-full max-w-md overflow-hidden rounded-3xl border border-amber-200 bg-white text-left shadow-xl shadow-amber-900/10">
          <div className="bg-gradient-to-r from-amber-700 via-amber-600 to-yellow-500 px-5 py-4 text-white">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-100">
              Order summary
            </p>
            <p className="mt-1 font-mono text-sm font-black">{order.orderNumber}</p>
          </div>

          <div className="space-y-4 p-5">
            <div className="flex items-start gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-2xl">
                ⚜️
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-stone-950">Astrological Vedic Kada</p>
                <p className="mt-0.5 text-sm text-stone-600">
                  {order.designLabel} · {order.variantLabel}
                </p>
                <p className="text-sm text-stone-600">
                  Size {order.sizeLabel}
                  {order.siddha ? " · Siddh Energised" : ""}
                </p>
              </div>
              <p className="shrink-0 font-black text-amber-700">
                ₹{Math.round(order.totalPaise / 100).toLocaleString("en-IN")}
              </p>
            </div>

            <div className="grid gap-2 border-t border-stone-100 pt-4 text-sm">
              <SummaryRow label="Payment" value={order.paymentMethod === "cod" ? "Cash on Delivery" : "Online paid"} />
              <SummaryRow label="WhatsApp" value={`+91 ${order.phone}`} />
              <SummaryRow label="Delivery" value="15-20 days" />
            </div>
          </div>
        </div>

        <div className="mx-auto mt-7 grid w-full max-w-md gap-3 text-left">
          {[
            {
              icon: PackageCheck,
              title: "Order received",
              desc: "Your selection and delivery address are saved in our admin panel.",
            },
            {
              icon: Sparkles,
              title: "Preparation starts",
              desc: order.siddha
                ? "Siddh energisation and preparation will be handled before dispatch."
                : "Your Kada will be checked, packed, and prepared for dispatch.",
            },
            {
              icon: Truck,
              title: "Shipping update",
              desc: "Tracking details will be sent on WhatsApp once the package is dispatched.",
            },
            {
              icon: Clock,
              title: "Delivery timeline",
              desc: "Expected delivery window is 15-20 days from order confirmation.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-3 rounded-2xl border border-amber-100 bg-white/85 p-4 shadow-sm">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <Icon className="size-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-stone-950">{title}</p>
                <p className="mt-0.5 text-sm leading-snug text-stone-600">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            size="lg"
            className="bg-[#25D366] px-6 font-bold text-white hover:bg-[#1DAE52]"
            render={<a href={waHref} target="_blank" rel="noopener noreferrer" />}
          >
            <MessageCircle className="size-4" />
            WhatsApp support
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="bg-white"
            render={<Link href="/products/kada" />}
          >
            <Home className="size-4" />
            Back to product
          </Button>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-stone-500">{label}</span>
      <span className="text-right font-semibold text-stone-900">{value}</span>
    </div>
  );
}

