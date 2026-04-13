import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { LeadsFilters } from "@/components/admin/leads-filters";
import { formatAdminDateTime, startOfTodayIstIso } from "@/lib/admin/time";

export const dynamic = "force-dynamic";

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const supabase = createServiceClient();

  let q = supabase
    .from("leads")
    .select(
      "id,lead_type,status,journey_stage,source_page,entry_path,has_order,linked_order_id,created_at,customers(full_name,phone,email)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (sp.status) q = q.eq("status", sp.status);
  if (sp.lead_type) q = q.eq("lead_type", sp.lead_type);
  if (sp.has_order === "false") q = q.eq("has_order", false);
  if (sp.entry_path) q = q.eq("entry_path", sp.entry_path);

  if (sp.preset === "today") {
    q = q.gte("created_at", startOfTodayIstIso());
  } else if (sp.preset === "7d") {
    const t = new Date();
    t.setDate(t.getDate() - 7);
    q = q.gte("created_at", t.toISOString());
  }

  const { data: rowsRaw, error, count } = await q;

  type LeadRow = {
    id: string;
    lead_type: string;
    status: string;
    journey_stage: string | null;
    source_page: string | null;
    entry_path: string | null;
    has_order: boolean;
    linked_order_id: string | null;
    created_at: string;
    customers: {
      full_name?: string | null;
      phone?: string | null;
      email?: string | null;
    } | null;
  };

  const rows = rowsRaw as LeadRow[] | null;

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-sm">
        Failed to load leads: {error.message}
      </div>
    );
  }

  const filtered =
    sp.q && rows
      ? rows.filter((r) => {
          const term = sp.q!.toLowerCase();
          const c = r.customers as {
            full_name?: string | null;
            phone?: string | null;
            email?: string | null;
          } | null;
          return (
            r.id.toLowerCase().includes(term) ||
            (c?.full_name?.toLowerCase().includes(term) ?? false) ||
            (c?.phone?.includes(term) ?? false) ||
            (c?.email?.toLowerCase().includes(term) ?? false)
          );
        })
      : rows;

  const stats = {
    total: count ?? 0,
    qualified: rows?.filter((r) => r.status === "qualified").length ?? 0,
    converted: rows?.filter((r) => r.status === "converted").length ?? 0,
    lost: rows?.filter((r) => r.status === "lost").length ?? 0,
    today:
      rows?.filter((r) => r.created_at >= startOfTodayIstIso()).length ?? 0,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold">Leads</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Business intent and funnel stages
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Total", stats.total],
          ["Qualified", stats.qualified],
          ["Converted", stats.converted],
          ["Lost", stats.lost],
          ["Today", stats.today],
        ].map(([a, b]) => (
          <div
            key={a}
            className="rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-sm"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {a}
            </p>
            <p className="font-heading text-2xl font-bold tabular-nums">{b}</p>
          </div>
        ))}
      </div>

      <LeadsFilters />

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border/60 bg-muted/30 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Lead</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Journey</th>
              <th className="px-4 py-3">Entry</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {(filtered ?? []).map((r) => {
              const c = r.customers as {
                full_name?: string | null;
                phone?: string | null;
              } | null;
              return (
                <tr key={r.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/admindeoghar/leads/${r.id}`} className="hover:underline">
                      {c?.full_name ?? "—"}
                    </Link>
                    <p className="text-[11px] text-muted-foreground font-mono">{r.id.slice(0, 8)}…</p>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{c?.phone ?? "—"}</td>
                  <td className="max-w-[170px] truncate px-4 py-3 text-xs">
                    {r.source_page ?? "—"}
                  </td>
                  <td className="px-4 py-3">{r.lead_type}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{r.status}</span>
                  </td>
                  <td className="max-w-[140px] truncate px-4 py-3 text-xs text-muted-foreground">
                    {r.journey_stage ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-xs">{r.entry_path ?? "—"}</td>
                  <td className="px-4 py-3 text-xs">
                    {r.linked_order_id ? (
                      <Link href={`/admindeoghar/orders/${r.linked_order_id}`} className="text-brand hover:underline font-mono">
                        {String(r.linked_order_id).slice(0, 8)}…
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {formatAdminDateTime(r.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admindeoghar/leads/${r.id}`}
                      className="text-sm font-medium text-brand hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!filtered?.length && (
          <p className="p-8 text-center text-sm text-muted-foreground">No leads match filters.</p>
        )}
      </div>
    </div>
  );
}
