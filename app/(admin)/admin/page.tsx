import Link from "next/link";
import { cn } from "@/lib/utils";
import { createServiceClient } from "@/lib/supabase/server";
import {
  countLeadsByStatus,
  countOrdersKpis,
  defaultRange,
  eventCountsByName,
  leadsDaily,
  ordersDaily,
  sourceBreakdown,
} from "@/lib/admin/queries";
import { formatAdminDateTime } from "@/lib/admin/time";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const range = sp.from && sp.to ? { from: sp.from, to: sp.to } : defaultRange();
  const supabase = createServiceClient();

  const [leadByStatus, orderKpis, recentLeads, recentOrders, recentEvents, kfpEvents, dsEvents, ld, od, src] =
    await Promise.all([
      countLeadsByStatus(supabase, range),
      countOrdersKpis(supabase, range),
      supabase
        .from("leads")
        .select("id,status,lead_type,journey_stage,created_at,customers(full_name,phone)")
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("orders")
        .select("id,order_number,total_amount,payment_status,created_at,customers(full_name,phone)")
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("events")
        .select("event_name,created_at,entry_path")
        .order("created_at", { ascending: false })
        .limit(12),
      eventCountsByName(
        supabase,
        [
          "home_page_view",
          "free_kundli_start",
          "free_kundli_submit",
          "free_kundli_result_view",
          "sales_page_view",
          "checkout_page_view",
          "payment_initiated",
          "payment_success",
          "thank_you_view",
        ],
        range
      ),
      eventCountsByName(
        supabase,
        [
          "home_page_view",
          "sales_page_view",
          "checkout_page_view",
          "payment_initiated",
          "payment_success",
          "thank_you_view",
        ],
        range
      ),
      leadsDaily(supabase, range),
      ordersDaily(supabase, range),
      sourceBreakdown(supabase, range),
    ]);

  const totalLeads = Object.values(leadByStatus).reduce((a, b) => a + b, 0);
  const qualified =
    (leadByStatus["qualified"] ?? 0) + (leadByStatus["new"] ?? 0);
  const converted = leadByStatus["converted"] ?? 0;
  const lost = leadByStatus["lost"] ?? 0;

  const successRate =
    orderKpis.paid + orderKpis.pending > 0
      ? Math.round(
          (orderKpis.paid / (orderKpis.paid + orderKpis.pending)) * 1000
        ) / 10
      : 0;

  const revenueRupees = orderKpis.revenue / 100;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          VedGuide operations — {range.from.slice(0, 10)} to {range.to.slice(0, 10)}
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
        <Stat label="Total leads" value={String(totalLeads)} href="/admindeoghar/leads" />
        <Stat label="Qualified" value={String(qualified)} href="/admindeoghar/leads?status=qualified" />
        <Stat label="Converted" value={String(converted)} href="/admindeoghar/leads?status=converted" />
        <Stat label="Lost" value={String(lost)} href="/admindeoghar/leads?status=lost" />
        <Stat label="Orders" value={String(orderKpis.total)} href="/admindeoghar/orders" />
        <Stat label="Paid orders" value={String(orderKpis.paid)} href="/admindeoghar/orders?payment_status=paid" />
        <Stat label="Revenue (₹)" value={revenueRupees.toFixed(0)} href="/admindeoghar/analytics" />
        <Stat label="Payment success %" value={`${successRate}%`} href="/admindeoghar/analytics" />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold">KFP funnel (preview)</h2>
            <Link
              href="/admindeoghar/analytics/funnels/kfp"
              className="text-sm font-medium text-brand hover:underline"
            >
              Open funnel
            </Link>
          </div>
          <FunnelMini counts={kfpEvents} />
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold">Direct sales path</h2>
            <Link href="/admindeoghar/analytics" className="text-sm font-medium text-brand hover:underline">
              Analytics
            </Link>
          </div>
          <FunnelMini counts={dsEvents} labels={["home_page_view", "sales_page_view", "checkout_page_view", "payment_initiated", "payment_success", "thank_you_view"]} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Trend title="Leads / day" byDay={ld} color="bg-brand/80" mode="leads" />
        <Trend title="Orders / day" byDay={od} mode="orders" />
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <h2 className="font-heading mb-4 text-lg font-semibold">Top entry paths</h2>
          <ul className="space-y-2 text-sm">
            {Object.entries(src.entryPath)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 6)
              .map(([k, v]) => (
                <li key={k} className="flex justify-between gap-4">
                  <span className="truncate text-muted-foreground">{k}</span>
                  <span className="font-medium tabular-nums">{v}</span>
                </li>
              ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold">Recent leads</h2>
            <Link href="/admindeoghar/leads" className="text-sm font-medium text-brand hover:underline">
              View all
            </Link>
          </div>
          <ul className="divide-y divide-border/50">
            {(recentLeads.data as {
              id: string;
              status: string;
              customers?: { full_name?: string | null; phone?: string | null } | null;
            }[] | null ?? []).map((row) => {
              const c = row.customers;
              return (
                <li key={row.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div>
                    <Link href={`/admindeoghar/leads/${row.id}`} className="font-medium hover:underline">
                      {c?.full_name ?? "—"}
                    </Link>
                    <p className="text-xs text-muted-foreground">{c?.phone ?? "—"}</p>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium">
                    {row.status}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold">Recent orders</h2>
            <Link href="/admindeoghar/orders" className="text-sm font-medium text-brand hover:underline">
              View all
            </Link>
          </div>
          <ul className="divide-y divide-border/50">
            {(recentOrders.data as { order_number: string; total_amount: string; payment_status: string; created_at: string; id: string; customers?: { full_name?: string | null; phone?: string | null } | null }[] | null ?? []).map((row) => {
              const c = row.customers;
              return (
                <li key={row.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div>
                    <Link href={`/admindeoghar/orders/${row.id}`} className="font-medium hover:underline">
                      {row.order_number}
                    </Link>
                    <p className="text-xs text-muted-foreground">{c?.full_name ?? "—"}</p>
                  </div>
                  <span className="text-xs font-medium tabular-nums">
                    ₹{(Number(row.total_amount) / 100).toFixed(0)} · {row.payment_status}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <h2 className="font-heading mb-4 text-lg font-semibold">Recent activity</h2>
        <ul className="space-y-2 text-sm">
          {(recentEvents.data ?? []).map((e) => (
            <li key={e.created_at + e.event_name} className="flex flex-wrap gap-2 border-b border-border/40 py-2 last:border-0">
              <span className="font-medium">{e.event_name}</span>
              <span className="text-muted-foreground">
                {formatAdminDateTime(e.created_at)}
              </span>
              {e.entry_path && (
                <span className="rounded bg-muted px-1.5 py-0.5 text-[11px]">{e.entry_path}</span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-heading text-3xl font-bold tabular-nums text-foreground">{value}</p>
    </Link>
  );
}

function FunnelMini({
  counts,
  labels,
}: {
  counts: Record<string, number>;
  labels?: string[];
}) {
  const keys = labels ?? Object.keys(counts);
  const max = Math.max(1, ...keys.map((k) => counts[k] ?? 0));
  return (
    <div className="space-y-3">
      {keys.map((k) => {
        const v = counts[k] ?? 0;
        const w = Math.round((v / max) * 100);
        return (
          <div key={k}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="truncate text-muted-foreground">{k}</span>
              <span className="tabular-nums font-medium">{v}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-brand/80 transition-all"
                style={{ width: `${w}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Trend({
  title,
  byDay,
  color = "bg-emerald-600/80",
  mode = "leads",
}: {
  title: string;
  byDay: Record<string, number | { count: number; revenue: number }>;
  color?: string;
  mode?: "leads" | "orders";
}) {
  const days = Object.keys(byDay).sort();
  const last14 = days.slice(-14);
  const vals = last14.map((d) => {
    const v = byDay[d];
    if (mode === "orders" && v && typeof v === "object") return v.count;
    return typeof v === "number" ? v : 0;
  });
  const max = Math.max(1, ...vals);
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
      <h2 className="font-heading mb-4 text-lg font-semibold">{title}</h2>
      <div className="flex h-28 items-end gap-1">
        {last14.map((d, i) => (
          <div key={d} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={cn("w-full min-h-[4px] rounded-t", color)}
              style={{ height: `${(vals[i]! / max) * 100}%` }}
            />
            <span className="text-[9px] text-muted-foreground">{d.slice(5)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
