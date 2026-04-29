import { createServiceClient } from "@/lib/supabase/server";
import { formatAdminDateTime } from "@/lib/admin/time";

export const dynamic = "force-dynamic";

type SupportRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  subject: string;
  problem: string;
  status: "new" | "in_progress" | "resolved";
  source_page: string | null;
  created_at: string;
};

export default async function AdminSupportPage() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("support_requests")
    .select("id,full_name,email,phone,subject,problem,status,source_page,created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-sm">
        Failed to load support requests: {error.message}
      </div>
    );
  }

  const rows = (data as SupportRow[] | null) ?? [];
  const stats = {
    total: rows.length,
    newCount: rows.filter((r) => r.status === "new").length,
    inProgress: rows.filter((r) => r.status === "in_progress").length,
    resolved: rows.filter((r) => r.status === "resolved").length,
  };

  return (
    <div className="space-y-7">
      <div>
        <h1 className="font-heading text-3xl font-bold">Support</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Requests submitted from the public support page.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="New" value={stats.newCount} />
        <StatCard label="In progress" value={stats.inProgress} />
        <StatCard label="Resolved" value={stats.resolved} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        <table className="w-full min-w-[1020px] text-left text-sm">
          <thead className="border-b border-border/60 bg-muted/30 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Problem</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-muted/20">
                <td className="px-4 py-3">
                  <p className="font-medium">{row.full_name}</p>
                  <p className="text-[11px] font-mono text-muted-foreground">{row.id.slice(0, 8)}...</p>
                </td>
                <td className="px-4 py-3 text-xs">
                  <p>{row.email}</p>
                  <p className="text-muted-foreground">{row.phone ?? "No phone"}</p>
                </td>
                <td className="max-w-[240px] px-4 py-3 font-medium">{row.subject}</td>
                <td className="max-w-[420px] px-4 py-3 text-xs text-muted-foreground">
                  <details>
                    <summary className="cursor-pointer text-brand">View problem</summary>
                    <p className="mt-2 whitespace-pre-wrap leading-relaxed text-foreground">{row.problem}</p>
                  </details>
                </td>
                <td className="px-4 py-3">
                  <StatusPill status={row.status} />
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{row.source_page ?? "-"}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                  {formatAdminDateTime(row.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No support requests yet.</p>
        ) : null}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-heading text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: SupportRow["status"] }) {
  const cls =
    status === "new"
      ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-300"
      : status === "resolved"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/25 dark:text-emerald-300"
        : "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/25 dark:text-blue-300";

  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      {status}
    </span>
  );
}
