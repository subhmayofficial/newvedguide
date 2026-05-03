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
  () =>
    import("@/components/astrologers/wallet-balance-card").then(
      (m) => m.WalletBalanceCard
    ),
  {
    loading: () => (
      <div className="w-full max-w-2xl space-y-3">
        <EngagingRouteProgress ariaLabel="Loading wallet card" />
        <div className="h-48 w-full animate-pulse rounded-3xl bg-muted/50" />
      </div>
    ),
  }
);

export const metadata: Metadata = {
  title: "Wallet",
  description: "Balance, chat orders, and wallet activity on VedGuide.",
};

function astroName(id: string): string {
  return LIVE_CHAT_ASTROLOGERS.find((a) => a.id === id)?.name ?? id;
}

function ledgerLabel(reason: string): string {
  switch (reason) {
    case "live_chat_meter":    return "Chat charge";
    case "live_chat_session":  return "Chat session";
    case "test_topup":         return "Wallet top-up";
    default: return reason.replace(/_/g, " ");
  }
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function statusBadge(status: string) {
  if (status === "open") return { label: "Live", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" };
  if (status === "waiting_astrologer") return { label: "Waiting", cls: "bg-amber-500/15 text-amber-800 dark:text-amber-200" };
  return { label: "Done", cls: "bg-muted/80 text-muted-foreground" };
}

export default async function AstrologersWalletPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/astrologers/wallet");

  const [{ data: profile }, { data: ledgerRows }, { data: orders }] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("wallet_balance_paise")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("wallet_ledger")
      .select("id, delta_paise, reason, metadata, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(60),
    supabase
      .from("chat_sessions")
      .select("id, order_code, status, astrologer_id, updated_at, total_billed_paise")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(20),
  ]);
  const balancePaise = profile?.wallet_balance_paise ?? 0;

  const totalSpentPaise = (ledgerRows ?? [])
    .filter((r) => r.delta_paise < 0)
    .reduce((acc, r) => acc + Math.abs(r.delta_paise), 0);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link
            href="/user"
            className="flex items-center justify-center rounded-xl p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="font-heading text-lg font-bold">Wallet</h1>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-5 px-4 py-5">
        {/* ── Animated balance card (client component) ── */}
        <WalletBalanceCard
          balancePaise={balancePaise}
          totalSpentPaise={totalSpentPaise}
          sessionCount={orders?.length ?? 0}
          userId={user.id}
        />

        {/* ── Chat orders ── */}
        {orders && orders.length > 0 && (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Chat Sessions
              </p>
              <Link
                href="/astrologers/chats"
                className="flex items-center gap-0.5 text-xs font-semibold text-brand hover:underline"
              >
                View all <ArrowUpRight className="size-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {orders.map((o, i) => {
                const badge = statusBadge(o.status);
                const href = o.status === "waiting_astrologer"
                  ? `/astrologers/chats/waiting/${o.id}`
                  : `/astrologers/chats/${o.id}`;
                return (
                  <Link
                    key={o.id}
                    href={href}
                    className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3.5 shadow-sm transition hover:border-brand/30 hover:shadow-md active:scale-[0.99]"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/8">
                      <MessageCircle className="size-5 text-brand" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {astroName(o.astrologer_id)}
                      </p>
                      <p className="font-mono text-[10px] text-muted-foreground/60">
                        {o.order_code ?? "Order pending"}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${badge.cls}`}>
                        {badge.label}
                      </span>
                      <span className="text-[11px] font-semibold tabular-nums text-muted-foreground">
                        {(o.total_billed_paise ?? 0) > 0
                          ? formatInrFromPaisePrecise(o.total_billed_paise ?? 0)
                          : "—"}
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
            <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Activity
            </p>
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-card divide-y divide-border/40">
              {ledgerRows.map((row) => {
                const isCredit = row.delta_paise >= 0;
                return (
                  <div key={row.id} className="flex items-center gap-3 px-4 py-3.5">
                    <div
                      className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
                        isCredit ? "bg-emerald-500/10" : "bg-red-500/8"
                      }`}
                    >
                      {isCredit
                        ? <TrendingUp className="size-4 text-emerald-600 dark:text-emerald-400" />
                        : <TrendingDown className="size-4 text-red-500" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold capitalize text-foreground">
                        {ledgerLabel(row.reason)}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {relativeTime(row.created_at)}
                      </p>
                    </div>
                    <p
                      className={`text-[14px] font-bold tabular-nums ${
                        isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"
                      }`}
                    >
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
        {(!ledgerRows?.length) && (!orders?.length) && (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-brand/8">
              <span className="text-2xl">💰</span>
            </div>
            <p className="font-heading text-lg font-semibold">No activity yet</p>
            <p className="text-sm text-muted-foreground">
              Start a chat session and your transactions will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
