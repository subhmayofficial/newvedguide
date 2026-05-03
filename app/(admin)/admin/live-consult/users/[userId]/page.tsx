import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { formatAdminDateTime } from "@/lib/admin/time";
import { checkLiveConsultSchema, astrologerLabel } from "@/lib/admin/live-consult";
import { LiveConsultSchemaMissing } from "@/components/admin/live-consult-schema-missing";
import { formatInrFromPaise, formatInrFromPaisePrecise } from "@/lib/format-money";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Clock,
  MessageCircle,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ userId: string }> };

function StatusBadge({ status }: { status: string }) {
  if (status === "open")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/12 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Live
      </span>
    );
  if (status === "waiting_astrologer")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/12 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-200">
        <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
        Waiting
      </span>
    );
  return (
    <span className="inline-flex items-center rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
      Done
    </span>
  );
}

export default async function LiveConsultUserDetailPage({ params }: Props) {
  const { userId } = await params;
  const supabase = createServiceClient();
  const schema = await checkLiveConsultSchema(supabase);
  if (!schema.ok) return <LiveConsultSchemaMissing message={schema.message} />;

  const { data: profile, error: pErr } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (pErr || !profile) notFound();

  const { data: authUser } = await supabase.auth.admin.getUserById(userId);

  const [ledgerRes, sessionsRes] = await Promise.all([
    supabase
      .from("wallet_ledger")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("chat_sessions")
      .select("id, astrologer_id, status, order_code, created_at, updated_at, total_billed_paise")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
  ]);

  const email = authUser?.user?.email ?? "—";
  const lastSignIn = authUser?.user?.last_sign_in_at;
  const sessions = sessionsRes.data ?? [];
  const ledger = ledgerRes.data ?? [];

  const totalSpentPaise = ledger
    .filter((r) => r.delta_paise < 0)
    .reduce((acc, r) => acc + Math.abs(r.delta_paise), 0);

  const initials = profile.display_name
    ? profile.display_name.trim().split(/\s+/).map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : userId.slice(0, 2).toUpperCase();

  const hue = (userId.charCodeAt(0) + userId.charCodeAt(1)) % 360;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className="flex size-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-md"
            style={{ background: `oklch(0.50 0.18 ${hue})` }}
          >
            {initials}
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Live consult · User
            </p>
            <h1 className="mt-0.5 font-heading text-2xl font-bold">
              {profile.display_name ?? "Unnamed user"}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{email}</p>
          </div>
        </div>
        <Link
          href="/admindeoghar/live-consult/users"
          className="flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
        >
          <ArrowLeft className="size-4" /> All users
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <div className="mb-3 flex size-9 items-center justify-center rounded-xl bg-brand/10">
            <Wallet className="size-4 text-brand" />
          </div>
          <p className="font-heading text-2xl font-bold tabular-nums">
            {formatInrFromPaise(profile.wallet_balance_paise)}
          </p>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Wallet balance
          </p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <div className="mb-3 flex size-9 items-center justify-center rounded-xl bg-indigo-500/10">
            <MessageCircle className="size-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="font-heading text-2xl font-bold tabular-nums">{sessions.length}</p>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Chat sessions
          </p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <div className="mb-3 flex size-9 items-center justify-center rounded-xl bg-red-500/10">
            <TrendingDown className="size-4 text-red-500" />
          </div>
          <p className="font-heading text-2xl font-bold tabular-nums">
            {formatInrFromPaise(totalSpentPaise)}
          </p>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Total spent
          </p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <div className="mb-3 flex size-9 items-center justify-center rounded-xl bg-muted/60">
            <CalendarDays className="size-4 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground">
            {lastSignIn ? formatAdminDateTime(lastSignIn) : "Never"}
          </p>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Last sign-in
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Joined {formatAdminDateTime(profile.created_at)}
          </p>
        </div>
      </div>

      {/* Chat sessions */}
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
          <h2 className="font-heading text-base font-semibold">Chat sessions</h2>
          <span className="rounded-full bg-muted/60 px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
            {sessions.length}
          </span>
        </div>
        <div className="divide-y divide-border/40">
          {sessions.length === 0 ? (
            <p className="px-5 py-8 text-sm text-muted-foreground">No sessions yet.</p>
          ) : (
            sessions.map((s) => (
              <div key={s.id} className="flex items-center gap-3 px-5 py-3.5">
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
                  <StatusBadge status={s.status} />
                  {(s.total_billed_paise ?? 0) > 0 && (
                    <span className="text-[11px] font-semibold tabular-nums text-muted-foreground">
                      {formatInrFromPaisePrecise(s.total_billed_paise ?? 0)}
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {formatAdminDateTime(s.updated_at)}
                  </span>
                </div>
                <Link
                  href={`/admindeoghar/live-consult/sessions/${s.id}`}
                  className="ml-2 flex shrink-0 items-center gap-0.5 text-xs font-bold text-brand hover:underline"
                >
                  Open <ArrowUpRight className="size-3" />
                </Link>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Wallet activity */}
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
          <h2 className="font-heading text-base font-semibold">Wallet activity</h2>
          <span className="rounded-full bg-muted/60 px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
            {ledger.length}
          </span>
        </div>
        <div className="divide-y divide-border/40">
          {ledger.length === 0 ? (
            <p className="px-5 py-8 text-sm text-muted-foreground">No wallet activity.</p>
          ) : (
            ledger.map((row) => {
              const isCredit = row.delta_paise >= 0;
              return (
                <div key={row.id} className="flex items-center gap-3 px-5 py-3.5">
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
                      {row.reason.replace(/_/g, " ")}
                    </p>
                    <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="size-3" />
                      {formatAdminDateTime(row.created_at)}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-bold tabular-nums ${
                      isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"
                    }`}
                  >
                    {isCredit ? "+" : ""}
                    {formatInrFromPaisePrecise(row.delta_paise)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
