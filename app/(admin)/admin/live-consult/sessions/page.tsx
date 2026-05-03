import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { formatAdminDateTime } from "@/lib/admin/time";
import { checkLiveConsultSchema, astrologerLabel } from "@/lib/admin/live-consult";
import { LiveConsultSchemaMissing } from "@/components/admin/live-consult-schema-missing";
import { formatInrFromPaisePrecise } from "@/lib/format-money";
import { ArrowLeft, ArrowUpRight, Search, SlidersHorizontal, X } from "lucide-react";

export const dynamic = "force-dynamic";

const BASE = "/admindeoghar/live-consult/sessions";

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
    <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
      Done
    </span>
  );
}

type SP = { status?: string; from?: string; to?: string; q?: string };

export default async function LiveConsultSessionsPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const supabase = createServiceClient();
  const schema = await checkLiveConsultSchema(supabase);
  if (!schema.ok) return <LiveConsultSchemaMissing message={schema.message} />;

  const now = new Date();
  const today     = toDate(now);
  const yesterday = toDate(new Date(now.getTime() - 86400000));
  const d7        = toDate(new Date(now.getTime() - 6 * 86400000));
  const d30       = toDate(new Date(now.getTime() - 29 * 86400000));

  let query = supabase
    .from("chat_sessions")
    .select("id, user_id, astrologer_id, status, order_code, closed_at, total_billed_paise, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(500);

  if (sp.status === "open" || sp.status === "closed" || sp.status === "waiting_astrologer") {
    query = query.eq("status", sp.status);
  }
  if (sp.from) query = query.gte("created_at", `${sp.from}T00:00:00.000Z`);
  if (sp.to)   query = query.lte("created_at", `${sp.to}T23:59:59.999Z`);
  if (sp.q)    query = query.ilike("order_code", `%${sp.q}%`);

  const { data: sessions, error } = await query;

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6 text-sm">
        Failed to load sessions: {error.message}
      </div>
    );
  }

  const list = sessions ?? [];
  const waiting = list.filter((s) => s.status === "waiting_astrologer");
  const totalBilled = list.reduce((a, s) => a + (s.total_billed_paise ?? 0), 0);
  const hasFilter = !!(sp.from || sp.to || sp.q);

  // Status pill helper — preserves date/search filters
  const statusPill = (value: string | undefined, label: string) => {
    const active = (sp.status ?? "") === (value ?? "");
    const href = buildUrl({ status: value }, { from: sp.from, to: sp.to, q: sp.q });
    return (
      <Link
        href={href}
        className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
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
          <h1 className="mt-1 font-heading text-3xl font-bold">Chat sessions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {list.length} session{list.length !== 1 ? "s" : ""}
            {hasFilter && <span className="ml-1.5 rounded-full bg-brand/12 px-2 py-0.5 text-[10px] font-bold text-brand">filtered</span>}
          </p>
        </div>
        <Link href="/admindeoghar/live-consult" className="flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
          <ArrowLeft className="size-4" /> Hub
        </Link>
      </div>

      {/* Waiting alert — only when no status filter is active */}
      {waiting.length > 0 && !sp.status && (
        <Link
          href={buildUrl({ status: "waiting_astrologer" }, { from: sp.from, to: sp.to, q: sp.q })}
          className="flex items-center gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/8 px-5 py-3.5 transition hover:bg-amber-500/12"
        >
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-75" />
            <span className="relative size-2 rounded-full bg-amber-500" />
          </span>
          <p className="flex-1 text-sm font-semibold text-amber-900 dark:text-amber-200">
            {waiting.length} session{waiting.length !== 1 ? "s" : ""} waiting for astrologer
          </p>
          <ArrowUpRight className="size-4 text-amber-700 dark:text-amber-300" />
        </Link>
      )}

      {/* Status pills */}
      <div className="flex flex-wrap gap-2">
        {statusPill(undefined, "All")}
        {statusPill("waiting_astrologer", "Waiting")}
        {statusPill("open", "Live")}
        {statusPill("closed", "Closed")}
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          <SlidersHorizontal className="size-3.5" /> Filters
        </div>

        <form method="GET" className="flex flex-wrap items-end gap-2">
          {/* Preserve status pill selection */}
          {sp.status && <input type="hidden" name="status" value={sp.status} />}

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
            <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Order code</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                name="q"
                placeholder="e.g. VG-001"
                defaultValue={sp.q ?? ""}
                className="h-8 rounded-lg border border-border bg-background pl-7 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
            </div>
          </div>
          <button
            type="submit"
            className="h-8 rounded-lg bg-foreground px-4 text-xs font-bold text-background transition hover:opacity-80"
          >
            Apply
          </button>
          {hasFilter && (
            <Link
              href={sp.status ? `${BASE}?status=${sp.status}` : BASE}
              className="flex h-8 items-center gap-1 rounded-lg border border-border px-3 text-xs font-semibold text-muted-foreground transition hover:bg-muted"
            >
              <X className="size-3" /> Clear
            </Link>
          )}
        </form>

        {/* Date presets */}
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground self-center mr-1">Quick:</span>
          {[
            { label: "Today",        from: today,     to: today },
            { label: "Yesterday",    from: yesterday, to: yesterday },
            { label: "Last 7 days",  from: d7,        to: today },
            { label: "Last 30 days", from: d30,       to: today },
          ].map((preset) => {
            const active = sp.from === preset.from && sp.to === preset.to;
            return (
              <Link
                key={preset.label}
                href={buildUrl({ from: preset.from, to: preset.to }, { status: sp.status, q: sp.q })}
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

      {/* Summary stat — billed total when a filter is active */}
      {(hasFilter || sp.status) && totalBilled > 0 && (
        <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card px-5 py-3 shadow-sm">
          <p className="flex-1 text-sm text-muted-foreground">
            Total billed across <span className="font-bold text-foreground">{list.length}</span> session{list.length !== 1 ? "s" : ""}
          </p>
          <p className="text-sm font-bold tabular-nums text-foreground">
            {formatInrFromPaisePrecise(totalBilled)}
          </p>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card shadow-sm">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/40">
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Order</th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Astrologer</th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">User</th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Billed</th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Created</th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Updated</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {list.map((s) => (
              <tr
                key={s.id}
                className={`transition hover:bg-muted/25 ${
                  s.status === "waiting_astrologer" ? "bg-amber-500/5" : ""
                }`}
              >
                <td className="px-4 py-3 font-mono text-[11px] font-semibold text-foreground">
                  {s.order_code ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admindeoghar/live-consult/inbox?sid=${encodeURIComponent(s.id)}`}
                    className="font-semibold text-foreground hover:text-brand hover:underline"
                  >
                    {astrologerLabel(s.astrologer_id)}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admindeoghar/live-consult/users/${s.user_id}`}
                    className="font-mono text-xs text-muted-foreground hover:text-brand hover:underline"
                  >
                    {s.user_id.slice(0, 8)}…
                  </Link>
                </td>
                <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                <td className="px-4 py-3 tabular-nums text-muted-foreground">
                  {(s.total_billed_paise ?? 0) > 0 || s.status === "closed"
                    ? formatInrFromPaisePrecise(s.total_billed_paise ?? 0)
                    : "—"}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                  {formatAdminDateTime(s.created_at)}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                  {formatAdminDateTime(s.updated_at)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admindeoghar/live-consult/sessions/${s.id}`}
                    className="inline-flex items-center gap-0.5 text-xs font-bold text-brand hover:underline"
                  >
                    Open <ArrowUpRight className="size-3" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && (
          <p className="px-6 py-12 text-center text-sm text-muted-foreground">
            No sessions {hasFilter || sp.status ? "matching these filters" : "found"}.
          </p>
        )}
      </div>
    </div>
  );
}
