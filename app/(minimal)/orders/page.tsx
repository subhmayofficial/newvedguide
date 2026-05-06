import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppBottomNav } from "@/components/shared/app-bottom-nav";
import {
  ArrowLeft,
  Package,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

export const metadata: Metadata = { title: "My Orders · VedGuide" };

function statusBadge(paymentStatus: string, fulfillmentStatus: string) {
  if (paymentStatus === "paid" && fulfillmentStatus === "delivered")
    return {
      label: "Delivered",
      cls: "bg-emerald-100 text-emerald-700",
      Icon: CheckCircle,
    };
  if (paymentStatus === "paid")
    return {
      label: "Processing",
      cls: "bg-amber-100 text-amber-700",
      Icon: Clock,
    };
  if (paymentStatus === "failed" || paymentStatus === "cancelled")
    return {
      label: "Cancelled",
      cls: "bg-red-100 text-red-600",
      Icon: XCircle,
    };
  return { label: "Pending", cls: "bg-gray-100 text-gray-600", Icon: Clock };
}

function productLabel(slug: string): string {
  const map: Record<string, string> = {
    "kundli-report": "Kundli Report",
    "premium-kundli": "Premium Kundli",
    "kundli-consultation": "Kundli Consultation",
    "free-kundli": "Free Kundli",
  };
  return (
    map[slug] ??
    slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function MyOrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/orders");

  const email = user.email ?? "";
  const authPhone =
    (user.user_metadata?.auth_phone as string | undefined) ?? null;
  const phone10 = authPhone?.replace(/^\+91/, "") ?? null;

  let customerId: string | null = null;
  if (email || phone10) {
    const orParts = [
      email ? `email.eq.${email}` : null,
      phone10 ? `phone.eq.${phone10}` : null,
    ]
      .filter(Boolean)
      .join(",");

    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .or(orParts)
      .maybeSingle();
    customerId = customer?.id ?? null;
  }

  const { data: orders } = customerId
    ? await supabase
        .from("orders")
        .select(
          "id, order_number, product_slug, payment_status, fulfillment_status, total_amount, currency, created_at, paid_at"
        )
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false })
        .limit(40)
    : { data: [] };

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3.5 flex items-center gap-3">
        <Link
          href="/profile"
          className="flex items-center justify-center size-9 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="font-semibold text-[17px] text-gray-900 flex-1 text-center pr-9">
          My Orders
        </h1>
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto">
        {orders && orders.length > 0 ? (
          <div className="space-y-3">
            {orders.map((order) => {
              const badge = statusBadge(
                order.payment_status,
                order.fulfillment_status
              );
              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-50">
                      <Package className="size-5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-[14px]">
                        {productLabel(order.product_slug)}
                      </p>
                      <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                        #{order.order_number}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge.cls}`}
                        >
                          <badge.Icon className="size-3" />
                          {badge.label}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {relativeTime(order.created_at)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-gray-900 text-[14px]">
                        ₹{Number(order.total_amount).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <div className="flex size-20 items-center justify-center rounded-full bg-amber-50">
              <Package className="size-9 text-amber-400" />
            </div>
            <div>
              <p className="font-semibold text-lg text-gray-900">
                No orders yet
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Your Kundli reports and consultations will appear here.
              </p>
            </div>
            <Link
              href="/kundli-report"
              className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600"
            >
              Get your Kundli Report
            </Link>
          </div>
        )}
      </div>
      <AppBottomNav />
    </div>
  );
}
