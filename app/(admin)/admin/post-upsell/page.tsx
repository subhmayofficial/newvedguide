import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { formatAdminDateTime } from "@/lib/admin/time";
import { OrderPostUpsellControls } from "@/components/admin/order-post-upsell-controls";
import { PostUpsellMessageTemplates } from "@/components/admin/post-upsell-message-templates";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  order_number: string;
  product_slug: string;
  created_at: string;
  fulfillment_status: string;
  customers: { full_name: string | null; phone: string | null } | null;
  admin_order_post_upsell:
    | {
        flow_started_at: string | null;
        kundli_points: string | null;
        status: string | null;
        message_1_sent_at: string | null;
        message_2_sent_at: string | null;
      }[]
    | null;
};

export default async function AdminPostUpsellPage() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id,order_number,product_slug,created_at,fulfillment_status,customers(full_name,phone),admin_order_post_upsell(flow_started_at,kundli_points,status,message_1_sent_at,message_2_sent_at)"
    )
    .eq("payment_status", "paid")
    .order("created_at", { ascending: false })
    .limit(150);

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
        {error.message}
      </div>
    );
  }

  const rows = (data ?? []) as unknown as Row[];
  const { data: templateRow } = await supabase
    .from("admin_post_upsell_settings")
    .select("message_1_template,message_2_template")
    .eq("id", 1)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-foreground">Post Upsell</h1>
          <p className="text-[13px] text-muted-foreground">
            Flow: Mark delivered → Step 1 add points (timer starts) → Message 1 after 6h → Message 2 after 24h from msg 1
          </p>
        </div>
        <Link
          href="/admindeoghar/orders"
          className="inline-flex h-9 items-center rounded-md border border-border bg-card px-3 text-[12px] font-semibold text-foreground"
        >
          Back to orders
        </Link>
      </div>

      <PostUpsellMessageTemplates
        initialMessage1={templateRow?.message_1_template ?? ""}
        initialMessage2={templateRow?.message_2_template ?? ""}
      />

      <div className="space-y-3">
        {rows.map((row) => {
          const customer = row.customers;
          const upsell = row.admin_order_post_upsell?.[0] ?? null;
          return (
            <div key={row.id} className="rounded-xl border border-border bg-card">
              {/* Order header */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-border/60 px-4 py-2.5">
                <Link
                  href={`/admindeoghar/orders/${row.id}`}
                  className="font-mono text-[12px] font-semibold text-foreground hover:underline"
                >
                  {row.order_number}
                </Link>
                <span className="text-[11px] text-muted-foreground">{formatAdminDateTime(row.created_at)}</span>
                <span className="text-[11px] font-medium text-foreground">{customer?.full_name ?? "—"}</span>
                <span className="font-mono text-[11px] text-muted-foreground">{customer?.phone ?? "—"}</span>
                <span className="text-[11px] text-muted-foreground">{row.product_slug}</span>
                <span
                  className={`ml-auto rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    row.fulfillment_status === "delivered"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "border-border bg-muted/40 text-muted-foreground"
                  }`}
                >
                  {row.fulfillment_status}
                </span>
              </div>
              {/* Flow controls */}
              <div className="px-4 py-3">
                <OrderPostUpsellControls
                  orderId={row.id}
                  fulfillmentStatus={row.fulfillment_status}
                  initialPoints={upsell?.kundli_points ?? ""}
                  initialStatus={upsell?.status ?? "pending"}
                  initialFlowStartedAt={upsell?.flow_started_at ?? null}
                  initialMessage1SentAt={upsell?.message_1_sent_at ?? null}
                  initialMessage2SentAt={upsell?.message_2_sent_at ?? null}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
