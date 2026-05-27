import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { listEntityNotes } from "@/lib/services/notes";
import { getEntityTimeline } from "@/lib/services/event";
import { ENTITY_NOTE_TYPE } from "@/lib/constants/commerce";
import { adminPath } from "@/lib/admin/admin-paths";
import {
  submitOrderNoteForm,
  submitOrderFulfillmentForm,
  submitOrderProcessingForm,
  submitOrderPaymentReconcileForm,
} from "@/app/(admin)/admin/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FULFILLMENT_STATUS } from "@/lib/constants/commerce";
import type { Json } from "@/types/database";
import { formatAdminDateTime } from "@/lib/admin/time";
import { OrderSlaCountdown } from "@/components/admin/order-sla-countdown";
import { orderHasFastTrackSla } from "@/lib/admin/order-sla-helpers";
import {
  isAdminTestOrderNotes,
  isAdminTestPaymentProvider,
} from "@/lib/admin/admin-test-order";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const supabase = createServiceClient();

  const { data: order, error } = await supabase.from("orders").select("*").eq("id", id).single();

  if (error || !order) notFound();

  const { data: customer } = order.customer_id
    ? await supabase.from("customers").select("*").eq("id", order.customer_id).single()
    : { data: null };

  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", id);

  const { data: pays } = await supabase
    .from("payments")
    .select("*")
    .eq("order_id", id)
    .order("created_at", { ascending: false });

  const pay = pays?.[0] ?? null;
  const { data: physicalOrder } = await supabase
    .from("physical_order_details")
    .select("*")
    .eq("order_id", id)
    .maybeSingle();
  const { data: paymentInitiatedEvent } = await supabase
    .from("events")
    .select("metadata_json")
    .eq("order_id", id)
    .eq("event_name", "payment_initiated")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const consultationMeta = parseConsultationMetadata(paymentInitiatedEvent?.metadata_json ?? null);
  const isConsultationOrder = order.product_slug.startsWith("consultation-");

  let birth: {
    full_name: string | null;
    gender: string | null;
    report_language: string | null;
    date_of_birth: string | null;
    time_of_birth: string | null;
    birth_place: string | null;
  } | null = null;
  if (order.birth_details_id) {
    const { data: b } = await supabase
      .from("birth_details")
      .select("*")
      .eq("id", order.birth_details_id)
      .single();
    birth = b;
  }

  const lineMerged = mergeOrderItemsForDisplay(items ?? []);
  const lineDisplay = lineMerged ?? fallbackLineFromOrder(order);
  const hasFastTrackAddon = orderHasFastTrackSla(
    order.product_slug,
    (items ?? []) as { product_slug: string }[]
  );

  const cust = customer as Record<string, unknown> | null;
  const notes = await listEntityNotes(supabase, ENTITY_NOTE_TYPE.ORDER, id);
  const events = await getEntityTimeline(supabase, { orderId: id, limit: 50 });
  const paymentReconcileFlash =
    sp.payment_reconcile_status === "success" || sp.payment_reconcile_status === "failed"
      ? {
          kind: sp.payment_reconcile_status as "success" | "failed",
          message: sp.payment_reconcile_msg ?? "",
        }
      : null;

  const isAdminTest =
    isAdminTestOrderNotes(order.notes) || isAdminTestPaymentProvider(pay?.provider ?? null);

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Order</p>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-heading text-3xl font-bold">{order.order_number}</h1>
          {isAdminTest ? (
            <span className="rounded-md border border-amber-500/50 bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-950 dark:text-amber-100">
              Admin test
            </span>
          ) : null}
        </div>
        <p className="mt-1 font-mono text-xs text-muted-foreground">{order.id}</p>
      </div>

      {isAdminTest ? (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
          <p className="font-semibold">Admin test order</p>
          <p className="mt-1 text-[13px] opacity-90">
            No Razorpay charge. Post-payment automations (WhatsApp, email, Meta CAPI if enabled) may
            have run like a real sale.
          </p>
          {order.notes ? (
            <p className="mt-2 text-[12px] font-mono opacity-80">{order.notes}</p>
          ) : null}
        </div>
      ) : null}

      <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold">Overview</h2>
        <dl className="mt-4 grid gap-2 sm:grid-cols-2 text-sm">
          <Row label="Product" value={formatAdminProductLabel(order.product_slug)} />
          <Row label="Source URL" value={order.source ?? "—"} />
          <Row label="Total" value={`₹${(Number(order.total_amount) / 100).toFixed(2)}`} />
          <Row label="Subtotal" value={`₹${(Number(order.subtotal_amount) / 100).toFixed(2)}`} />
          <Row label="Add-ons" value={`₹${(Number(order.addon_amount) / 100).toFixed(2)}`} />
          <Row label="Discount" value={`Rs ${(Number(order.discount_amount) / 100).toFixed(2)}`} />
          <Row label="Coupon used" value={order.coupon_applied ? "true" : "false"} />
          <Row label="Coupon code" value={order.coupon_code ?? "-"} />
          <Row label="Order status" value={order.status} />
          <Row label="Payment" value={order.payment_status} />
          <Row label="Fulfillment" value={order.fulfillment_status} />
          <Row label="Assigned to" value={order.fulfillment_assignee ?? "—"} />
          <Row label="Funnel tag" value={order.entry_path ?? "—"} />
          <Row label="Created" value={formatAdminDateTime(order.created_at)} />
          <Row label="Paid at" value={formatAdminDateTime(order.paid_at)} />
          {order.delivery_scheduled_at &&
          order.fulfillment_status !== FULFILLMENT_STATUS.DELIVERED &&
          order.delivery_schedule_report_url ? (
            <>
              <Row
                label="Delivery scheduled for"
                value={formatAdminDateTime(order.delivery_scheduled_at)}
              />
              <Row
                label="Scheduled report URL"
                value={
                  <a
                    href={order.delivery_schedule_report_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-brand underline-offset-2 hover:underline break-all"
                  >
                    {order.delivery_schedule_report_url}
                  </a>
                }
              />
            </>
          ) : null}
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Delivery SLA (live)</span>
            <div className="text-right font-medium">
              <div className="inline-block text-left">
                <OrderSlaCountdown
                  createdAtIso={order.created_at}
                  productSlug={order.product_slug}
                  fulfillmentStatus={order.fulfillment_status}
                  paymentStatus={order.payment_status}
                  orderStatus={order.status}
                  hasFastTrackAddon={hasFastTrackAddon}
                />
              </div>
            </div>
          </div>
        </dl>
        {order.lead_id && (
          <p className="mt-4 text-sm">
            Linked lead:{" "}
            <Link href={`${adminPath("/leads/")}${order.lead_id}`} className="font-medium text-brand hover:underline">
              {order.lead_id}
            </Link>
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold">Line items</h2>
        {lineDisplay ? (
          <ul className="mt-4 space-y-2 text-sm">
            <li className="flex justify-between gap-4 border-b border-border/40 py-2">
              <span className="min-w-0 leading-snug">{lineDisplay.title}</span>
              <span className="shrink-0 tabular-nums font-medium">
                ₹{(lineDisplay.totalPaise / 100).toFixed(0)}
              </span>
            </li>
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">No line items.</p>
        )}
        {!lineMerged && lineDisplay ? (
          <p className="mt-2 text-xs text-muted-foreground">
            No <code className="rounded bg-muted px-1 font-mono text-[10px]">order_items</code> rows — showing
            product slug and order total.
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold">Customer</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <Row label="Name" value={String(cust?.full_name ?? "—")} />
          <Row label="Phone" value={String(cust?.phone ?? "—")} />
          <Row label="Email" value={String(cust?.email ?? "—")} />
        </dl>
      </section>

      {isConsultationOrder && (
        <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <h2 className="font-heading text-lg font-semibold">Consultation details</h2>
          <dl className="mt-4 grid gap-2 sm:grid-cols-2 text-sm">
            <Row
              label="Mode"
              value={formatConsultationType(order.consultation_type ?? consultationMeta.consultationType)}
            />
            <Row
              label="DOB"
              value={String(birth?.date_of_birth ?? consultationMeta.dob ?? "—")}
            />
            <Row
              label="TOB"
              value={String(birth?.time_of_birth ?? consultationMeta.tob ?? "—")}
            />
            <Row
              label="Birth place"
              value={String(birth?.birth_place ?? consultationMeta.pob ?? "—")}
            />
          </dl>
          <div className="mt-4 border-t border-border/50 pt-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Session focus</p>
            <p className="mt-1 text-sm">
              {order.session_note?.trim()
                ? order.session_note
                : consultationMeta.sessionNote?.trim()
                  ? consultationMeta.sessionNote
                  : "—"}
            </p>
          </div>
        </section>
      )}

      {birth && (
        <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <h2 className="font-heading text-lg font-semibold">Birth details</h2>
          <dl className="mt-4 grid gap-2 sm:grid-cols-2 text-sm">
            <Row label="Name (snapshot)" value={String(birth.full_name ?? "—")} />
            <Row label="Gender" value={formatGenderAdmin(birth.gender)} />
            <Row label="Report language" value={formatReportLangAdmin(birth.report_language)} />
            <Row label="DOB" value={String(birth.date_of_birth ?? "—")} />
            <Row label="TOB" value={String(birth.time_of_birth ?? "—")} />
            <Row label="Place" value={String(birth.birth_place ?? "—")} />
          </dl>
        </section>
      )}

      {physicalOrder && (
        <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-heading text-lg font-semibold">Physical product details</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Vedic Kada selection, payment mode, and shipping snapshot captured at checkout.
              </p>
            </div>
            <span className="rounded-full border border-amber-300/60 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 dark:border-amber-700/40 dark:bg-amber-950/30 dark:text-amber-300">
              {physicalOrder.payment_method.toUpperCase()}
            </span>
          </div>
          <dl className="mt-5 grid gap-2 sm:grid-cols-2 text-sm">
            <Row label="Product family" value={physicalOrder.product_family} />
            <Row label="Variant" value={physicalOrder.variant_label} />
            <Row label="Design" value={physicalOrder.design_label} />
            <Row label="Size" value={`${physicalOrder.size_code} · ${physicalOrder.size_label}`} />
            <Row
              label="Siddh energisation"
              value={physicalOrder.siddha_energisation ? "Yes" : "No"}
            />
            <Row
              label="Prepaid discount"
              value={`₹${(Number(physicalOrder.prepaid_discount_amount) / 100).toFixed(0)}`}
            />
            <Row label="Estimated delivery" value={`${physicalOrder.estimated_delivery_days} days`} />
            <Row label="Ship to" value={physicalOrder.shipping_full_name} />
            <Row label="WhatsApp" value={`+91 ${physicalOrder.shipping_phone}`} />
            <Row
              label="Address"
              value={
                <span>
                  {physicalOrder.shipping_address_line1}
                  <br />
                  {physicalOrder.shipping_city}, {physicalOrder.shipping_state} -{" "}
                  {physicalOrder.shipping_pincode}
                  <br />
                  {physicalOrder.shipping_country}
                </span>
              }
            />
          </dl>
          {physicalOrder.internal_notes ? (
            <div className="mt-4 rounded-xl border border-border/50 bg-muted/30 p-3 text-sm">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Internal notes</p>
              <p className="mt-1">{physicalOrder.internal_notes}</p>
            </div>
          ) : null}
        </section>
      )}

      <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold">Payment</h2>
        {paymentReconcileFlash && (
          <div
            className={`mt-3 rounded-lg border px-3 py-2 text-xs ${
              paymentReconcileFlash.kind === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/25 dark:text-emerald-300"
                : "border-red-200 bg-red-50 text-red-800 dark:border-red-900/40 dark:bg-red-950/25 dark:text-red-300"
            }`}
          >
            {paymentReconcileFlash.message}
          </div>
        )}
        <div className="mt-3">
          <form action={submitOrderPaymentReconcileForm}>
            <input type="hidden" name="orderId" value={id} />
            <input type="hidden" name="returnTo" value="order_detail" />
            <Button type="submit" size="sm" variant="outline">
              Reconcile payment from Razorpay
            </Button>
          </form>
        </div>
        {pay ? (
          <dl className="mt-4 space-y-2 text-sm">
            <Row label="Provider" value={pay.provider} />
            <Row label="Status" value={pay.status} />
            <Row label="Razorpay order" value={pay.provider_order_id ?? "—"} />
            <Row label="Razorpay payment" value={pay.provider_payment_id ?? "—"} />
            <Row label="Amount" value={`₹${(Number(pay.amount) / 100).toFixed(2)}`} />
            {pay.failure_reason && <Row label="Failure" value={pay.failure_reason} />}
          </dl>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">No payment rows.</p>
        )}
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold">Fulfillment</h2>
        <p className="mt-2 text-sm text-muted-foreground">Current: {order.fulfillment_status}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <form action={submitOrderProcessingForm}>
            <input type="hidden" name="orderId" value={id} />
            <Button type="submit" size="sm" variant="secondary">
              Mark processing
            </Button>
          </form>
          {(
            [
              FULFILLMENT_STATUS.QUEUED,
              FULFILLMENT_STATUS.IN_PROGRESS,
              FULFILLMENT_STATUS.DELIVERED,
            ] as const
          ).map((s) => (
            <form key={s} action={submitOrderFulfillmentForm}>
              <input type="hidden" name="orderId" value={id} />
              <input type="hidden" name="fulfillment" value={s} />
              <Button type="submit" size="sm" variant="outline">
                {s}
              </Button>
            </form>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold">Notes</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {notes.map((n) => (
            <li key={n.id} className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2">
              {n.note}
            </li>
          ))}
        </ul>
        <form action={submitOrderNoteForm} className="mt-4 flex flex-col gap-2">
          <input type="hidden" name="orderId" value={id} />
          <Textarea name="note" rows={3} placeholder="Internal note…" />
          <Button type="submit" size="sm" className="w-fit">
            Add note
          </Button>
        </form>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold">Activity</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {events.map((e) => (
            <li key={e.id} className="border-b border-border/40 py-2 last:border-0">
              <span className="font-medium">{e.event_name}</span>{" "}
              <span className="text-muted-foreground">{formatAdminDateTime(e.created_at)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

type OrderItemRow = {
  id: string;
  item_type: string;
  title: string;
  total_price: string | number;
};

function itemTypeIs(t: string | null | undefined, want: "main" | "addon") {
  return (t ?? "").toLowerCase() === want;
}

function mergeOrderItemsForDisplay(rows: OrderItemRow[]): { title: string; totalPaise: number } | null {
  if (!rows.length) return null;
  const mains = rows.filter((r) => itemTypeIs(r.item_type, "main"));
  const addons = rows.filter((r) => itemTypeIs(r.item_type, "addon"));
  const primary = mains[0] ?? rows[0];
  const addonTitles = addons.map((a) => a.title).filter(Boolean);
  const title =
    addonTitles.length > 0 ? `${primary.title} + ${addonTitles.join(" + ")}` : primary.title;
  const totalPaise = rows.reduce((s, r) => s + Number(r.total_price), 0);
  return { title, totalPaise };
}

function fallbackLineFromOrder(order: {
  product_slug: string;
  total_amount: string | number;
}): { title: string; totalPaise: number } | null {
  const slug = order.product_slug?.trim();
  if (!slug) return null;
  const title = formatAdminProductLabel(slug);
  const totalPaise = Number(order.total_amount);
  if (Number.isNaN(totalPaise)) return null;
  return { title, totalPaise };
}

function formatGenderAdmin(v: string | null | undefined): string {
  if (!v) return "—";
  const x = v.toLowerCase();
  if (x === "male") return "Male";
  if (x === "female") return "Female";
  return v;
}

function formatReportLangAdmin(v: string | null | undefined): string {
  if (!v) return "—";
  const x = v.toLowerCase();
  if (x === "hindi") return "Hindi";
  if (x === "english") return "English";
  return v;
}

function formatAdminProductLabel(slug: string): string {
  if (slug === "paid-kundli") return "Paid Kundli Report";
  if (slug === "fast-track-addon") return "FastTrack Add-on";
  if (slug === "consultation-15min") return "Consultation · 15 Min";
  if (slug === "consultation-45min") return "Consultation · 45 Min";
  if (slug === "vedic-kada-plated") return "Vedic Kada · Silver Plated";
  if (slug === "vedic-kada-pure-silver") return "Vedic Kada · Pure Silver";
  if (slug === "kada-siddha-energisation") return "Siddh Energisation · Kada";
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatConsultationType(v: string | null | undefined): string {
  if (!v) return "—";
  if (v === "chat") return "Chat";
  if (v === "call") return "Call";
  if (v === "video_call") return "Video Call";
  return v;
}

function parseConsultationMetadata(raw: Json | null): {
  consultationType: string | null;
  sessionNote: string | null;
  dob: string | null;
  tob: string | null;
  pob: string | null;
} {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { consultationType: null, sessionNote: null, dob: null, tob: null, pob: null };
  }
  const obj = raw as Record<string, Json | undefined>;
  return {
    consultationType:
      typeof obj.consultation_type === "string" ? obj.consultation_type : null,
    sessionNote: typeof obj.session_note === "string" ? obj.session_note : null,
    dob: typeof obj.dob === "string" ? obj.dob : null,
    tob: typeof obj.tob === "string" ? obj.tob : null,
    pob: typeof obj.pob === "string" ? obj.pob : null,
  };
}
