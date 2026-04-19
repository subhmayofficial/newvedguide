import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import {
  AdminOrderRowAssigneeSelect,
  AdminOrderRowFulfillmentSelect,
} from "@/components/admin/admin-order-row-controls";
import { getBunnyCdnSettings } from "@/lib/admin/bunny-cdn-settings";
import { OrderDeliverButton } from "@/components/admin/order-deliver-button";
import { OrderSlaCountdown } from "@/components/admin/order-sla-countdown";
import { orderHasFastTrackSla } from "@/lib/admin/order-sla-helpers";
import { formatAdminDateTime } from "@/lib/admin/time";
import {
  ENTRY_PATH,
  FULFILLMENT_STATUS,
  ORDER_STATUS,
  PAYMENT_STATUS_ORDER,
} from "@/lib/constants/commerce";
import { Zap, ArrowUpRight } from "lucide-react";

export const dynamic = "force-dynamic";

// ─── Types ────────────────────────────────────────────────────────────────

type OrderRow = {
  id: string;
  order_number: string;
  product_slug: string;
  consultation_type: string | null;
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
  order_items?: { product_slug: string }[] | null;
};

type RowKind = "failed" | "cancelled" | "fasttrack" | "normal";

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const supabase = createServiceClient();
  const bunnySettings = await getBunnyCdnSettings(supabase);
  const bunnyUploadReady =
    bunnySettings.storage_zone_name.trim() !== "" &&
    bunnySettings.cdn_public_base_url.trim() !== "";

  const showAllPaymentStatuses = sp.all_orders === "1";

  let q = supabase
    .from("orders")
    .select(
      "id,order_number,product_slug,consultation_type,total_amount,status,payment_status,fulfillment_status,fulfillment_assignee,entry_path,created_at,coupon_applied,coupon_code,customers(full_name,phone),order_items(product_slug)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .limit(150);

  if (sp.status)              q = q.eq("status", sp.status);
  if (sp.payment_status)      q = q.eq("payment_status", sp.payment_status);
  else if (!showAllPaymentStatuses) {
    q = q.eq("payment_status", "paid");
  }
  if (sp.fulfillment_status)  q = q.eq("fulfillment_status", sp.fulfillment_status);
  if (sp.product)             q = q.eq("product_slug", sp.product);
  if (sp.entry_path)          q = q.eq("entry_path", sp.entry_path);
  if (sp.consultation_type)   q = q.eq("consultation_type", sp.consultation_type);

  const { data: rowsRaw, error } = await q;
  const rows = rowsRaw as OrderRow[] | null;

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-400">
        {error.message}
      </div>
    );
  }

  // Client-side text search
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

  // Stats
  const total      = rows?.length ?? 0;
  const paid       = rows?.filter((r) => r.payment_status === "paid").length ?? 0;
  const processing = rows?.filter((r) => r.status === "processing").length ?? 0;
  const fulfilled  = rows?.filter((r) => r.fulfillment_status === "delivered").length ?? 0;
  const failed     = rows?.filter((r) => r.payment_status === "failed" || r.status === "cancelled").length ?? 0;
  const fasttrack =
    rows?.filter((r) => orderHasFastTrackSla(r.product_slug, r.order_items ?? null)).length ?? 0;

  const hasFilters = !!(
    sp.q ||
      sp.status ||
      sp.payment_status ||
      sp.fulfillment_status ||
      sp.product ||
      sp.entry_path ||
      sp.consultation_type ||
      showAllPaymentStatuses
  );

  const paymentSelectDefault =
    sp.payment_status !== undefined && sp.payment_status !== ""
      ? sp.payment_status
      : showAllPaymentStatuses
        ? ""
        : "paid";

  const deliveryFlash =
    sp.delivery_status === "success" || sp.delivery_status === "failed"
      ? {
          kind: sp.delivery_status as "success" | "failed",
          message: sp.delivery_msg ?? "",
        }
      : null;

  return (
    <div className="space-y-7 font-sans admin-page-enter">

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-foreground">
            Orders
          </h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            {showAllPaymentStatuses
              ? "All payment statuses · latest 150 · newest first"
              : "Paid orders only · latest 150 · newest first"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {showAllPaymentStatuses ? (
            <Link
              href={buildOrdersListHref(sp, { all_orders: null })}
              className="inline-flex h-9 items-center rounded-md border border-border bg-card px-3 text-[12px] font-semibold text-foreground transition-colors hover:bg-muted/50"
            >
              Paid orders only
            </Link>
          ) : (
            <Link
              href={buildOrdersListHref(sp, { all_orders: "1" })}
              className="inline-flex h-9 items-center rounded-md border border-amber-500/40 bg-amber-500/10 px-3 text-[12px] font-semibold text-amber-950 transition-colors hover:bg-amber-500/18 dark:text-amber-100"
            >
              Show all orders (failed, pending, …)
            </Link>
          )}
          {hasFilters && (
            <Link
              href="/admindeoghar/orders"
              className="inline-flex h-9 items-center rounded-md border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Clear filters
            </Link>
          )}
        </div>
      </div>

      {deliveryFlash && (
        <div
          className={
            deliveryFlash.kind === "success"
              ? "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/25 dark:text-emerald-300"
              : "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/25 dark:text-red-300"
          }
        >
          <p className="font-semibold">
            {deliveryFlash.kind === "success" ? "Delivery WhatsApp sent" : "Delivery WhatsApp failed"}
          </p>
          {deliveryFlash.message ? (
            <p className="mt-1 text-xs opacity-90">{deliveryFlash.message}</p>
          ) : null}
          <p className="mt-2">
            <Link
              href={ordersHrefWithoutDeliveryFlash(sp)}
              className="text-xs font-medium underline underline-offset-2 hover:opacity-80"
            >
              Dismiss
            </Link>
          </p>
        </div>
      )}

      {/* ── Stats ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 lg:grid-cols-6">
        <StatCard label="Total"     value={total}      />
        <StatCard label="Paid"      value={paid}       accent="emerald" />
        <StatCard label="Processing" value={processing} accent="blue" />
        <StatCard label="Fulfilled" value={fulfilled}  accent="emerald" />
        <StatCard label="Failed"    value={failed}     accent="red" />
        <StatCard label="FastTrack" value={fasttrack}  accent="amber" />
      </div>

      {/* ── Quick filters ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 mr-1">
          Quick
        </span>
        <QuickChip
          href="/admindeoghar/orders?payment_status=failed"
          label="Failed payments"
          active={sp.payment_status === "failed" && !sp.status}
        />
        <QuickChip
          href="/admindeoghar/orders?status=cancelled"
          label="Cancelled"
          active={sp.status === "cancelled"}
        />
        <QuickChip
          href="/admindeoghar/orders?product=fast-track-addon"
          label="⚡ FastTrack only"
          active={sp.product === "fast-track-addon"}
        />
        <QuickChip
          href="/admindeoghar/orders?payment_status=paid&fulfillment_status=unfulfilled"
          label="Paid · pending fulfillment"
          active={sp.payment_status === "paid" && sp.fulfillment_status === "unfulfilled"}
        />
        <QuickChip
          href="/admindeoghar/orders?payment_status=pending"
          label="Awaiting payment"
          active={sp.payment_status === "pending" && !sp.status}
        />
      </div>

      {/* ── Filters ──────────────────────────────────────────────────── */}
      <form method="get" className="rounded-xl border border-border bg-card p-5">
        {showAllPaymentStatuses ? <input type="hidden" name="all_orders" value="1" /> : null}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {/* Search */}
          <div className="xl:col-span-2">
            <FilterLabel>Search</FilterLabel>
            <input
              name="q"
              defaultValue={sp.q ?? ""}
              placeholder="Order #, name, phone…"
              className="mt-1.5 h-9 w-full rounded-md border border-border bg-background px-3 text-[13px] text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-ring/50 focus:border-ring/50 transition-colors"
            />
          </div>

          <div>
            <FilterLabel>Order status</FilterLabel>
            <FilterSelect name="status" defaultValue={sp.status ?? ""}>
              <option value="">All statuses</option>
              {Object.values(ORDER_STATUS).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </FilterSelect>
          </div>

          <div>
            <FilterLabel>Payment</FilterLabel>
            <FilterSelect name="payment_status" defaultValue={paymentSelectDefault}>
              <option value="">All</option>
              {Object.values(PAYMENT_STATUS_ORDER).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </FilterSelect>
          </div>

          <div>
            <FilterLabel>Fulfillment</FilterLabel>
            <FilterSelect name="fulfillment_status" defaultValue={sp.fulfillment_status ?? ""}>
              <option value="">All</option>
              {Object.values(FULFILLMENT_STATUS).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </FilterSelect>
          </div>

          <div>
            <FilterLabel>Product</FilterLabel>
            <FilterSelect name="product" defaultValue={sp.product ?? ""}>
              <option value="">All</option>
              <option value="paid-kundli">Paid Kundli</option>
              <option value="consultation-15min">Consult · 15m</option>
              <option value="consultation-45min">Consult · 45m</option>
              <option value="fast-track-addon">FastTrack Add-on</option>
            </FilterSelect>
          </div>

          <div>
            <FilterLabel>Entry path</FilterLabel>
            <FilterSelect name="entry_path" defaultValue={sp.entry_path ?? ""}>
              <option value="">All</option>
              <option value={ENTRY_PATH.KFP}>{ENTRY_PATH.KFP}</option>
              <option value="funnel2">funnel2</option>
              <option value={ENTRY_PATH.DIRECT_SALES}>{ENTRY_PATH.DIRECT_SALES}</option>
              <option value={ENTRY_PATH.MANUAL}>{ENTRY_PATH.MANUAL}</option>
              <option value="name_letter_a">name_letter_a</option>
            </FilterSelect>
          </div>
        </div>

        <div className="mt-3 flex items-end justify-between gap-3">
          <div className="w-48">
            <FilterLabel>Consultation mode</FilterLabel>
            <FilterSelect name="consultation_type" defaultValue={sp.consultation_type ?? ""}>
              <option value="">All</option>
              <option value="chat">Chat</option>
              <option value="call">Call</option>
              <option value="video_call">Video Call</option>
            </FilterSelect>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admindeoghar/orders"
              className="inline-flex h-9 items-center rounded-md border border-border px-4 text-[13px] font-medium text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
            >
              Reset
            </Link>
            <button
              type="submit"
              className="inline-flex h-9 items-center rounded-md bg-foreground px-4 text-[13px] font-semibold text-background transition-opacity hover:opacity-80"
            >
              Apply filters
            </button>
          </div>
        </div>
      </form>

      {/* ── Legend + count ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-muted-foreground">
          <span className="font-semibold tabular-nums text-foreground">
            {filtered?.length ?? 0}
          </span>{" "}
          {hasFilters ? "filtered" : "total"} orders
        </p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-[3px] w-4 rounded-full bg-red-500" />
            Failed / Cancelled
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-[3px] w-4 rounded-full bg-gradient-to-r from-amber-300 to-amber-500" />
            FastTrack ⚡
          </span>
          <span className="text-[10px]">
            SLA: 48h from order time, or 12h when FastTrack is on the order (including add-on on paid kundli).
          </span>
        </div>
      </div>

      {/* ── Orders table ─────────────────────────────────────────────── */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border">
              {/* accent bar header */}
              <th className="w-[3px] p-0" />
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground whitespace-nowrap">Order</th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground whitespace-nowrap">
                SLA timer
              </th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Customer</th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Product</th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Mode</th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Amount</th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Payment</th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Fulfillment</th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Assigned</th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Entry</th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Coupon</th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground text-right whitespace-nowrap">
                Deliver / open
              </th>
            </tr>
          </thead>
          <tbody>
            {(filtered ?? []).map((r, idx) => {
              const c = r.customers as { full_name?: string | null; phone?: string | null } | null;
              const kind = getRowKind(r);
              const isLast = idx === (filtered?.length ?? 0) - 1;
              const phoneDigits = (c?.phone ?? "").replace(/\D/g, "");
              const canDeliverKundli =
                r.payment_status === "paid" &&
                r.product_slug === "paid-kundli" &&
                phoneDigits.length >= 10;
              const defaultCustomerName = (c?.full_name ?? "").trim() || "Customer";
              const fastTrackOrder = orderHasFastTrackSla(r.product_slug, r.order_items ?? null);

              return (
                <tr
                  key={r.id}
                  className={`${ROW_CLASS[kind]} admin-row-in${!isLast ? " border-b border-border/60" : ""}`}
                  style={{ animationDelay: `${Math.min(idx * 18, 280)}ms` }}
                >
                  {/* Left accent bar */}
                  <td className="w-[3px] p-0">
                    <div className={ACCENT_BAR[kind]} />
                  </td>

                  {/* Order # + date */}
                  <td className="px-4 py-3.5 align-top">
                    <Link
                      href={`/admindeoghar/orders/${r.id}`}
                      className="block font-mono text-[12px] font-semibold text-foreground hover:underline underline-offset-2"
                    >
                      {r.order_number}
                    </Link>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground whitespace-nowrap">
                      {formatAdminDateTime(r.created_at)}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 align-top whitespace-nowrap">
                    <OrderSlaCountdown
                      createdAtIso={r.created_at}
                      productSlug={r.product_slug}
                      fulfillmentStatus={r.fulfillment_status}
                      paymentStatus={r.payment_status}
                      orderStatus={r.status}
                      hasFastTrackAddon={fastTrackOrder}
                    />
                  </td>

                  {/* Customer */}
                  <td className="px-4 py-3.5 align-top">
                    <div className="text-[13px] font-medium text-foreground leading-tight">
                      {c?.full_name ?? <span className="text-muted-foreground/50">—</span>}
                    </div>
                    {c?.phone && (
                      <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                        {c.phone}
                      </div>
                    )}
                  </td>

                  {/* Product */}
                  <td className="px-4 py-3.5 align-top">
                    <div className="flex items-start gap-1.5">
                      {fastTrackOrder && (
                        <span
                          className="mt-[1px] flex shrink-0 items-center justify-center rounded-[4px] bg-amber-400/15 p-[3px]"
                          title="FastTrack (12h SLA)"
                        >
                          <Zap size={10} className="fill-amber-500 text-amber-500" />
                        </span>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] font-medium text-foreground leading-tight">
                            {productLabel(r.product_slug)}
                          </span>
                          {fastTrackOrder && (
                            <span className="rounded-[4px] border border-amber-300/60 bg-amber-50 px-1 py-px text-[9px] font-bold uppercase tracking-wider text-amber-600 dark:border-amber-700/40 dark:bg-amber-950/30 dark:text-amber-400">
                              Fast
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 font-mono text-[10px] text-muted-foreground/60">
                          {r.product_slug}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Consultation mode */}
                  <td className="px-4 py-3.5 align-top">
                    <span className="text-[12px] text-muted-foreground">
                      {consultationLabel(r.product_slug, r.consultation_type)}
                    </span>
                  </td>

                  {/* Amount */}
                  <td className="px-4 py-3.5 align-top">
                    <span className="font-mono text-[13px] font-semibold text-foreground tabular-nums">
                      ₹{(Number(r.total_amount) / 100).toFixed(0)}
                    </span>
                  </td>

                  {/* Payment status */}
                  <td className="px-4 py-3.5 align-top">
                    <StatusPill value={r.payment_status} kind="payment" />
                  </td>

                  {/* Fulfillment select */}
                  <td className="px-4 py-3.5 align-top">
                    <AdminOrderRowFulfillmentSelect
                      orderId={r.id}
                      fulfillmentStatus={r.fulfillment_status}
                    />
                  </td>

                  {/* Assignee select */}
                  <td className="px-4 py-3.5 align-top">
                    <AdminOrderRowAssigneeSelect
                      orderId={r.id}
                      assignee={r.fulfillment_assignee}
                    />
                  </td>

                  {/* Entry path */}
                  <td className="px-4 py-3.5 align-top">
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {r.entry_path ?? "—"}
                    </span>
                  </td>

                  {/* Coupon */}
                  <td className="px-4 py-3.5 align-top">
                    {r.coupon_applied ? (
                      <span className="font-mono text-[11px] text-foreground/70">
                        {r.coupon_code ?? "used"}
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground/30">—</span>
                    )}
                  </td>

                  {/* Deliver + open */}
                  <td className="px-4 py-3.5 align-top text-right">
                    <div className="inline-flex items-center justify-end gap-1.5">
                      <OrderDeliverButton
                        orderId={r.id}
                        orderNumber={r.order_number}
                        defaultCustomerName={defaultCustomerName}
                        phone={c?.phone ?? null}
                        canDeliver={canDeliverKundli}
                        bunnyReady={bunnyUploadReady}
                      />
                      <Link
                        href={`/admindeoghar/orders/${r.id}`}
                        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        title="Open order"
                      >
                        <ArrowUpRight size={14} />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {!filtered?.length && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-[13px] font-medium text-foreground">No orders found</p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              {hasFilters ? "Try adjusting your filters." : "Orders will appear here once created."}
            </p>
            {hasFilters && (
              <Link
                href="/admindeoghar/orders"
                className="mt-3 text-[12px] font-medium text-foreground underline underline-offset-2 hover:opacity-70"
              >
                Clear all filters
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Row kind ─────────────────────────────────────────────────────────────

function getRowKind(r: OrderRow): RowKind {
  if (r.payment_status === "failed")  return "failed";
  if (r.status === "cancelled")       return "cancelled";
  if (orderHasFastTrackSla(r.product_slug, r.order_items ?? null)) return "fasttrack";
  return "normal";
}

// Row backgrounds use CSS gradient classes from globals.css
// (gradient fades right so left edge is richest, then transparent)
const ROW_CLASS: Record<RowKind, string> = {
  failed:    "row-failed",
  cancelled: "row-cancelled",
  fasttrack: "row-fasttrack",
  normal:    "row-normal",
};

// Left accent bar — 3px coloured strip in first cell
const ACCENT_BAR: Record<RowKind, string> = {
  failed:    "h-full min-h-[56px] w-[3px] bg-red-500",
  cancelled: "h-full min-h-[56px] w-[3px] bg-red-300",
  fasttrack: "h-full min-h-[56px] w-[3px] bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500",
  normal:    "h-full min-h-[56px] w-[3px]",
};

// ─── Status pill ──────────────────────────────────────────────────────────

function StatusPill({ value, kind }: { value: string; kind: "order" | "payment" }) {
  const v = value.toLowerCase();

  // Resolve color group
  let color: "green" | "blue" | "amber" | "red" | "neutral";

  if (kind === "payment") {
    if (v === "paid")                color = "green";
    else if (v === "pending")        color = "amber";
    else if (v === "failed" || v === "refunded" || v === "partial_refund") color = "red";
    else                             color = "neutral";
  } else {
    if (v === "fulfilled")           color = "green";
    else if (v === "processing" || v === "paid") color = "blue";
    else if (v === "pending_payment") color = "amber";
    else if (v === "cancelled" || v === "refunded") color = "red";
    else                             color = "neutral";
  }

  const styles: Record<typeof color, string> = {
    green:   "border-emerald-200/70 bg-emerald-50 text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/25 dark:text-emerald-400",
    blue:    "border-blue-200/70 bg-blue-50 text-blue-700 dark:border-blue-800/40 dark:bg-blue-950/25 dark:text-blue-400",
    amber:   "border-amber-200/70 bg-amber-50 text-amber-700 dark:border-amber-800/40 dark:bg-amber-950/25 dark:text-amber-400",
    red:     "border-red-200/70 bg-red-50 text-red-700 dark:border-red-800/40 dark:bg-red-950/25 dark:text-red-400",
    neutral: "border-border bg-muted/50 text-muted-foreground",
  };

  const dots: Record<typeof color, string> = {
    green:   "bg-emerald-500",
    blue:    "bg-blue-500",
    amber:   "bg-amber-500",
    red:     "bg-red-500",
    neutral: "bg-muted-foreground/50",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-[3px] text-[11px] font-medium ${styles[color]}`}
    >
      <span className={`h-[5px] w-[5px] shrink-0 rounded-full ${dots[color]}`} />
      {value}
    </span>
  );
}

// ─── Small components ─────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "emerald" | "blue" | "red" | "amber";
}) {
  const numColor =
    accent === "emerald" ? "text-emerald-600 dark:text-emerald-400"
    : accent === "blue"  ? "text-blue-600 dark:text-blue-400"
    : accent === "red"   ? "text-red-600 dark:text-red-400"
    : accent === "amber" ? "text-amber-600 dark:text-amber-400"
    : "text-foreground";

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className={`mt-1 font-mono text-[26px] font-semibold tabular-nums leading-none tracking-tight ${numColor}`}>
        {value}
      </p>
    </div>
  );
}

function QuickChip({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex h-7 items-center rounded-full border px-3 text-[12px] font-medium transition-colors ${
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );
}

function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
      {children}
    </label>
  );
}

function FilterSelect({
  name,
  defaultValue,
  children,
}: {
  name: string;
  defaultValue: string;
  children: React.ReactNode;
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      className="mt-1.5 h-9 w-full rounded-md border border-border bg-background px-3 text-[13px] text-foreground outline-none focus:ring-1 focus:ring-ring/50 focus:border-ring/50 transition-colors appearance-none"
    >
      {children}
    </select>
  );
}

// ─── Formatters ───────────────────────────────────────────────────────────

function productLabel(slug: string): string {
  if (slug === "paid-kundli")         return "Paid Kundli";
  if (slug === "fast-track-addon")    return "FastTrack Add-on";
  if (slug === "consultation-15min")  return "Consultation · 15m";
  if (slug === "consultation-45min")  return "Consultation · 45m";
  return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function consultationLabel(slug: string, type: string | null | undefined): string {
  if (!slug.startsWith("consultation-") || !type) return "—";
  if (type === "chat")       return "Chat";
  if (type === "call")       return "Call";
  if (type === "video_call") return "Video Call";
  return type;
}

/** Same query string as current filters, without one-time delivery flash params. */
function ordersHrefWithoutDeliveryFlash(sp: Record<string, string | undefined>): string {
  const u = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (key === "delivery_status" || key === "delivery_msg") continue;
    if (value == null || value === "") continue;
    u.set(key, value);
  }
  const qs = u.toString();
  return qs ? `/admindeoghar/orders?${qs}` : "/admindeoghar/orders";
}

/** Merge or remove query keys for orders list links. Pass `null` to drop a key. */
function buildOrdersListHref(
  sp: Record<string, string | undefined>,
  patch: Record<string, string | undefined | null>
): string {
  const next: Record<string, string | undefined> = { ...sp };
  for (const [k, v] of Object.entries(patch)) {
    if (v == null || v === "") delete next[k];
    else next[k] = v;
  }
  const u = new URLSearchParams();
  for (const [key, value] of Object.entries(next)) {
    if (value == null || value === "") continue;
    u.set(key, value);
  }
  const qs = u.toString();
  return qs ? `/admindeoghar/orders?${qs}` : "/admindeoghar/orders";
}
