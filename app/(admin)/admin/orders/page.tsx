import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import {
  AdminOrderRowAssigneeSelect,
  AdminOrderRowFulfillmentSelect,
} from "@/components/admin/admin-order-row-controls";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const supabase = createServiceClient();

  let q = supabase
    .from("orders")
    .select(
      "id,order_number,product_slug,total_amount,status,payment_status,fulfillment_status,fulfillment_assignee,entry_path,created_at,coupon_applied,coupon_code,customers(full_name,phone)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .limit(150);

  if (sp.status) q = q.eq("status", sp.status);
  if (sp.payment_status) q = q.eq("payment_status", sp.payment_status);
  if (sp.fulfillment_status) q = q.eq("fulfillment_status", sp.fulfillment_status);
  if (sp.product) q = q.eq("product_slug", sp.product);
  if (sp.entry_path) q = q.eq("entry_path", sp.entry_path);

  const { data: rowsRaw, error } = await q;

  type OrderRow = {
    id: string;
    order_number: string;
    product_slug: string;
    total_amount: string;
    status: string;
    payment_status: string;
    fulfillment_status: string;
    fulfillment_assignee: string | null;
    entry_path: string | null;
    coupon_applied: boolean;
    coupon_code: string | null;
    created_at: string;
    customers: { full_name?: string | null; phone?: string | null } | null;
  };

  const rows = rowsRaw as OrderRow[] | null;

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/40 p-6 text-sm">
        {error.message}
      </div>
    );
  }

  const filtered =
    sp.q && rows
      ? rows.filter((r) => {
          const term = sp.q!.toLowerCase();
          const c = r.customers as { full_name?: string | null; phone?: string | null } | null;
          return (
            r.order_number.toLowerCase().includes(term) ||
            (c?.full_name?.toLowerCase().includes(term) ?? false) ||
            (c?.phone?.includes(term) ?? false)
          );
        })
      : rows;

  const stats = {
    total: rows?.length ?? 0,
    pending: rows?.filter((r) => r.status === "pending_payment").length ?? 0,
    paid: rows?.filter((r) => r.payment_status === "paid").length ?? 0,
    processing: rows?.filter((r) => r.status === "processing").length ?? 0,
    fulfilled: rows?.filter((r) => r.fulfillment_status === "delivered").length ?? 0,
    refunded: rows?.filter((r) => r.status === "refunded").length ?? 0,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold">Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">Commerce records (created at payment initiation)</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {[
          ["Total", stats.total],
          ["Pending pay", stats.pending],
          ["Paid", stats.paid],
          ["Processing", stats.processing],
          ["Fulfilled", stats.fulfilled],
          ["Refunded", stats.refunded],
        ].map(([a, b]) => (
          <div key={a} className="rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{a}</p>
            <p className="font-heading text-2xl font-bold tabular-nums">{b}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border/60 bg-muted/30 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Fulfillment</th>
              <th className="px-4 py-3">Assigned to</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Entry</th>
              <th className="px-4 py-3">Coupon</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {(filtered ?? []).map((r) => {
              const c = r.customers as { full_name?: string | null; phone?: string | null } | null;
              return (
                <tr key={r.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-mono text-xs font-medium">
                    <Link href={`/admindeoghar/orders/${r.id}`} className="hover:underline">
                      {r.order_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div>{c?.full_name ?? "—"}</div>
                    <div className="text-[11px] text-muted-foreground">{c?.phone ?? ""}</div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium">{formatAdminProductLabel(r.product_slug)}</p>
                    <p className="text-[10px] text-muted-foreground">{r.product_slug}</p>
                  </td>
                  <td className="px-4 py-3 tabular-nums">₹{(Number(r.total_amount) / 100).toFixed(0)}</td>
                  <td className="px-4 py-3 text-xs">{r.payment_status}</td>
                  <td className="px-4 py-3 align-top">
                    <AdminOrderRowFulfillmentSelect
                      orderId={r.id}
                      fulfillmentStatus={r.fulfillment_status}
                    />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <AdminOrderRowAssigneeSelect
                      orderId={r.id}
                      assignee={r.fulfillment_assignee}
                    />
                  </td>
                  <td className="px-4 py-3 text-xs">{r.status}</td>
                  <td className="px-4 py-3 text-xs">{r.entry_path ?? "—"}</td>
                  <td className="px-4 py-3 text-xs">
                    {r.coupon_applied ? r.coupon_code ?? "used" : "no"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admindeoghar/orders/${r.id}`} className="text-sm font-medium text-brand hover:underline">
                      Open
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!filtered?.length && (
          <p className="p-8 text-center text-sm text-muted-foreground">No orders.</p>
        )}
      </div>
    </div>
  );
}

function formatAdminProductLabel(slug: string): string {
  if (slug === "paid-kundli") return "Paid Kundli Report";
  if (slug === "fast-track-addon") return "FastTrack Add-on";
  if (slug === "consultation-15min") return "Consultation · 15 Min";
  if (slug === "consultation-45min") return "Consultation · 45 Min";
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
