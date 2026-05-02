import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { formatAdminDateTime } from "@/lib/admin/time";
import { checkLiveConsultSchema, astrologerLabel } from "@/lib/admin/live-consult";
import { LiveConsultSchemaMissing } from "@/components/admin/live-consult-schema-missing";
import { formatInrFromPaisePrecise } from "@/lib/format-money";

export const dynamic = "force-dynamic";

export default async function LiveConsultSessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const supabase = createServiceClient();
  const schema = await checkLiveConsultSchema(supabase);
  if (!schema.ok) {
    return <LiveConsultSchemaMissing message={schema.message} />;
  }

  let q = supabase
    .from("chat_sessions")
    .select(
      "id, user_id, astrologer_id, status, order_code, closed_at, total_billed_paise, created_at, updated_at"
    )
    .order("updated_at", { ascending: false })
    .limit(300);

  if (
    sp.status === "open" ||
    sp.status === "closed" ||
    sp.status === "waiting_astrologer"
  ) {
    q = q.eq("status", sp.status);
  }

  const { data: sessions, error } = await q;

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-sm">
        Failed to load sessions: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Live consult
          </p>
          <h1 className="font-heading text-3xl font-bold">Chat sessions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {(sessions ?? []).length} loaded · filter by status
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterLink href="/admindeoghar/live-consult/sessions" label="All" active={!sp.status} />
          <FilterLink href="/admindeoghar/live-consult/sessions?status=open" label="Open" active={sp.status === "open"} />
          <FilterLink
            href="/admindeoghar/live-consult/sessions?status=waiting_astrologer"
            label="Waiting"
            active={sp.status === "waiting_astrologer"}
          />
          <FilterLink
            href="/admindeoghar/live-consult/sessions?status=closed"
            label="Closed"
            active={sp.status === "closed"}
          />
          <Link
            href="/admindeoghar/live-consult"
            className="ml-2 text-sm font-medium text-brand hover:underline"
          >
            Hub
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card shadow-sm">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/40">
              <th className="px-4 py-3 font-semibold">Order</th>
              <th className="px-4 py-3 font-semibold">Astrologer</th>
              <th className="px-4 py-3 font-semibold">User</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Billed</th>
              <th className="px-4 py-3 font-semibold">Updated</th>
              <th className="px-4 py-3 font-semibold">Session id</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {(sessions ?? []).map((s) => (
              <tr
                key={s.id}
                className={`hover:bg-muted/20 ${
                  s.status === "waiting_astrologer"
                    ? "bg-amber-500/10 ring-1 ring-inset ring-amber-500/40"
                    : ""
                }`}
              >
                <td className="px-4 py-3 font-mono text-[11px] font-medium">
                  {s.order_code ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admindeoghar/live-consult/inbox?sid=${encodeURIComponent(s.id)}`}
                    className="font-medium hover:underline"
                  >
                    {astrologerLabel(s.astrologer_id)}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admindeoghar/live-consult/users/${s.user_id}`}
                    className="font-mono text-xs hover:underline"
                  >
                    {s.user_id.slice(0, 8)}…
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      s.status === "waiting_astrologer"
                        ? "bg-amber-500/20 font-semibold text-amber-900 dark:text-amber-200"
                        : "bg-muted"
                    }`}
                  >
                    {s.status === "waiting_astrologer" ? "Waiting · join" : s.status}
                  </span>
                </td>
                <td className="px-4 py-3 tabular-nums text-muted-foreground">
                  {(s.total_billed_paise ?? 0) > 0 || s.status === "closed"
                    ? formatInrFromPaisePrecise(s.total_billed_paise ?? 0)
                    : "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatAdminDateTime(s.updated_at)}
                </td>
                <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                  <Link
                    href={`/admindeoghar/live-consult/sessions/${s.id}`}
                    className="hover:underline"
                  >
                    {s.id}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilterLink({
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
      className={
        active
          ? "rounded-lg bg-foreground px-3 py-1.5 text-xs font-semibold text-background"
          : "rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
      }
    >
      {label}
    </Link>
  );
}
