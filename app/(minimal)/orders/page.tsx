import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppBottomNav } from "@/components/shared/app-bottom-nav";
import { LIVE_CHAT_ASTROLOGERS } from "@/lib/data/live-chat-astrologers";
import { formatInrFromPaisePrecise } from "@/lib/format-money";
import {
  ArrowLeft,
  Package,
  MessageCircle,
  CheckCircle,
  Clock,
  XCircle,
  Radio,
} from "lucide-react";

export const metadata: Metadata = { title: "My Orders · VedGuide" };

/* ─── helpers ────────────────────────────────────────────────────────────── */

function orderStatusBadge(paymentStatus: string, fulfillmentStatus: string) {
  if (paymentStatus === "paid" && fulfillmentStatus === "delivered")
    return { label: "Delivered", cls: "bg-emerald-100 text-emerald-700", Icon: CheckCircle };
  if (paymentStatus === "paid")
    return { label: "Processing", cls: "bg-amber-100 text-amber-700", Icon: Clock };
  if (paymentStatus === "failed" || paymentStatus === "cancelled")
    return { label: "Cancelled", cls: "bg-red-100 text-red-600", Icon: XCircle };
  return { label: "Pending", cls: "bg-gray-100 text-gray-600", Icon: Clock };
}

function chatStatusBadge(status: string) {
  if (status === "open")
    return { label: "Live", cls: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500 animate-pulse" };
  if (status === "waiting_astrologer")
    return { label: "Waiting", cls: "bg-amber-100 text-amber-700", dot: "bg-amber-400" };
  return { label: "Completed", cls: "bg-gray-100 text-gray-500", dot: "bg-gray-300" };
}

function productLabel(slug: string): string {
  const map: Record<string, string> = {
    "kundli-report": "Kundli Report",
    "premium-kundli": "Premium Kundli",
    "kundli-consultation": "Kundli Consultation",
    "free-kundli": "Free Kundli",
  };
  return map[slug] ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function astroName(id: string) {
  return LIVE_CHAT_ASTROLOGERS.find((a) => a.id === id)?.name ?? id;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/* ─── page ───────────────────────────────────────────────────────────────── */

export default async function MyOrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/orders");

  const email = user.email ?? "";
  const authPhone = (user.user_metadata?.auth_phone as string | undefined) ?? null;
  const phone10 = authPhone?.replace(/^\+91/, "") ?? null;

  /* product orders */
  let customerId: string | null = null;
  if (email || phone10) {
    const orParts = [
      email ? `email.eq.${email}` : null,
      phone10 ? `phone.eq.${phone10}` : null,
    ].filter(Boolean).join(",");
    const { data: customer } = await supabase
      .from("customers").select("id").or(orParts).maybeSingle();
    customerId = customer?.id ?? null;
  }

  const [{ data: orders }, { data: chatSessions }] = await Promise.all([
    customerId
      ? supabase
          .from("orders")
          .select("id, order_number, product_slug, payment_status, fulfillment_status, total_amount, currency, created_at")
          .eq("customer_id", customerId)
          .order("created_at", { ascending: false })
          .limit(40)
      : Promise.resolve({ data: [] }),
    supabase
      .from("chat_sessions")
      .select("id, order_code, status, astrologer_id, updated_at, total_billed_paise, created_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(50),
  ]);

  const hasOrders = (orders?.length ?? 0) > 0;
  const hasChats = (chatSessions?.length ?? 0) > 0;

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

      <div className="px-4 py-4 max-w-lg mx-auto space-y-5">

        {/* ── Chat sessions ── */}
        {hasChats && (
          <section>
            <div className="mb-2.5 flex items-center justify-between px-1">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                Chat Sessions
              </p>
              <Link
                href="/astrologers/chats"
                className="text-[12px] font-semibold text-amber-600 hover:text-amber-700"
              >
                View all →
              </Link>
            </div>
            <div className="space-y-2">
              {chatSessions!.map((s) => {
                const badge = chatStatusBadge(s.status);
                const href = s.status === "waiting_astrologer"
                  ? `/astrologers/chats/waiting/${s.id}`
                  : `/astrologers/chats/${s.id}`;
                const isLive = s.status === "open";
                return (
                  <Link
                    key={s.id}
                    href={href}
                    className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm transition hover:border-amber-200 hover:shadow-md active:scale-[0.99]"
                  >
                    <div className="relative flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-50">
                      <MessageCircle className="size-5 text-amber-500" />
                      {isLive && (
                        <span className="absolute -right-1 -top-1 flex size-3">
                          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex size-3 rounded-full bg-emerald-500" />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold text-gray-900">
                        {astroName(s.astrologer_id)}
                      </p>
                      <p className="font-mono text-[10px] text-gray-400 mt-0.5 flex items-center gap-1.5">
                        {isLive && <Radio className="size-3 text-emerald-500" />}
                        {s.order_code ?? "Order pending"}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${badge.cls}`}>
                        <span className={`size-1.5 rounded-full ${badge.dot}`} />
                        {badge.label}
                      </span>
                      <span className="text-[11px] tabular-nums text-gray-400 font-medium">
                        {(s.total_billed_paise ?? 0) > 0
                          ? formatInrFromPaisePrecise(s.total_billed_paise ?? 0)
                          : relativeTime(s.updated_at)}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Product orders ── */}
        {hasOrders && (
          <section>
            <p className="mb-2.5 px-1 text-[11px] font-bold uppercase tracking-widest text-gray-400">
              Product Orders
            </p>
            <div className="space-y-2">
              {orders!.map((order) => {
                const badge = orderStatusBadge(order.payment_status, order.fulfillment_status);
                return (
                  <div
                    key={order.id}
                    className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                  >
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
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge.cls}`}>
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
                );
              })}
            </div>
          </section>
        )}

        {/* Empty state */}
        {!hasChats && !hasOrders && (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <div className="flex size-20 items-center justify-center rounded-full bg-amber-50">
              <Package className="size-9 text-amber-400" />
            </div>
            <div>
              <p className="font-semibold text-lg text-gray-900">No orders yet</p>
              <p className="mt-1 text-sm text-gray-500">
                Your chat sessions and product orders will appear here.
              </p>
            </div>
            <Link
              href="/astrologers"
              className="rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-amber-500"
            >
              Chat with an astrologer
            </Link>
          </div>
        )}
      </div>

      <AppBottomNav />
    </div>
  );
}
