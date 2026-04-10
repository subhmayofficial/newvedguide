import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { listEntityNotes } from "@/lib/services/notes";
import { getEntityTimeline } from "@/lib/services/event";
import { ENTITY_NOTE_TYPE } from "@/lib/constants/commerce";
import {
  submitOrderNoteForm,
  submitOrderFulfillmentForm,
  submitOrderProcessingForm,
} from "@/app/(admin)/admin/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FULFILLMENT_STATUS } from "@/lib/constants/commerce";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  let birth: {
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

  const cust = customer as Record<string, unknown> | null;
  const notes = await listEntityNotes(supabase, ENTITY_NOTE_TYPE.ORDER, id);
  const events = await getEntityTimeline(supabase, { orderId: id, limit: 50 });

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Order</p>
        <h1 className="font-heading text-3xl font-bold">{order.order_number}</h1>
        <p className="mt-1 font-mono text-xs text-muted-foreground">{order.id}</p>
      </div>

      <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold">Overview</h2>
        <dl className="mt-4 grid gap-2 sm:grid-cols-2 text-sm">
          <Row label="Product" value={order.product_slug} />
          <Row label="Total" value={`₹${(Number(order.total_amount) / 100).toFixed(2)}`} />
          <Row label="Subtotal" value={`₹${(Number(order.subtotal_amount) / 100).toFixed(2)}`} />
          <Row label="Add-ons" value={`₹${(Number(order.addon_amount) / 100).toFixed(2)}`} />
          <Row label="Order status" value={order.status} />
          <Row label="Payment" value={order.payment_status} />
          <Row label="Fulfillment" value={order.fulfillment_status} />
          <Row label="Entry path" value={order.entry_path ?? "—"} />
          <Row label="Created" value={new Date(order.created_at).toLocaleString()} />
          <Row label="Paid at" value={order.paid_at ? new Date(order.paid_at).toLocaleString() : "—"} />
        </dl>
        {order.lead_id && (
          <p className="mt-4 text-sm">
            Linked lead:{" "}
            <Link href={`/admin/leads/${order.lead_id}`} className="font-medium text-brand hover:underline">
              {order.lead_id}
            </Link>
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold">Line items</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {(items ?? []).map((it) => (
            <li key={it.id} className="flex justify-between border-b border-border/40 py-2 last:border-0">
              <span>{it.title}</span>
              <span className="tabular-nums">₹{(Number(it.total_price) / 100).toFixed(0)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold">Customer</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <Row label="Name" value={String(cust?.full_name ?? "—")} />
          <Row label="Phone" value={String(cust?.phone ?? "—")} />
          <Row label="Email" value={String(cust?.email ?? "—")} />
        </dl>
      </section>

      {birth && (
        <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <h2 className="font-heading text-lg font-semibold">Birth details</h2>
          <dl className="mt-4 grid gap-2 sm:grid-cols-2 text-sm">
            <Row label="DOB" value={String(birth.date_of_birth ?? "—")} />
            <Row label="TOB" value={String(birth.time_of_birth ?? "—")} />
            <Row label="Place" value={String(birth.birth_place ?? "—")} />
          </dl>
        </section>
      )}

      <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold">Payment</h2>
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
              <span className="text-muted-foreground">{new Date(e.created_at).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
