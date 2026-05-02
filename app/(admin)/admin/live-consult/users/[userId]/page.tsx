import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { formatAdminDateTime } from "@/lib/admin/time";
import { checkLiveConsultSchema, astrologerLabel } from "@/lib/admin/live-consult";
import { LiveConsultSchemaMissing } from "@/components/admin/live-consult-schema-missing";
import { formatInrFromPaise } from "@/lib/format-money";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ userId: string }> };

export default async function LiveConsultUserDetailPage({ params }: Props) {
  const { userId } = await params;
  const supabase = createServiceClient();
  const schema = await checkLiveConsultSchema(supabase);
  if (!schema.ok) {
    return <LiveConsultSchemaMissing message={schema.message} />;
  }

  const { data: profile, error: pErr } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (pErr || !profile) {
    notFound();
  }

  const { data: authUser } = await supabase.auth.admin.getUserById(userId);

  const [ledgerRes, sessionsRes] = await Promise.all([
    supabase
      .from("wallet_ledger")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("chat_sessions")
      .select("id, astrologer_id, status, created_at, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
  ]);

  const email = authUser?.user?.email ?? "—";
  const lastSignIn = authUser?.user?.last_sign_in_at;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Live consult · User
          </p>
          <h1 className="font-heading text-3xl font-bold">
            {profile.display_name ?? "Unnamed"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{email}</p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">{userId}</p>
        </div>
        <Link
          href="/admindeoghar/live-consult/users"
          className="text-sm font-medium text-brand hover:underline"
        >
          ← All users
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Wallet balance
          </p>
          <p className="mt-2 font-heading text-2xl font-bold tabular-nums">
            {formatInrFromPaise(profile.wallet_balance_paise)}
          </p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Chat sessions
          </p>
          <p className="mt-2 font-heading text-2xl font-bold tabular-nums">
            {sessionsRes.data?.length ?? 0}
          </p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Last sign-in
          </p>
          <p className="mt-2 text-sm font-medium">
            {lastSignIn ? formatAdminDateTime(lastSignIn) : "—"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Joined {formatAdminDateTime(profile.created_at)}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold">Chat sessions</h2>
        <ul className="mt-4 divide-y divide-border/50">
          {(sessionsRes.data ?? []).length === 0 ? (
            <li className="py-6 text-sm text-muted-foreground">No chats yet.</li>
          ) : (
            (sessionsRes.data ?? []).map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div>
                  <Link
                    href={`/admindeoghar/live-consult/inbox?sid=${encodeURIComponent(s.id)}`}
                    className="font-medium hover:underline"
                  >
                    {astrologerLabel(s.astrologer_id)}
                  </Link>
                  <p className="font-mono text-[11px] text-muted-foreground">{s.id}</p>
                </div>
                <div className="text-right">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px]">{s.status}</span>
                  <p className="text-xs text-muted-foreground">
                    {formatAdminDateTime(s.updated_at)}
                  </p>
                </div>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold">Wallet history</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-border/60">
                <th className="py-2 pr-4 font-semibold">When</th>
                <th className="py-2 pr-4 font-semibold">Reason</th>
                <th className="py-2 font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {(ledgerRes.data ?? []).length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 text-muted-foreground">
                    No ledger entries.
                  </td>
                </tr>
              ) : (
                (ledgerRes.data ?? []).map((row) => (
                  <tr key={row.id}>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {formatAdminDateTime(row.created_at)}
                    </td>
                    <td className="py-2 pr-4">{row.reason}</td>
                    <td
                      className={`py-2 tabular-nums ${row.delta_paise >= 0 ? "text-emerald-600" : "text-destructive"}`}
                    >
                      {row.delta_paise >= 0 ? "+" : ""}
                      {formatInrFromPaise(Math.abs(row.delta_paise))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
