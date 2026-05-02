import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { formatAdminDateTime } from "@/lib/admin/time";
import { checkLiveConsultSchema, astrologerLabel } from "@/lib/admin/live-consult";
import { LiveConsultSchemaMissing } from "@/components/admin/live-consult-schema-missing";
import { formatInrFromPaise } from "@/lib/format-money";

export const dynamic = "force-dynamic";

export default async function LiveConsultHubPage() {
  const supabase = createServiceClient();
  const schema = await checkLiveConsultSchema(supabase);
  if (!schema.ok) {
    return <LiveConsultSchemaMissing message={schema.message} />;
  }

  const [
    { count: userCount },
    { count: sessionCount },
    { count: openSessions },
    { count: waitingSessions },
    { data: recentSessions },
    { data: recentLedger },
  ] = await Promise.all([
    supabase.from("user_profiles").select("id", { count: "exact", head: true }),
    supabase.from("chat_sessions").select("id", { count: "exact", head: true }),
    supabase.from("chat_sessions").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase
      .from("chat_sessions")
      .select("id", { count: "exact", head: true })
      .eq("status", "waiting_astrologer"),
    supabase
      .from("chat_sessions")
      .select("id, user_id, astrologer_id, status, updated_at")
      .order("updated_at", { ascending: false })
      .limit(12),
    supabase
      .from("wallet_ledger")
      .select("id, user_id, delta_paise, reason, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const links = [
    { href: "/admindeoghar/live-consult/inbox", label: "Chat inbox", desc: "Pick a thread and reply in one place" },
    { href: "/admindeoghar/live-consult/users", label: "End users", desc: "Profiles, wallet, activity" },
    { href: "/admindeoghar/live-consult/sessions", label: "Chat sessions", desc: "All conversations (table)" },
    { href: "/admindeoghar/live-consult/wallet-ledger", label: "Wallet ledger", desc: "Top-ups and balance deltas" },
  ];

  return (
    <div className="space-y-10">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Live consult
        </p>
        <h1 className="font-heading text-3xl font-bold tracking-tight">Hub</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Wallet, chat sessions, and end-user accounts for /astrologers
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Registered users
          </p>
          <p className="mt-2 font-heading text-3xl font-bold tabular-nums">{userCount ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Chat sessions
          </p>
          <p className="mt-2 font-heading text-3xl font-bold tabular-nums">{sessionCount ?? 0}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {openSessions ?? 0} live ·{" "}
            <span className="font-semibold text-amber-700 dark:text-amber-400">
              {waitingSessions ?? 0} waiting for astrologer
            </span>
          </p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Quick links
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="font-medium text-brand hover:underline">
                  {l.label}
                </Link>
                <p className="text-xs text-muted-foreground">{l.desc}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold">Recent sessions</h2>
            <Link
              href="/admindeoghar/live-consult/sessions"
              className="text-sm font-medium text-brand hover:underline"
            >
              View all
            </Link>
          </div>
          <ul className="divide-y divide-border/50">
            {(recentSessions ?? []).length === 0 ? (
              <li className="py-6 text-sm text-muted-foreground">No sessions yet.</li>
            ) : (
              (recentSessions ?? []).map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <div>
                    <Link
                      href={`/admindeoghar/live-consult/inbox?sid=${encodeURIComponent(s.id)}`}
                      className={`font-medium hover:underline ${
                        s.status === "waiting_astrologer"
                          ? "text-amber-800 dark:text-amber-300"
                          : ""
                      }`}
                    >
                      {astrologerLabel(s.astrologer_id)}
                      {s.status === "waiting_astrologer" ? " · needs join" : ""}
                    </Link>
                    <p className="text-xs text-muted-foreground font-mono">{s.id.slice(0, 8)}…</p>
                  </div>
                  <div className="text-right">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium">
                      {s.status}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {formatAdminDateTime(s.updated_at)}
                    </p>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold">Recent wallet activity</h2>
            <Link
              href="/admindeoghar/live-consult/wallet-ledger"
              className="text-sm font-medium text-brand hover:underline"
            >
              Full ledger
            </Link>
          </div>
          <ul className="divide-y divide-border/50">
            {(recentLedger ?? []).length === 0 ? (
              <li className="py-6 text-sm text-muted-foreground">No ledger rows yet.</li>
            ) : (
              (recentLedger ?? []).map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-2 py-3 text-sm">
                  <div>
                    <Link
                      href={`/admindeoghar/live-consult/users/${row.user_id}`}
                      className="font-mono text-xs hover:underline"
                    >
                      {row.user_id.slice(0, 8)}…
                    </Link>
                    <p className="text-xs text-muted-foreground">{row.reason}</p>
                  </div>
                  <div className="text-right tabular-nums">
                    <span className={row.delta_paise >= 0 ? "text-emerald-600" : "text-destructive"}>
                      {row.delta_paise >= 0 ? "+" : ""}
                      {formatInrFromPaise(Math.abs(row.delta_paise))}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {formatAdminDateTime(row.created_at)}
                    </p>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}
