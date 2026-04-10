import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { listEntityNotes } from "@/lib/services/notes";
import { getEntityTimeline } from "@/lib/services/event";
import { ENTITY_NOTE_TYPE } from "@/lib/constants/commerce";
import { submitLeadLostForm, submitLeadNoteForm } from "@/app/(admin)/admin/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: lead, error } = await supabase.from("leads").select("*").eq("id", id).single();

  if (error || !lead) notFound();

  const { data: customer } = lead.customer_id
    ? await supabase.from("customers").select("*").eq("id", lead.customer_id).single()
    : { data: null };

  const { data: births } = await supabase
    .from("birth_details")
    .select("*")
    .eq("lead_id", id)
    .order("created_at", { ascending: false })
    .limit(1);

  const birth = births?.[0] ?? null;
  const notes = await listEntityNotes(supabase, ENTITY_NOTE_TYPE.LEAD, id);
  const events = await getEntityTimeline(supabase, { leadId: id, limit: 40 });

  const c = customer as Record<string, unknown> | null;

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Lead
          </p>
          <h1 className="font-heading text-3xl font-bold">
            {(c?.full_name as string) ?? "Unknown"}
          </h1>
          <p className="mt-1 font-mono text-xs text-muted-foreground">{lead.id}</p>
        </div>
        <div className="flex gap-2">
          {lead.linked_order_id && (
            <Button variant="outline" render={<Link href={`/admin/orders/${lead.linked_order_id}`} />}>
              Open order
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <h2 className="font-heading text-lg font-semibold">Identity</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <Row label="Phone" value={String(c?.phone ?? "—")} />
            <Row label="Email" value={String(c?.email ?? "—")} />
            <Row label="Customer ID" value={String(lead.customer_id ?? "—")} />
          </dl>
        </section>
        <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <h2 className="font-heading text-lg font-semibold">Source</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <Row label="Source page" value={lead.source_page ?? "—"} />
            <Row label="Referrer" value={lead.referrer ?? "—"} />
            <Row label="Session" value={lead.session_id ?? "—"} />
            <Row label="Entry path" value={lead.entry_path ?? "—"} />
          </dl>
        </section>
      </div>

      <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold">Business state</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
          <Row label="Type" value={lead.lead_type} />
          <Row label="Status" value={lead.status} />
          <Row label="Journey stage" value={lead.journey_stage ?? "—"} />
          <Row label="Qualification" value={lead.qualification_reason ?? "—"} />
          <Row label="Conversion" value={lead.conversion_reason ?? "—"} />
          <Row label="Lost reason" value={lead.lost_reason ?? "—"} />
        </dl>
      </section>

      {birth && (
        <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <h2 className="font-heading text-lg font-semibold">Birth details</h2>
          <dl className="mt-4 grid gap-2 sm:grid-cols-2 text-sm">
            <Row label="DOB" value={birth.date_of_birth ?? "—"} />
            <Row label="TOB" value={birth.time_of_birth ?? "—"} />
            <Row label="Place" value={birth.birth_place ?? "—"} />
            <Row label="Gender" value={birth.gender ?? "—"} />
          </dl>
        </section>
      )}

      <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold">Notes</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {notes.map((n) => (
            <li key={n.id} className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2">
              <p>{n.note}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {new Date(n.created_at).toLocaleString()}
              </p>
            </li>
          ))}
          {!notes.length && <li className="text-muted-foreground">No notes yet.</li>}
        </ul>
        <form action={submitLeadNoteForm} className="mt-4 flex flex-col gap-2">
          <input type="hidden" name="leadId" value={id} />
          <Textarea name="note" placeholder="Add internal note…" rows={3} />
          <Button type="submit" size="sm" className="w-fit">
            Add note
          </Button>
        </form>
      </section>

      {lead.status !== "converted" && (
        <section className="rounded-2xl border border-amber-200/60 bg-amber-50/40 p-6 dark:bg-amber-950/20">
          <h2 className="font-heading text-lg font-semibold">Mark lost</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Converted status is set automatically on verified payment — do not mark converted here.
          </p>
          <form action={submitLeadLostForm} className="mt-4 flex flex-wrap items-end gap-2">
            <input type="hidden" name="leadId" value={id} />
            <input
              name="reason"
              placeholder="Reason"
              className="h-10 flex-1 min-w-[200px] rounded-lg border border-input bg-background px-3 text-sm"
            />
            <Button type="submit" variant="destructive" size="sm">
              Mark lost
            </Button>
          </form>
        </section>
      )}

      <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold">Activity</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {events.map((e) => (
            <li key={e.id} className="flex flex-wrap gap-2 border-b border-border/40 py-2 last:border-0">
              <span className="font-medium">{e.event_name}</span>
              <span className="text-muted-foreground">
                {new Date(e.created_at).toLocaleString()}
              </span>
            </li>
          ))}
          {!events.length && <li className="text-muted-foreground">No events.</li>}
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
