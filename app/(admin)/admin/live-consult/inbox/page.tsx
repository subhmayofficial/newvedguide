import { Suspense } from "react";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { checkLiveConsultSchema } from "@/lib/admin/live-consult";
import { LiveConsultSchemaMissing } from "@/components/admin/live-consult-schema-missing";
import { LiveConsultInbox } from "@/components/admin/live-consult-inbox";
import type { Database } from "@/types/database";

export const dynamic = "force-dynamic";

type ProfileLite = Pick<
  Database["public"]["Tables"]["user_profiles"]["Row"],
  "display_name" | "avatar_url"
>;

function InboxFallback() {
  return (
    <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-border/60 bg-card text-sm text-muted-foreground">
      Loading inbox…
    </div>
  );
}

export default async function LiveConsultInboxPage({
  searchParams,
}: {
  searchParams: Promise<{ sid?: string }>;
}) {
  const sp = await searchParams;
  const selectedSid = sp.sid?.trim() ?? null;

  const supabase = createServiceClient();
  const schema = await checkLiveConsultSchema(supabase);
  if (!schema.ok) {
    return <LiveConsultSchemaMissing message={schema.message} />;
  }

  const { data: sessions, error } = await supabase
    .from("chat_sessions")
    .select(
      "id, user_id, astrologer_id, status, order_code, total_billed_paise, updated_at, created_at, rate_inr_per_min, last_billed_at"
    )
    .order("updated_at", { ascending: false })
    .limit(250);

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-sm">
        Failed to load sessions: {error.message}
      </div>
    );
  }

  const list = sessions ?? [];
  const userIds = [...new Set(list.map((s) => s.user_id))];
  const { data: profiles } =
    userIds.length > 0
      ? await supabase
          .from("user_profiles")
          .select("id, display_name, avatar_url")
          .in("id", userIds)
      : { data: [] as { id: string; display_name: string | null; avatar_url: string | null }[] };

  const profileByUserId: Record<string, ProfileLite> = {};
  for (const row of profiles ?? []) {
    profileByUserId[row.id] = {
      display_name: row.display_name,
      avatar_url: row.avatar_url,
    };
  }

  let initialWalletPaiseForSelected = 0;
  if (selectedSid) {
    const sel = list.find((s) => s.id === selectedSid);
    if (sel) {
      const { data: pw } = await supabase
        .from("user_profiles")
        .select("wallet_balance_paise")
        .eq("id", sel.user_id)
        .maybeSingle();
      initialWalletPaiseForSelected = pw?.wallet_balance_paise ?? 0;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Live consult
          </p>
          <h1 className="font-heading text-3xl font-bold">Chat inbox</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Select a thread and reply — messages sync automatically.
          </p>
        </div>
        <Link
          href="/admindeoghar/live-consult/sessions"
          className="text-sm font-medium text-brand hover:underline"
        >
          All sessions →
        </Link>
      </div>

      <Suspense fallback={<InboxFallback />}>
        <LiveConsultInbox
          sessions={list}
          profileByUserId={profileByUserId}
          serverSelectedSessionId={selectedSid}
          initialWalletPaiseForSelected={initialWalletPaiseForSelected}
        />
      </Suspense>
    </div>
  );
}
