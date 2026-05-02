import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import {
  countLeadsByStatus,
  countOrdersKpis,
  defaultRange,
  ordersDaily,
} from "@/lib/admin/queries";
import { formatAdminDateTime } from "@/lib/admin/time";
import { OrderSlaCountdown } from "@/components/admin/order-sla-countdown";
import { orderHasFastTrackSla } from "@/lib/admin/order-sla-helpers";
import { OrdersRevenueBusinessChart } from "@/components/admin/orders-revenue-business-chart";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const range = sp.from && sp.to ? { from: sp.from, to: sp.to } : defaultRange();
  const supabase = createServiceClient();

  const [leadByStatus, orderKpis, recentLeads, recentOrders, recentEvents, od] =
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
        .select(
          "id,order_number,product_slug,status,total_amount,payment_status,fulfillment_status,created_at,customers(full_name,phone),order_items(product_slug)"
        )
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("events")
        .select("event_name,created_at,entry_path")
        .order("created_at", { ascending: false })
        .limit(12),
      ordersDaily(supabase, range),
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
  const aovRupees = orderKpis.paid > 0 ? revenueRupees / orderKpis.paid : 0;
  const paidShare =
    orderKpis.total > 0
      ? Math.round((orderKpis.paid / orderKpis.total) * 1000) / 10
      : 0;

  const last14Days = getLastNDays(14, range.to);
  const chartPoints = last14Days.map((day) => {
    const row = od[day];
    return {
      day,
      count: row?.count ?? 0,
      revenuePaise: row?.revenue ?? 0,
    };
  });

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
        <Stat label="Paid orders" value={String(orderKpis.paid)} href="/admindeoghar/orders?payment_status=paid" />
        <Stat label="Paid share %" value={`${paidShare}%`} href="/admindeoghar/orders" />
        <Stat label="Revenue (₹)" value={revenueRupees.toFixed(0)} href="/admindeoghar/analytics" />
        <Stat label="AOV (₹)" value={aovRupees.toFixed(0)} href="/admindeoghar/analytics" />
      </section>

      <section className="space-y-6">
        <OrdersRevenueBusinessChart points={chartPoints} />
        <div className="grid gap-4 md:grid-cols-3">
          <BusinessMetric
            title="Payment success rate"
            value={`${successRate}%`}
            subtitle="Paid vs pending payment orders"
          />
          <BusinessMetric
            title="Average order value"
            value={`₹${aovRupees.toFixed(0)}`}
            subtitle="Revenue divided by paid orders"
          />
          <BusinessMetric
            title="Total paid revenue"
            value={`₹${revenueRupees.toFixed(0)}`}
            subtitle={`${orderKpis.paid} paid orders in selected range`}
          />
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
            {(recentOrders.data as {
              order_number: string;
              product_slug: string;
              status: string;
              total_amount: string;
              payment_status: string;
              fulfillment_status: string;
              created_at: string;
              id: string;
              customers?: { full_name?: string | null; phone?: string | null } | null;
              order_items?: { product_slug: string }[] | null;
            }[] | null ?? []).map((row) => {
              const c = row.customers;
              const fastTrack = orderHasFastTrackSla(row.product_slug, row.order_items ?? null);
              return (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 py-3 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <Link href={`/admindeoghar/orders/${row.id}`} className="font-medium hover:underline">
                      {row.order_number}
                    </Link>
                    <p className="text-xs text-muted-foreground">{c?.full_name ?? "—"}</p>
                  </div>
                  <div className="shrink-0">
                    <OrderSlaCountdown
                      createdAtIso={row.created_at}
                      productSlug={row.product_slug}
                      fulfillmentStatus={row.fulfillment_status}
                      paymentStatus={row.payment_status}
                      orderStatus={row.status}
                      hasFastTrackAddon={fastTrack}
                      compact
                    />
                  </div>
                  <span className="shrink-0 text-xs font-medium tabular-nums">
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

function getLastNDays(n: number, toIso: string): string[] {
  const end = new Date(toIso);
  end.setHours(0, 0, 0, 0);
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(end);
    d.setDate(end.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
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

function BusinessMetric({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      <p className="font-heading mt-2 text-3xl font-semibold tabular-nums text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
    </div>
  );
}
