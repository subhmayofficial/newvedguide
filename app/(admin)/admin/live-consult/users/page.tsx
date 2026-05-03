import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { formatAdminDateTime } from "@/lib/admin/time";
import { checkLiveConsultSchema } from "@/lib/admin/live-consult";
import { LiveConsultSchemaMissing } from "@/components/admin/live-consult-schema-missing";
import { formatInrFromPaise } from "@/lib/format-money";
import { ArrowLeft, ArrowUpRight, MessageCircle, Search, Users, Wallet, X } from "lucide-react";

export const dynamic = "force-dynamic";

const BASE = "/admindeoghar/live-consult/users";

type SP = { q?: string; sort?: string };

function InitialsAvatar({ name, userId }: { name?: string | null; userId: string }) {
  const initials = name
    ? name.trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : userId.slice(0, 2).toUpperCase();
  const hue = (userId.charCodeAt(0) + userId.charCodeAt(1)) % 360;
  return (
    <div
      className="flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm"
      style={{ background: `oklch(0.50 0.18 ${hue})` }}
    >
      {initials}
    </div>
  );
}

export default async function LiveConsultUsersPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const supabase = createServiceClient();
  const schema = await checkLiveConsultSchema(supabase);
  if (!schema.ok) return <LiveConsultSchemaMissing message={schema.message} />;

  // Fetch profiles — filter by display_name server-side if search query provided
  let profilesQuery = supabase
    .from("user_profiles")
    .select("id, display_name, wallet_balance_paise, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (sp.q) profilesQuery = profilesQuery.ilike("display_name", `%${sp.q}%`);

  const { data: profiles, error: pErr } = await profilesQuery;

  if (pErr) {
    return (
      <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6 text-sm">
        Failed to load users: {pErr.message}
      </div>
    );
  }

  const [{ data: authData, error: authErr }, { data: sessionCounts }] = await Promise.all([
    supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    supabase.from("chat_sessions").select("user_id"),
  ]);

  const emailById = new Map<string, string>();
  if (!authErr && authData?.users) {
    for (const u of authData.users) {
      if (u.email) emailById.set(u.id, u.email);
    }
  }

  const chatsByUser = new Map<string, number>();
  for (const row of sessionCounts ?? []) {
    chatsByUser.set(row.user_id, (chatsByUser.get(row.user_id) ?? 0) + 1);
  }

  // Apply email search in-memory (can't do server-side via Supabase for auth emails)
  let list = profiles ?? [];
  if (sp.q) {
    const lq = sp.q.toLowerCase();
    list = list.filter(
      (p) =>
        (p.display_name ?? "").toLowerCase().includes(lq) ||
        (emailById.get(p.id) ?? "").toLowerCase().includes(lq)
    );
  }

  // Sort
  const sort = sp.sort ?? "newest";
  if (sort === "wallet_desc") list = [...list].sort((a, b) => (b.wallet_balance_paise ?? 0) - (a.wallet_balance_paise ?? 0));
  else if (sort === "wallet_asc") list = [...list].sort((a, b) => (a.wallet_balance_paise ?? 0) - (b.wallet_balance_paise ?? 0));
  else if (sort === "chats_desc") list = [...list].sort((a, b) => (chatsByUser.get(b.id) ?? 0) - (chatsByUser.get(a.id) ?? 0));
  else if (sort === "oldest") list = [...list].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  // "newest" is already default order from DB

  const totalWalletPaise = list.reduce((a, p) => a + (p.wallet_balance_paise ?? 0), 0);
  const hasFilter = !!sp.q;

  const sortOptions: { value: string; label: string }[] = [
    { value: "newest",      label: "Newest first" },
    { value: "oldest",      label: "Oldest first" },
    { value: "wallet_desc", label: "Wallet ↓" },
    { value: "wallet_asc",  label: "Wallet ↑" },
    { value: "chats_desc",  label: "Most chats" },
  ];

  function buildUrl(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    const merged = { ...sp, ...overrides } as Record<string, string | undefined>;
    for (const [k, v] of Object.entries(merged)) {
      if (v) p.set(k, v);
    }
    const qs = p.toString();
    return qs ? `${BASE}?${qs}` : BASE;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Live consult
          </p>
          <h1 className="mt-1 font-heading text-3xl font-bold">End users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {list.length} profile{list.length !== 1 ? "s" : ""}
            {!authErr && ` · ${authData?.users?.length ?? 0} auth accounts`}
            {hasFilter && <span className="ml-1.5 rounded-full bg-brand/12 px-2 py-0.5 text-[10px] font-bold text-brand">filtered</span>}
          </p>
        </div>
        <Link
          href="/admindeoghar/live-consult"
          className="flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
        >
          <ArrowLeft className="size-4" /> Hub
        </Link>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2.5 rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-sm">
          <div className="flex size-8 items-center justify-center rounded-lg bg-brand/10">
            <Users className="size-4 text-brand" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Users shown</p>
            <p className="text-sm font-bold tabular-nums text-foreground">{list.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/8 px-4 py-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/15">
            <Wallet className="size-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
              Total wallet
            </p>
            <p className="text-sm font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
              {formatInrFromPaise(totalWalletPaise)}
            </p>
          </div>
        </div>
      </div>

      {/* Search + sort bar */}
      <form method="GET" className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
          <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Search name / email
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              name="q"
              defaultValue={sp.q ?? ""}
              placeholder="Search users…"
              className="h-9 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Sort</label>
          <select
            name="sort"
            defaultValue={sort}
            className="h-9 rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/30"
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="h-9 rounded-xl bg-foreground px-5 text-xs font-bold text-background transition hover:opacity-80"
        >
          Apply
        </button>
        {(hasFilter || sort !== "newest") && (
          <Link
            href={BASE}
            className="flex h-9 items-center gap-1 rounded-xl border border-border px-3 text-xs font-semibold text-muted-foreground transition hover:bg-muted"
          >
            <X className="size-3.5" /> Clear
          </Link>
        )}
      </form>

      {/* User list */}
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm divide-y divide-border/40">
        {list.length === 0 && (
          <p className="px-6 py-12 text-center text-sm text-muted-foreground">
            No users {hasFilter ? "matching your search" : "found"}.
          </p>
        )}
        {list.map((p) => {
          const chats = chatsByUser.get(p.id) ?? 0;
          const email = emailById.get(p.id);
          return (
            <Link
              key={p.id}
              href={`/admindeoghar/live-consult/users/${p.id}`}
              className="flex items-center gap-4 px-5 py-4 transition hover:bg-muted/30"
            >
              <InitialsAvatar name={p.display_name} userId={p.id} />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {p.display_name ?? "Unnamed user"}
                </p>
                <p className="truncate font-mono text-[11px] text-muted-foreground">
                  {email ?? p.id.slice(0, 16) + "…"}
                </p>
              </div>

              <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
                <div className="flex items-center gap-1 rounded-lg bg-brand/8 px-2.5 py-1">
                  <Wallet className="size-3 text-brand" />
                  <span className="text-xs font-bold tabular-nums text-brand">
                    {formatInrFromPaise(p.wallet_balance_paise)}
                  </span>
                </div>
              </div>

              <div className="hidden shrink-0 items-center gap-1 sm:flex">
                <div className="flex items-center gap-1 rounded-lg bg-muted/60 px-2.5 py-1">
                  <MessageCircle className="size-3 text-muted-foreground" />
                  <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                    {chats}
                  </span>
                </div>
              </div>

              <div className="hidden shrink-0 text-right lg:block">
                <p className="text-[11px] text-muted-foreground whitespace-nowrap">
                  {formatAdminDateTime(p.created_at)}
                </p>
              </div>

              <ArrowUpRight className="size-4 shrink-0 text-muted-foreground/40" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
