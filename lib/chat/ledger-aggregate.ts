import type { Database } from "@/types/database";

export type LedgerRowLite = Pick<
  Database["public"]["Tables"]["wallet_ledger"]["Row"],
  "delta_paise" | "metadata"
>;

/** Sum meter charges for one chat session from wallet_ledger rows. */
export function aggregateLiveChatMeterForSession(
  rows: LedgerRowLite[],
  sessionId: string
): { totalBilledPaise: number; billedSeconds: number } {
  let totalBilledPaise = 0;
  let billedSeconds = 0;
  for (const r of rows) {
    if (r.delta_paise >= 0) continue;
    const m = r.metadata as { session_id?: string; seconds?: number } | null;
    if (!m || m.session_id !== sessionId) continue;
    totalBilledPaise += Math.abs(r.delta_paise);
    billedSeconds += Math.max(0, Math.floor(Number(m.seconds ?? 0)));
  }
  return { totalBilledPaise, billedSeconds };
}
