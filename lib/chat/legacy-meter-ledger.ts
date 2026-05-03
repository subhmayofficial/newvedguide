import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/** True if this session already has per-tick `live_chat_meter` rows (pre-consolidation billing). */
export async function sessionHasLegacyMeterLedger(
  svc: SupabaseClient<Database>,
  sessionId: string
): Promise<boolean> {
  const sid = sessionId.trim();
  const filtered = await svc
    .from("wallet_ledger")
    .select("id")
    .eq("reason", "live_chat_meter")
    .filter("metadata->>session_id", "eq", sid)
    .limit(1);

  if (!filtered.error && (filtered.data?.length ?? 0) > 0) {
    return true;
  }

  const { data, error } = await svc
    .from("wallet_ledger")
    .select("metadata")
    .eq("reason", "live_chat_meter")
    .limit(300);

  if (error || !data?.length) return false;
  return data.some((row) => {
    const m = row.metadata as { session_id?: string } | null;
    return m?.session_id === sid;
  });
}

export async function sessionHasCloseSummaryLedger(
  svc: SupabaseClient<Database>,
  userId: string,
  sessionId: string
): Promise<boolean> {
  const sid = sessionId.trim();
  const filtered = await svc
    .from("wallet_ledger")
    .select("id")
    .eq("user_id", userId)
    .eq("reason", "live_chat_session")
    .filter("metadata->>session_id", "eq", sid)
    .limit(1);

  return !filtered.error && (filtered.data?.length ?? 0) > 0;
}
