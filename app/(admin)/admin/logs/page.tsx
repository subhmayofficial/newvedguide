import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { adminPath } from "@/lib/admin/admin-paths";
import { listSiteLogs, type SiteLogFilter } from "@/lib/admin/site-logs";
import { formatAdminDateTime } from "@/lib/admin/time";

export const dynamic = "force-dynamic";

function shortId(value: string | null | undefined): string {
  if (!value) return "—";
  return value.length > 10 ? `${value.slice(0, 8)}…` : value;
}

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const supabase = createServiceClient();

  const kind = (sp.kind ?? "") as SiteLogFilter;
  const q = sp.q?.trim() ?? "";

  const { entries, eventsAvailable, integrationsAvailable } = await listSiteLogs(supabase, {
    kind: kind === "event" || kind === "integration" ? kind : "",
    q,
    limit: 250,
  });

  const buildHref = (patch: Record<string, string | null>) => {
    const params = new URLSearchParams();
    const nextKind = patch.kind ?? kind;
    const nextQ = patch.q ?? q;
    if (nextKind) params.set("kind", nextKind);
    if (nextQ) params.set("q", nextQ);
    const qs = params.toString();
    return qs ? `${adminPath("/logs")}?${qs}` : adminPath("/logs");
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 font-sans admin-page-enter">
      <header>
        <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-foreground">Logs</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Site events (funnel, commerce, analytics) and outbound integration calls — newest first.
        </p>
      </header>

      {(!eventsAvailable || !integrationsAvailable) && (
        <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-[13px] text-amber-950 dark:text-amber-100">
          Some log sources are unavailable until Supabase migrations are applied (
          {!eventsAvailable ? "events" : null}
          {!eventsAvailable && !integrationsAvailable ? ", " : null}
          {!integrationsAvailable ? "integration_deliveries" : null}).
        </div>
      )}

      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <div className="min-w-[160px]">
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Type
            </label>
            <select
              name="kind"
              defaultValue={kind}
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-[13px]"
            >
              <option value="">All logs</option>
              <option value="event">Site events</option>
              <option value="integration">Integrations (WhatsApp, email, Meta CAPI)</option>
            </select>
          </div>
          <div className="min-w-[220px] flex-1">
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Search
            </label>
            <input
              name="q"
              defaultValue={q}
              placeholder="Event name, provider, order id, metadata…"
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-[13px]"
            />
          </div>
          <button
            type="submit"
            className="inline-flex h-9 items-center rounded-md bg-foreground px-4 text-[13px] font-semibold text-background"
          >
            Filter
          </button>
          {(kind || q) && (
            <Link
              href={adminPath("/logs")}
              className="inline-flex h-9 items-center rounded-md border border-border px-3 text-[13px] font-medium text-muted-foreground"
            >
              Clear
            </Link>
          )}
        </form>

        <div className="mt-3 flex flex-wrap gap-2 text-[12px]">
          <Link
            href={buildHref({ kind: "" })}
            className={`rounded-md px-2 py-1 ${!kind ? "bg-muted font-semibold text-foreground" : "text-muted-foreground"}`}
          >
            All
          </Link>
          <Link
            href={buildHref({ kind: "event" })}
            className={`rounded-md px-2 py-1 ${kind === "event" ? "bg-muted font-semibold text-foreground" : "text-muted-foreground"}`}
          >
            Events
          </Link>
          <Link
            href={buildHref({ kind: "integration" })}
            className={`rounded-md px-2 py-1 ${kind === "integration" ? "bg-muted font-semibold text-foreground" : "text-muted-foreground"}`}
          >
            Integrations
          </Link>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="border-b border-border/50 bg-muted/30 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Context</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {entries.length ? (
                entries.map((entry) => (
                  <tr key={`${entry.kind}-${entry.id}`}>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {formatAdminDateTime(entry.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span
                        className={
                          entry.kind === "integration"
                            ? "rounded-md bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-violet-800 dark:text-violet-300"
                            : "rounded-md bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-sky-800 dark:text-sky-300"
                        }
                      >
                        {entry.kind}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="font-medium text-foreground">{entry.title}</div>
                      <div className="mt-0.5 max-w-[280px] truncate text-muted-foreground">
                        {entry.subtitle || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {entry.status ? (
                        <span
                          className={
                            entry.status === "success"
                              ? "font-semibold text-emerald-700 dark:text-emerald-400"
                              : entry.status === "failed"
                                ? "font-semibold text-red-700 dark:text-red-400"
                                : "text-muted-foreground"
                          }
                        >
                          {entry.status}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono">
                      {entry.orderId ? (
                        <Link
                          href={adminPath(`/orders/${entry.orderId}`)}
                          className="text-brand underline-offset-2 hover:underline"
                        >
                          {shortId(entry.orderId)}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                      {entry.leadId ? `lead ${shortId(entry.leadId)}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <details>
                        <summary className="cursor-pointer text-brand">View</summary>
                        <pre className="mt-2 max-h-48 overflow-auto rounded border border-border/60 bg-muted/30 p-2 text-[10px] leading-relaxed">
                          {JSON.stringify(entry.detail, null, 2)}
                        </pre>
                      </details>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No logs match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-border/50 px-4 py-2 text-[11px] text-muted-foreground">
          Showing up to 250 entries · Meta CAPI, Interakt, and Resend attempts appear under{" "}
          <span className="font-medium">integration</span>
        </p>
      </section>
    </div>
  );
}
