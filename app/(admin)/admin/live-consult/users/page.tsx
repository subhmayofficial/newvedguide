import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { formatAdminDateTime } from "@/lib/admin/time";
import { checkLiveConsultSchema } from "@/lib/admin/live-consult";
import { LiveConsultSchemaMissing } from "@/components/admin/live-consult-schema-missing";
import { formatInrFromPaise } from "@/lib/format-money";

export const dynamic = "force-dynamic";

export default async function LiveConsultUsersPage() {
  const supabase = createServiceClient();
  const schema = await checkLiveConsultSchema(supabase);
  if (!schema.ok) {
    return <LiveConsultSchemaMissing message={schema.message} />;
  }

  const { data: profiles, error: pErr } = await supabase
    .from("user_profiles")
    .select("id, display_name, wallet_balance_paise, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (pErr) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-sm">
        Failed to load users: {pErr.message}
      </div>
    );
  }

  const { data: authData, error: authErr } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  const emailById = new Map<string, string>();
  if (!authErr && authData?.users) {
    for (const u of authData.users) {
      if (u.email) emailById.set(u.id, u.email);
    }
  }

  const { data: sessionCounts } = await supabase.from("chat_sessions").select("user_id");

  const chatsByUser = new Map<string, number>();
  for (const row of sessionCounts ?? []) {
    chatsByUser.set(row.user_id, (chatsByUser.get(row.user_id) ?? 0) + 1);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Live consult
          </p>
          <h1 className="font-heading text-3xl font-bold">End users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {profiles?.length ?? 0} profiles · Auth list {authErr ? "(unavailable)" : `${authData?.users?.length ?? 0} users`}
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
              <th className="px-4 py-3 font-semibold">User</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Wallet</th>
              <th className="px-4 py-3 font-semibold">Chats</th>
              <th className="px-4 py-3 font-semibold">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {(profiles ?? []).map((p) => (
              <tr key={p.id} className="hover:bg-muted/20">
                <td className="px-4 py-3">
                  <Link
                    href={`/admindeoghar/live-consult/users/${p.id}`}
                    className="font-medium hover:underline"
                  >
                    {p.display_name ?? "—"}
                  </Link>
                  <p className="font-mono text-[11px] text-muted-foreground">{p.id.slice(0, 8)}…</p>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {emailById.get(p.id) ?? "—"}
                </td>
                <td className="px-4 py-3 tabular-nums">
                  {formatInrFromPaise(p.wallet_balance_paise)}
                </td>
                <td className="px-4 py-3">{chatsByUser.get(p.id) ?? 0}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatAdminDateTime(p.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
