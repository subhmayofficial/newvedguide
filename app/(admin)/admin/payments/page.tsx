import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  const supabase = createServiceClient();
  const { data: rowsRaw } = await supabase
    .from("payments")
    .select(
      "id,order_id,amount,status,provider,payment_method,paid_at,created_at,provider_order_id,provider_payment_id,orders(id,order_number,customers(full_name,phone))"
    )
    .order("created_at", { ascending: false })
    .limit(150);

  type PayRow = {
    id: string;
    order_id: string;
    amount: string;
    status: string;
    provider: string;
    payment_method: string | null;
    paid_at: string | null;
    created_at: string;
    provider_order_id: string | null;
    provider_payment_id: string | null;
    orders: {
      id: string;
      order_number: string;
      customers: { full_name?: string | null; phone?: string | null } | null;
    } | null;
  };

  const rows = rowsRaw as PayRow[] | null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold">Payments</h1>
        <p className="mt-1 text-sm text-muted-foreground">Reconciliation and debugging</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/30 text-[11px] font-semibold uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Provider</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Paid</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((p) => {
              const o = p.orders as {
                id?: string;
                order_number?: string;
                customers?: { full_name?: string | null; phone?: string | null };
              } | null;
              return (
                <tr key={p.id} className="border-b border-border/40">
                  <td className="px-4 py-3 font-mono text-xs">{p.id.slice(0, 8)}…</td>
                  <td className="px-4 py-3">
                    {o?.order_number && o?.id ? (
                      <Link href={`/admindeoghar/orders/${o.id}`} className="hover:underline">
                        {o.order_number}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {o?.customers?.full_name ?? "—"}
                    <br />
                    <span className="text-muted-foreground">{o?.customers?.phone ?? ""}</span>
                  </td>
                  <td className="px-4 py-3 tabular-nums">₹{(Number(p.amount) / 100).toFixed(2)}</td>
                  <td className="px-4 py-3 text-xs">{p.provider}</td>
                  <td className="px-4 py-3 text-xs">{p.status}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {p.paid_at ? new Date(p.paid_at).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <details>
                      <summary className="cursor-pointer text-brand">Raw</summary>
                      <pre className="mt-2 max-h-40 overflow-auto rounded bg-muted/50 p-2 text-[10px]">
                        {JSON.stringify(p, null, 2)}
                      </pre>
                    </details>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
