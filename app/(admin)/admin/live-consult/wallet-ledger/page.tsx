import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { formatAdminDateTime } from "@/lib/admin/time";
import { checkLiveConsultSchema } from "@/lib/admin/live-consult";
import { LiveConsultSchemaMissing } from "@/components/admin/live-consult-schema-missing";
import { formatInrFromPaise } from "@/lib/format-money";

export const dynamic = "force-dynamic";

export default async function LiveConsultWalletLedgerPage() {
  const supabase = createServiceClient();
  const schema = await checkLiveConsultSchema(supabase);
  if (!schema.ok) {
    return <LiveConsultSchemaMissing message={schema.message} />;
  }

  const { data: rows, error } = await supabase
    .from("wallet_ledger")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-sm">
        Failed to load ledger: {error.message}
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
          <h1 className="font-heading text-3xl font-bold">Wallet ledger</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {(rows ?? []).length} recent entries
          </p>
        </div>
        <Link
          href="/admindeoghar/live-consult"
          className="text-sm font-medium text-brand hover:underline"
        >
          ← Hub
        </Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/40">
              <th className="px-4 py-3 font-semibold">Time</th>
              <th className="px-4 py-3 font-semibold">User</th>
              <th className="px-4 py-3 font-semibold">Reason</th>
              <th className="px-4 py-3 font-semibold">Delta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {(rows ?? []).map((row) => (
              <tr key={row.id} className="hover:bg-muted/20">
                <td className="px-4 py-3 text-muted-foreground">
                  {formatAdminDateTime(row.created_at)}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admindeoghar/live-consult/users/${row.user_id}`}
                    className="font-mono text-xs hover:underline"
                  >
                    {row.user_id.slice(0, 8)}…
                  </Link>
                </td>
                <td className="px-4 py-3">{row.reason}</td>
                <td
                  className={`px-4 py-3 tabular-nums ${row.delta_paise >= 0 ? "text-emerald-600" : "text-destructive"}`}
                >
                  {row.delta_paise >= 0 ? "+" : ""}
                  {formatInrFromPaise(Math.abs(row.delta_paise))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
