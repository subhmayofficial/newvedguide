import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WalletTopupLauncher } from "@/components/astrologers/wallet-topup-launcher";
import { LIVE_CHAT_ASTROLOGERS } from "@/lib/data/live-chat-astrologers";
import { formatInrFromPaisePrecise } from "@/lib/format-money";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Wallet",
  description: "Balance, chat orders, and wallet activity on VedGuide.",
};

function astroName(id: string): string {
  return LIVE_CHAT_ASTROLOGERS.find((a) => a.id === id)?.name ?? id;
}

function ledgerReasonLabel(reason: string): string {
  switch (reason) {
    case "live_chat_meter":
      return "Live chat (per minute)";
    case "test_topup":
      return "Test top-up";
    default:
      return reason.replace(/_/g, " ");
  }
}

export default async function AstrologersWalletPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/astrologers/wallet");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("wallet_balance_paise")
    .eq("id", user.id)
    .maybeSingle();

  const balancePaise = profile?.wallet_balance_paise ?? 0;

  const { data: ledgerRows } = await supabase
    .from("wallet_ledger")
    .select("id, delta_paise, reason, metadata, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(80);

  const { data: orders } = await supabase
    .from("chat_sessions")
    .select(
      "id, order_code, status, astrologer_id, rate_inr_per_min, created_at, closed_at, updated_at, total_billed_paise"
    )
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(40);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Wallet
          </p>
          <h1 className="font-heading text-3xl font-semibold">Your wallet</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Each live chat is an order with its own code and total. Credits and chat charges appear
            in activity below.
          </p>
        </div>
        <Link
          href="/astrologers/chats"
          className="text-sm font-medium text-brand hover:underline"
        >
          My chats →
        </Link>
      </div>

      <Card className="mt-8 border-brand/20 bg-gradient-to-br from-brand-light/30 via-card to-card">
        <CardHeader className="border-b border-border/60 pb-4">
          <CardTitle className="text-2xl tabular-nums">
            {formatInrFromPaisePrecise(balancePaise)}
          </CardTitle>
          <CardDescription>Available balance (test top-up in non-production)</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <WalletTopupLauncher
            userId={user.id}
            isLoggedIn={!!user}
            initialBalancePaise={balancePaise}
          />
        </CardContent>
      </Card>

      <section className="mt-10">
        <h2 className="font-heading text-xl font-semibold">Chat orders</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          One row per consultation session — same records admins see as orders.
        </p>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-border/80 bg-card shadow-sm">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/40">
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Astrologer</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Billed</th>
                <th className="px-4 py-3 font-semibold">Updated</th>
                <th className="px-4 py-3 font-semibold" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {orders?.length ? (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-mono text-xs font-medium text-foreground">
                      {o.order_code ?? "—"}
                    </td>
                    <td className="px-4 py-3">{astroName(o.astrologer_id)}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          o.status === "open"
                            ? "default"
                            : o.status === "waiting_astrologer"
                              ? "outline"
                              : "secondary"
                        }
                        className={
                          o.status === "waiting_astrologer"
                            ? "border-amber-500/60 bg-amber-500/10 font-semibold text-amber-950 dark:text-amber-100"
                            : undefined
                        }
                      >
                        {o.status === "waiting_astrologer"
                          ? "Waiting"
                          : o.status === "open"
                            ? "Live"
                            : o.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">
                      {o.status === "closed" || (o.total_billed_paise ?? 0) > 0
                        ? formatInrFromPaisePrecise(o.total_billed_paise ?? 0)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(o.updated_at).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={
                          o.status === "waiting_astrologer"
                            ? `/astrologers/chats/waiting/${o.id}`
                            : `/astrologers/chats/${o.id}`
                        }
                        className="text-xs font-semibold text-brand hover:underline"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No chat sessions yet. Start from the{" "}
                    <Link href="/astrologers" className="font-medium text-brand hover:underline">
                      directory
                    </Link>
                    .
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-heading text-xl font-semibold">Activity</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ledger entries: credits and per-minute chat deductions.
        </p>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-border/80 bg-card shadow-sm">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/40">
                <th className="px-4 py-3 font-semibold">When</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {ledgerRows?.length ? (
                ledgerRows.map((row) => {
                  const meta = row.metadata as { session_id?: string } | null;
                  const sessionHint =
                    row.reason === "live_chat_meter" && meta?.session_id
                      ? ` · session ${String(meta.session_id).slice(0, 8)}…`
                      : "";
                  return (
                    <tr key={row.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(row.created_at).toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {ledgerReasonLabel(row.reason)}
                        <span className="text-[11px] text-muted-foreground/80">{sessionHint}</span>
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-medium tabular-nums ${
                          row.delta_paise >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-destructive"
                        }`}
                      >
                        {row.delta_paise >= 0 ? "+" : ""}
                        {formatInrFromPaisePrecise(row.delta_paise)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No activity yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
