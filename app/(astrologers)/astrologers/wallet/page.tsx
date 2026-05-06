import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LIVE_CHAT_ASTROLOGERS } from "@/lib/data/live-chat-astrologers";
import { formatInrFromPaisePrecise } from "@/lib/format-money";
import { ArrowLeft, ArrowUpRight, MessageCircle, TrendingDown, TrendingUp } from "lucide-react";
import { EngagingRouteProgress } from "@/components/ui/engaging-route-progress";

const WalletBalanceCard = dynamic(
  () => import("@/components/astrologers/wallet-balance-card").then((m) => m.WalletBalanceCard),
  {
    loading: () => (
      <div className="w-full space-y-3">
        <EngagingRouteProgress ariaLabel="Loading wallet card" />
        <div className="h-52 w-full animate-pulse rounded-3xl bg-gray-200/80" />
      </div>
    ),
  }
);

export const metadata: Metadata = {
  title: "Wallet · VedGuide",
  description: "Balance, chat orders, and wallet activity on VedGuide.",
};

function astroName(id: string) {
  return LIVE_CHAT_ASTROLOGERS.find((a) => a.id === id)?.name ?? id;
}

function ledgerLabel(reason: string) {
  switch (reason) {
    case "live_chat_meter":   return "Chat charge";
    case "live_chat_session": return "Chat session";
    case "test_topup":        return "Wallet top-up";
    default: return reason.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function statusBadge(status: string) {
  if (status === "open")               return { label: "Live",    cls: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500 animate-pulse" };
  if (status === "waiting_astrologer") return { label: "Waiting", cls: "bg-amber-100 text-amber-700",    dot: "bg-amber-400" };
  return                                      { label: "Done",    cls: "bg-gray-100 text-gray-500",      dot: "bg-gray-300" };
}

export default async function AstrologersWalletPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/astrologers/wallet");

  const [{ data: profile }, { data: ledgerRows }, { data: orders }] = await Promise.all([
    supabase.from("user_profiles").select("wallet_balance_paise").eq("id", user.id).maybeSingle(),
    supabase.from("wallet_ledger")
      .select("id, delta_paise, reason, metadata, created_at")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(60),
    supabase.from("chat_sessions")
      .select("id, order_code, status, astrologer_id, updated_at, total_billed_paise")
      .eq("user_id", user.id).order("updated_at", { ascending: false }).limit(20),
  ]);

  const balancePaise     = profile?.wallet_balance_paise ?? 0;
  const totalSpentPaise  = (ledgerRows ?? [])
    .filter((r) => r.delta_paise < 0)
    .reduce((acc, r) => acc + Math.abs(r.delta_paise), 0);

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-100 bg-white px-4 py-3.5">
        <Link
          href="/profile"
          className="flex size-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="flex-1 text-center pr-9 text-[17px] font-semibold text-gray-900">
          Wallet
        </h1>
      </div>

      <div className="mx-auto max-w-lg space-y-5 px-4 py-5">

        {/* ── Dark balance card — kept as high-contrast hero ── */}
        <WalletBalanceCard
          balancePaise={balancePaise}
          totalSpentPaise={totalSpentPaise}
          sessionCount={orders?.length ?? 0}
          userId={user.id}
        />

        {/* ── Chat sessions ── */}
        {orders && orders.length > 0 && (
          <section>
            <div className="mb-3 flex items-center justify-between px-1">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Chat Sessions</p>
              <Link href="/astrologers/chats" className="flex items-center gap-0.5 text-[12px] font-semibold text-amber-600 hover:text-amber-700">
                View all <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
            <div className="space-y-2">
              {orders.map((o) => {
                const badge = statusBadge(o.status);
                const href  = o.status === "waiting_astrologer"
                  ? `/astrologers/chats/waiting/${o.id}`
                  : `/astrologers/chats/${o.id}`;
                return (
                  <Link
                    key={o.id}
                    href={href}
                    className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm transition hover:border-amber-200 hover:shadow-md active:scale-[0.99]"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-50">
                      <MessageCircle className="size-5 text-amber-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold text-gray-900">{astroName(o.astrologer_id)}</p>
                      <p className="font-mono text-[10px] text-gray-400">{o.order_code ?? "Order pending"}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${badge.cls}`}>
                        <span className={`size-1.5 rounded-full ${badge.dot}`} />
                        {badge.label}
                      </span>
                      <span className="text-[11px] font-semibold tabular-nums text-gray-400">
                        {(o.total_billed_paise ?? 0) > 0 ? formatInrFromPaisePrecise(o.total_billed_paise ?? 0) : "—"}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Activity ledger ── */}
        {ledgerRows && ledgerRows.length > 0 && (
          <section>
            <p className="mb-3 px-1 text-[11px] font-bold uppercase tracking-widest text-gray-400">Activity</p>
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-50">
              {ledgerRows.map((row) => {
                const isCredit = row.delta_paise >= 0;
                return (
                  <div key={row.id} className="flex items-center gap-3 px-4 py-3.5">
                    <div className={`flex size-9 shrink-0 items-center justify-center rounded-full ${isCredit ? "bg-emerald-50" : "bg-red-50"}`}>
                      {isCredit
                        ? <TrendingUp  className="size-4 text-emerald-600" />
                        : <TrendingDown className="size-4 text-red-500" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold capitalize text-gray-900">{ledgerLabel(row.reason)}</p>
                      <p className="text-[11px] text-gray-400">{relativeTime(row.created_at)}</p>
                    </div>
                    <p className={`text-[14px] font-bold tabular-nums ${isCredit ? "text-emerald-600" : "text-red-500"}`}>
                      {isCredit ? "+" : ""}
                      {formatInrFromPaisePrecise(row.delta_paise)}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Empty */}
        {!ledgerRows?.length && !orders?.length && (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <div className="flex size-20 items-center justify-center rounded-full bg-amber-50">
              <span className="text-3xl">💰</span>
            </div>
            <p className="text-[17px] font-semibold text-gray-900">No activity yet</p>
            <p className="text-[14px] text-gray-500">Start a chat and your transactions will appear here.</p>
          </div>
        )}

      </div>
    </div>
  );
}
