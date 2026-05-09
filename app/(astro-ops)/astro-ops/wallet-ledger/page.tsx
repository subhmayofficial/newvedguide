import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { formatAdminDateTime } from "@/lib/admin/time";
import { checkLiveConsultSchema } from "@/lib/admin/live-consult";
import { LiveConsultSchemaMissing } from "@/components/admin/live-consult-schema-missing";
import { formatInrFromPaisePrecise } from "@/lib/format-money";
import { ArrowLeft, Clock, SlidersHorizontal, TrendingDown, TrendingUp, X } from "lucide-react";

export const dynamic = "force-dynamic";

const BASE = "/astro-ops/wallet-ledger";

const REASONS = [
  { value: "", label: "All reasons" },
  { value: "live_chat_meter",   label: "Chat charge" },
  { value: "live_chat_session", label: "Chat session" },
  { value: "test_topup",        label: "Test top-up" },
  { value: "wallet_recharge",   label: "Wallet recharge (Razorpay)" },
  { value: "admin_topup",       label: "Admin top-up" },
  { value: "admin_adjustment",  label: "Admin adjustment" },
];

function reasonLabel(reason: string): string {
  return REASONS.find((r) => r.value === reason)?.label ?? reason.replace(/_/g, " ");
}

function toDate(d: Date) { return d.toISOString().slice(0, 10); }

function buildUrl(overrides: Record<string, string | undefined>, current: Record<string, string | undefined>) {
  const p = new URLSearchParams();
  const merged = { ...current, ...overrides };
  for (const [k, v] of Object.entries(merged)) {
    if (v) p.set(k, v);
  }
  const qs = p.toString();
  return qs ? `${BASE}?${qs}` : BASE;
}

type SP = { from?: string; to?: string; type?: string; reason?: string };

export default async function LiveConsultWalletLedgerPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const supabase = createServiceClient();
  const schema = await checkLiveConsultSchema(supabase);
  if (!schema.ok) return <LiveConsultSchemaMissing message={schema.message} />;

  // Date presets (server-side, IST-agnostic — just YYYY-MM-DD boundaries)
  const now = new Date();
  const today     = toDate(now);
  const yesterday = toDate(new Date(now.getTime() - 86400000));
  const d7        = toDate(new Date(now.getTime() - 6 * 86400000));
  const d30       = toDate(new Date(now.getTime() - 29 * 86400000));

  // Build query
  let q = supabase
    .from("wallet_ledger")
    .select("id, user_id, delta_paise, reason, created_at")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (sp.from)   q = q.gte("created_at", `${sp.from}T00:00:00.000Z`);
  if (sp.to)     q = q.lte("created_at", `${sp.to}T23:59:59.999Z`);
  if (sp.type === "credits") q = q.gt("delta_paise", 0);
  if (sp.type === "debits")  q = q.lt("delta_paise", 0);
  if (sp.reason) q = q.eq("reason", sp.reason);

  const { data: rows, error } = await q;

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6 text-sm">
        Failed to load ledger: {error.message}
      </div>
    );
  }

  const list = rows ?? [];
  const credits  = list.filter((r) => r.delta_paise > 0);
  const debits   = list.filter((r) => r.delta_paise < 0);
  const totalIn  = credits.reduce((a, r) => a + r.delta_paise, 0);
  const totalOut = debits.reduce((a, r) => a + Math.abs(r.delta_paise), 0);
  const net      = totalIn - totalOut;

  const hasFilter = !!(sp.from || sp.to || sp.type || sp.reason);

  // Type pill helper
  const typePill = (value: string, label: string) => {
    const active = (sp.type ?? "") === value;
    return (
      <Link
        href={buildUrl({ type: value || undefined }, sp)}
        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition ${
          active
            ? "bg-foreground text-background shadow-sm"
            : "border border-border bg-card text-muted-foreground hover:border-brand/40 hover:text-foreground"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Live consult
          </p>
          <h1 className="mt-1 font-heading text-3xl font-bold">Wallet ledger</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {list.length} entr{list.length === 1 ? "y" : "ies"}
            {hasFilter && <span className="ml-1.5 rounded-full bg-brand/12 px-2 py-0.5 text-[10px] font-bold text-brand">filtered</span>}
          </p>
        </div>
        <Link
          href="/astro-ops"
          className="flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
        >
          <ArrowLeft className="size-4" /> Hub
        </Link>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          <SlidersHorizontal className="size-3.5" /> Filters
        </div>

        {/* Type pills */}
        <div className="flex flex-wrap gap-2">
          {typePill("", "All")}
          {typePill("credits", "Credits only")}
          {typePill("debits", "Debits only")}
        </div>

        {/* Date + reason row */}
        <form method="GET" className="flex flex-wrap items-end gap-2">
          {sp.type   && <input type="hidden" name="type"   value={sp.type} />}

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">From</label>
            <input
              type="date"
              name="from"
              defaultValue={sp.from ?? ""}
              className="h-8 rounded-lg border border-border bg-background px-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">To</label>
            <input
              type="date"
              name="to"
              defaultValue={sp.to ?? ""}
              className="h-8 rounded-lg border border-border bg-background px-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Reason</label>
            <select
              name="reason"
              defaultValue={sp.reason ?? ""}
              className="h-8 rounded-lg border border-border bg-background px-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/30"
            >
              {REASONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="h-8 rounded-lg bg-foreground px-4 text-xs font-bold text-background transition hover:opacity-80"
          >
            Apply
          </button>
          {hasFilter && (
            <Link
              href={BASE}
              className="flex h-8 items-center gap-1 rounded-lg border border-border px-3 text-xs font-semibold text-muted-foreground transition hover:bg-muted"
            >
              <X className="size-3" /> Clear
            </Link>
          )}
        </form>

        {/* Date preset chips */}
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground self-center mr-1">Quick:</span>
          {[
            { label: "Today",     from: today,     to: today },
            { label: "Yesterday", from: yesterday, to: yesterday },
            { label: "Last 7 days",  from: d7,   to: today },
            { label: "Last 30 days", from: d30,  to: today },
          ].map((preset) => {
            const active = sp.from === preset.from && sp.to === preset.to;
            return (
              <Link
                key={preset.label}
                href={buildUrl({ from: preset.from, to: preset.to }, sp)}
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition ${
                  active
                    ? "bg-brand text-white"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {preset.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/8 px-4 py-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/15">
            <TrendingUp className="size-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
              Total in · {credits.length}
            </p>
            <p className="text-sm font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
              +{formatInrFromPaisePrecise(totalIn)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/8 px-4 py-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-red-500/15">
            <TrendingDown className="size-4 text-red-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-red-600">
              Total out · {debits.length}
            </p>
            <p className="text-sm font-bold tabular-nums text-red-600">
              -{formatInrFromPaisePrecise(totalOut)}
            </p>
          </div>
        </div>
        <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
          net >= 0
            ? "border-emerald-500/20 bg-emerald-500/5"
            : "border-red-500/20 bg-red-500/5"
        }`}>
          <div className={`flex size-9 items-center justify-center rounded-xl ${
            net >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"
          }`}>
            {net >= 0
              ? <TrendingUp className="size-4 text-emerald-600 dark:text-emerald-400" />
              : <TrendingDown className="size-4 text-red-500" />}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              Net
            </p>
            <p className={`text-sm font-bold tabular-nums ${
              net >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-red-600"
            }`}>
              {net >= 0 ? "+" : ""}{formatInrFromPaisePrecise(net)}
            </p>
          </div>
        </div>
      </div>

      {/* Activity feed */}
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm divide-y divide-border/40">
        {list.length === 0 && (
          <p className="px-6 py-12 text-center text-sm text-muted-foreground">
            No entries {hasFilter ? "matching these filters" : "yet"}.
          </p>
        )}
        {list.map((row) => {
          const isCredit = row.delta_paise >= 0;
          return (
            <div key={row.id} className="flex items-center gap-4 px-5 py-3.5">
              <div className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
                isCredit ? "bg-emerald-500/10" : "bg-red-500/8"
              }`}>
                {isCredit
                  ? <TrendingUp className="size-4 text-emerald-600 dark:text-emerald-400" />
                  : <TrendingDown className="size-4 text-red-500" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold capitalize text-foreground">
                  {reasonLabel(row.reason)}
                </p>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                  <Link
                    href={`/astro-ops/users/${row.user_id}`}
                    className="font-mono text-[11px] text-muted-foreground hover:text-brand hover:underline"
                  >
                    {row.user_id.slice(0, 8)}…
                  </Link>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                    <Clock className="size-3" />
                    {formatAdminDateTime(row.created_at)}
                  </span>
                </div>
              </div>
              <span className={`shrink-0 text-sm font-bold tabular-nums ${
                isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"
              }`}>
                {isCredit ? "+" : ""}
                {formatInrFromPaisePrecise(row.delta_paise)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
