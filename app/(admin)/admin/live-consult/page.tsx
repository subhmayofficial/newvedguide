import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { formatAdminDateTime } from "@/lib/admin/time";
import { checkLiveConsultSchema, astrologerLabel } from "@/lib/admin/live-consult";
import { LiveConsultSchemaMissing } from "@/components/admin/live-consult-schema-missing";
import { formatInrFromPaise } from "@/lib/format-money";
import {
  ArrowUpRight,
  Clock,
  MessageCircle,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from "lucide-react";

export const dynamic = "force-dynamic";

function statusBadge(status: string) {
  if (status === "open")
    return { label: "Live", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500 animate-pulse" };
  if (status === "waiting_astrologer")
    return { label: "Waiting · join", cls: "bg-amber-500/15 text-amber-800 dark:text-amber-200", dot: "bg-amber-400 animate-pulse" };
  return { label: status, cls: "bg-muted/60 text-muted-foreground", dot: "bg-muted-foreground/40" };
}

export default async function LiveConsultHubPage() {
  const supabase = createServiceClient();
  const schema = await checkLiveConsultSchema(supabase);
  if (!schema.ok) return <LiveConsultSchemaMissing message={schema.message} />;

  const [
    { count: userCount },
    { count: sessionCount },
    { count: openSessions },
    { count: waitingSessions },
    { data: recentSessions },
    { data: recentLedger },
  ] = await Promise.all([
    supabase.from("user_profiles").select("id", { count: "exact", head: true }),
    supabase.from("chat_sessions").select("id", { count: "exact", head: true }),
    supabase.from("chat_sessions").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("chat_sessions").select("id", { count: "exact", head: true }).eq("status", "waiting_astrologer"),
    supabase.from("chat_sessions").select("id, user_id, astrologer_id, status, order_code, updated_at").order("updated_at", { ascending: false }).limit(10),
    supabase.from("wallet_ledger").select("id, user_id, delta_paise, reason, created_at").order("created_at", { ascending: false }).limit(8),
  ]);

  const statCards = [
    { icon: Users, label: "Registered users", value: userCount ?? 0, href: "/admindeoghar/live-consult/users", color: "text-brand", bg: "bg-brand/10" },
    { icon: MessageCircle, label: "Total sessions", value: sessionCount ?? 0, href: "/admindeoghar/live-consult/sessions", color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-500/10" },
    { icon: Zap, label: "Live now", value: openSessions ?? 0, href: "/admindeoghar/live-consult/sessions?status=open", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
    { icon: Clock, label: "Awaiting join", value: waitingSessions ?? 0, href: "/admindeoghar/live-consult/sessions?status=waiting_astrologer", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" },
  ];

  const quickLinks = [
    { href: "/admindeoghar/live-consult/inbox", label: "Chat inbox", desc: "Reply to sessions in one place" },
    { href: "/admindeoghar/live-consult/users", label: "End users", desc: "Profiles, wallet, activity" },
    { href: "/admindeoghar/live-consult/sessions", label: "All sessions", desc: "Full session table" },
    { href: "/admindeoghar/live-consult/wallet-ledger", label: "Wallet ledger", desc: "Top-ups and charges" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Live consult
        </p>
        <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight">Hub</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Real-time wallet, sessions and user management
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition hover:border-brand/30 hover:shadow-md"
          >
            <div className={`mb-3 flex size-10 items-center justify-center rounded-xl ${s.bg}`}>
              <s.icon className={`size-5 ${s.color}`} />
            </div>
            <p className="font-heading text-3xl font-bold tabular-nums">{s.value}</p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {s.label}
            </p>
          </Link>
        ))}
      </div>

      {/* Alert if waiting sessions */}
      {(waitingSessions ?? 0) > 0 && (
        <Link
          href="/admindeoghar/live-consult/sessions?status=waiting_astrologer"
          className="flex items-center gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/8 px-5 py-4 transition hover:bg-amber-500/12"
        >
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-amber-500" />
          </span>
          <p className="flex-1 text-sm font-semibold text-amber-900 dark:text-amber-200">
            {waitingSessions} session{waitingSessions !== 1 ? "s" : ""} waiting for astrologer to join
          </p>
          <ArrowUpRight className="size-4 text-amber-700 dark:text-amber-300" />
        </Link>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent sessions */}
        <div className="lg:col-span-2 rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
            <h2 className="font-heading text-base font-semibold">Recent sessions</h2>
            <Link href="/admindeoghar/live-consult/sessions" className="flex items-center gap-1 text-xs font-semibold text-brand hover:underline">
              View all <ArrowUpRight className="size-3" />
            </Link>
          </div>
          <div className="divide-y divide-border/40">
            {(recentSessions ?? []).length === 0 ? (
              <p className="px-5 py-8 text-sm text-muted-foreground">No sessions yet.</p>
            ) : (
              (recentSessions ?? []).map((s) => {
                const badge = statusBadge(s.status);
                return (
                  <Link
                    key={s.id}
                    href={`/admindeoghar/live-consult/inbox?sid=${encodeURIComponent(s.id)}`}
                    className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-muted/30"
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand/8">
                      <MessageCircle className="size-4 text-brand" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {astrologerLabel(s.astrologer_id)}
                      </p>
                      <p className="font-mono text-[10px] text-muted-foreground/70">
                        {s.order_code ?? s.id.slice(0, 8) + "…"}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${badge.cls}`}>
                        <span className={`size-1.5 rounded-full ${badge.dot}`} />
                        {badge.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{formatAdminDateTime(s.updated_at)}</span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Right column: quick links + recent ledger */}
        <div className="space-y-4">
          {/* Quick links */}
          <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
            <div className="border-b border-border/50 px-5 py-4">
              <h2 className="font-heading text-base font-semibold">Quick links</h2>
            </div>
            <div className="divide-y divide-border/40">
              {quickLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="flex items-center justify-between px-5 py-3 transition hover:bg-muted/30"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">{l.label}</p>
                    <p className="text-[11px] text-muted-foreground">{l.desc}</p>
                  </div>
                  <ArrowUpRight className="size-4 shrink-0 text-muted-foreground/50" />
                </Link>
              ))}
            </div>
          </div>

          {/* Recent ledger */}
          <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
              <h2 className="font-heading text-base font-semibold">Wallet activity</h2>
              <Link href="/admindeoghar/live-consult/wallet-ledger" className="flex items-center gap-1 text-xs font-semibold text-brand hover:underline">
                Full ledger <ArrowUpRight className="size-3" />
              </Link>
            </div>
            <div className="divide-y divide-border/40">
              {(recentLedger ?? []).length === 0 ? (
                <p className="px-5 py-6 text-sm text-muted-foreground">No activity yet.</p>
              ) : (
                (recentLedger ?? []).map((row) => {
                  const isCredit = row.delta_paise >= 0;
                  return (
                    <div key={row.id} className="flex items-center gap-3 px-5 py-3">
                      <div className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${isCredit ? "bg-emerald-500/10" : "bg-red-500/8"}`}>
                        {isCredit
                          ? <TrendingUp className="size-3.5 text-emerald-600" />
                          : <TrendingDown className="size-3.5 text-red-500" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link href={`/admindeoghar/live-consult/users/${row.user_id}`} className="font-mono text-[11px] text-muted-foreground hover:underline">
                          {row.user_id.slice(0, 8)}…
                        </Link>
                        <p className="text-[10px] text-muted-foreground/70 capitalize">{row.reason.replace(/_/g, " ")}</p>
                      </div>
                      <span className={`text-xs font-bold tabular-nums ${isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                        {isCredit ? "+" : ""}{formatInrFromPaise(row.delta_paise)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
