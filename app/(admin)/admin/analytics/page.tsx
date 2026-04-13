import Link from "next/link";
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

export const dynamic = "force-dynamic";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; entry_path?: string }>;
}) {
  const sp = await searchParams;
  const range = sp.from && sp.to ? { from: sp.from, to: sp.to } : defaultRange();
  const supabase = createServiceClient();

  const [leadByStatus, orderKpis, kfp, ds, ld, od, src] = await Promise.all([
    countLeadsByStatus(supabase, range),
    countOrdersKpis(supabase, range),
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
  const revenue = orderKpis.revenue / 100;
  const sr =
    orderKpis.paid + orderKpis.pending > 0
      ? Math.round((orderKpis.paid / (orderKpis.paid + orderKpis.pending)) * 1000) / 10
      : 0;

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Internal events as source of truth · {range.from.slice(0, 10)} → {range.to.slice(0, 10)}
          </p>
        </div>
        <Link
          href="/admindeoghar/analytics/funnels/kfp"
          className="text-sm font-medium text-brand hover:underline"
        >
          KFP funnel detail →
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Total leads", totalLeads],
          ["Qualified-ish", (leadByStatus["qualified"] ?? 0) + (leadByStatus["new"] ?? 0)],
          ["Converted", leadByStatus["converted"] ?? 0],
          ["Orders", orderKpis.total],
          ["Paid orders", orderKpis.paid],
          ["Revenue ₹", revenue.toFixed(0)],
          ["Success %", `${sr}%`],
        ].map(([a, b]) => (
          <div key={a} className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{a}</p>
            <p className="mt-2 font-heading text-2xl font-bold tabular-nums">{b}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <h2 className="font-heading text-lg font-semibold">KFP preview</h2>
          <MiniFunnel counts={kfp} />
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <h2 className="font-heading text-lg font-semibold">Direct sales preview</h2>
          <MiniFunnel
            counts={ds}
            keys={[
              "home_page_view",
              "sales_page_view",
              "checkout_page_view",
              "payment_initiated",
              "payment_success",
              "thank_you_view",
            ]}
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <h2 className="font-heading mb-4 text-lg font-semibold">Leads by day</h2>
          <Bars data={ld} mode="leads" />
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <h2 className="font-heading mb-4 text-lg font-semibold">Orders & revenue by day</h2>
          <Bars data={od} mode="orders" />
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-6">
        <h2 className="font-heading mb-4 text-lg font-semibold">Source breakdown</h2>
        <div className="grid gap-6 md:grid-cols-2 text-sm">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Entry path</p>
            <ul className="space-y-1">
              {Object.entries(src.entryPath)
                .sort((a, b) => b[1] - a[1])
                .map(([k, v]) => (
                  <li key={k} className="flex justify-between gap-4">
                    <span className="truncate text-muted-foreground">{k}</span>
                    <span className="tabular-nums font-medium">{v}</span>
                  </li>
                ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">UTM source</p>
            <ul className="space-y-1">
              {Object.entries(src.utmSource)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 12)
                .map(([k, v]) => (
                  <li key={k} className="flex justify-between gap-4">
                    <span className="truncate text-muted-foreground">{k}</span>
                    <span className="tabular-nums font-medium">{v}</span>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

function MiniFunnel({
  counts,
  keys,
}: {
  counts: Record<string, number>;
  keys?: string[];
}) {
  const k = keys ?? Object.keys(counts);
  const max = Math.max(1, ...k.map((x) => counts[x] ?? 0));
  return (
    <ul className="mt-4 space-y-2 text-sm">
      {k.map((name) => {
        const v = counts[name] ?? 0;
        const w = Math.round((v / max) * 100);
        return (
          <li key={name}>
            <div className="mb-0.5 flex justify-between text-xs">
              <span className="truncate text-muted-foreground">{name}</span>
              <span className="tabular-nums font-medium">{v}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-brand/80" style={{ width: `${w}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function Bars({
  data,
  mode,
}: {
  data: Record<string, number | { count: number; revenue: number }>;
  mode: "leads" | "orders";
}) {
  const days = Object.keys(data).sort().slice(-14);
  const vals = days.map((d) => {
    const v = data[d];
    if (mode === "orders" && v && typeof v === "object") return v.count;
    return typeof v === "number" ? v : 0;
  });
  const max = Math.max(1, ...vals);
  return (
    <div className="flex h-32 items-end gap-1">
      {days.map((d, i) => (
        <div key={d} className="flex flex-1 flex-col items-center gap-1">
          <div
            className="w-full min-h-[4px] rounded-t bg-emerald-600/80"
            style={{ height: `${(vals[i]! / max) * 100}%` }}
          />
          <span className="text-[9px] text-muted-foreground">{d.slice(5)}</span>
        </div>
      ))}
    </div>
  );
}
