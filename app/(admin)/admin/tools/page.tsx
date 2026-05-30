import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { adminPath } from "@/lib/admin/admin-paths";
import { AdminTestOrderForm } from "@/components/admin/admin-test-order-form";
import { AdminMetaCapiTestPanel } from "@/components/admin/admin-meta-capi-test-panel";
import { PRODUCT_SLUGS } from "@/lib/constants/commerce";
import { getProductBySlug } from "@/lib/services/product";
import { getMetaCapiConfig } from "@/lib/meta/capi";
import { formatAdminDateTime } from "@/lib/admin/time";

export const dynamic = "force-dynamic";

export default async function AdminToolsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const supabase = createServiceClient();
  const product = await getProductBySlug(supabase, PRODUCT_SLUGS.PAID_KUNDLI);
  const defaultAmountRupees = product ? Math.round(Number(product.price) / 100) : 399;

  const flash =
    sp.test_order_status === "success" || sp.test_order_status === "failed"
      ? {
          kind: sp.test_order_status as "success" | "failed",
          message: sp.test_order_msg ?? "",
          orderId: sp.test_order_id,
        }
      : null;

  const metaCapiFlash =
    sp.meta_capi_status === "success" || sp.meta_capi_status === "failed"
      ? {
          kind: sp.meta_capi_status as "success" | "failed",
          message: sp.meta_capi_msg ?? "",
          detail: sp.meta_capi_detail,
        }
      : null;

  const metaConfig = getMetaCapiConfig();
  const { data: metaLogsRaw } = await supabase
    .from("integration_deliveries")
    .select("id,status,response_status,error_message,created_at,response_body")
    .eq("provider", "meta_capi")
    .order("created_at", { ascending: false })
    .limit(5);

  const recentMetaLogs = (metaLogsRaw ?? []).map((row) => ({
    id: row.id,
    status: row.status,
    response_status: row.response_status,
    error_message: row.error_message,
    created_at: formatAdminDateTime(row.created_at),
    response_body: row.response_body,
  }));

  return (
    <div className="space-y-8 font-sans admin-page-enter max-w-2xl">
      <div>
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-foreground">Tools</h1>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          Operational utilities for the commerce stack.
        </p>
      </div>

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-[15px] font-semibold text-foreground">Test Kundli order</h2>
        <p className="mt-1 text-[13px] text-muted-foreground leading-relaxed">
          Creates a full paid <strong className="font-medium text-foreground">paid-kundli</strong> order
          with customer, lead, birth details, and payment marked successful —{" "}
          <strong className="font-medium text-foreground">no Razorpay</strong>. Runs the same
          post-payment hooks as production: Interakt/WhatsApp, email, events, and optional Meta CAPI.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-[12px] text-muted-foreground">
          <li>Order is tagged <code className="rounded bg-muted px-1">[ADMIN TEST]</code> in notes</li>
          <li>Payment provider: <code className="rounded bg-muted px-1">admin_test</code></li>
          <li>Default funnel: <code className="rounded bg-muted px-1">/ads/kundli/new-checkout</code></li>
        </ul>
        <p className="mt-3 text-[12px] text-muted-foreground">
          View results in{" "}
          <Link href={adminPath("/orders?all_orders=1")} className="font-medium underline underline-offset-2">
            Orders
          </Link>
          .
        </p>

        <div className="mt-6 border-t border-border pt-6">
          <AdminTestOrderForm defaultAmountRupees={defaultAmountRupees} flash={flash} />
        </div>
      </section>

      <AdminMetaCapiTestPanel
        defaultTestEventCode={process.env.META_CAPI_TEST_EVENT_CODE?.trim() || "TEST88413"}
        configured={Boolean(metaConfig)}
        pixelId={metaConfig?.pixelId ?? null}
        recentLogs={recentMetaLogs}
        flash={metaCapiFlash}
      />
    </div>
  );
}
