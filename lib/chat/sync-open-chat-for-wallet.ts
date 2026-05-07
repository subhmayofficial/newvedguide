import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  affordableChatSeconds,
  coerceWalletPaise,
  hasMinWalletForChatStart,
  remainingSecondsFromMeterAccrual,
} from "@/lib/chat/billing";
import { resolveSessionRateInr } from "@/lib/chat/astrologer-display";
import { finalizeUserChatSessionClose } from "@/lib/chat/finalize-user-chat-session-close";
import { runChatMeter } from "@/lib/chat/run-chat-meter";

type HealRow = {
  id: string;
  user_id: string;
  status: string;
  astrologer_id: string;
  rate_inr_per_min: number | null;
  last_billed_at: string | null;
  created_at: string;
};

/** Run meter; if session still open/waiting with depleted wallet, call finalize (meter can no-op fail silently). */
async function runMeterThenFinalizeIfStillStuck(
  svc: SupabaseClient<Database>,
  row: HealRow
): Promise<void> {
  const userId = row.user_id;
  const result = await runChatMeter(svc, row.id, userId);
  if (result.ok && result.sessionClosed) return;

  const { data: again } = await svc
    .from("chat_sessions")
    .select("status")
    .eq("id", row.id)
    .maybeSingle();
  if (again?.status !== "open" && again?.status !== "waiting_astrologer") return;

  const { data: profile } = await svc
    .from("user_profiles")
    .select("wallet_balance_paise")
    .eq("id", userId)
    .maybeSingle();
  const balance = coerceWalletPaise(profile?.wallet_balance_paise);
  const rate = resolveSessionRateInr(row.rate_inr_per_min, row.astrologer_id);
  const anchor = row.last_billed_at ?? row.created_at;
  const stillBadOpen =
    again.status === "open" &&
    (balance <= 0 ||
      affordableChatSeconds(balance, rate) <= 0 ||
      remainingSecondsFromMeterAccrual(balance, rate, anchor) <= 0);
  const stillBadWaiting =
    again.status === "waiting_astrologer" &&
    !hasMinWalletForChatStart(balance, rate);

  if (stillBadOpen || stillBadWaiting) {
    await finalizeUserChatSessionClose(svc, row.id, userId, {
      astrologer_id: row.astrologer_id,
      rate_inr_per_min: row.rate_inr_per_min,
    });
  }
}

function isDepletedForRow(
  status: string,
  balance: number,
  rate: number,
  anchor: string
): boolean {
  const afford = affordableChatSeconds(balance, rate);
  const remaining = remainingSecondsFromMeterAccrual(balance, rate, anchor);
  const deadOpen =
    status === "open" && (balance <= 0 || afford <= 0 || remaining <= 0);
  const deadWaiting =
    status === "waiting_astrologer" && !hasMinWalletForChatStart(balance, rate);
  return deadOpen || deadWaiting;
}

/**
 * Currently selected inbox thread: always reconcile if wallet can’t support this session.
 * (Ensures the row you’re looking at closes even if it missed the global 500 cap or meter errored.)
 */
export async function healChatSessionByIdIfDepleted(
  svc: SupabaseClient<Database>,
  sessionId: string
): Promise<void> {
  const { data: row } = await svc
    .from("chat_sessions")
    .select(
      "id, user_id, status, astrologer_id, rate_inr_per_min, last_billed_at, created_at"
    )
    .eq("id", sessionId)
    .maybeSingle();

  if (!row || (row.status !== "open" && row.status !== "waiting_astrologer")) {
    return;
  }

  const { data: profile } = await svc
    .from("user_profiles")
    .select("wallet_balance_paise")
    .eq("id", row.user_id)
    .maybeSingle();

  const balance = coerceWalletPaise(profile?.wallet_balance_paise);
  const rate = resolveSessionRateInr(row.rate_inr_per_min, row.astrologer_id);
  const anchor = row.last_billed_at ?? row.created_at;

  if (!isDepletedForRow(row.status, balance, rate, anchor)) return;

  await runMeterThenFinalizeIfStillStuck(svc, row);
}

/**
 * Close any `open` / waiting chat sessions for this user when the wallet can no longer fund chat.
 */
export async function syncOpenChatSessionsIfWalletDepleted(
  svc: SupabaseClient<Database>,
  userId: string
): Promise<void> {
  const { data: rows } = await svc
    .from("chat_sessions")
    .select("id, user_id, status, astrologer_id, rate_inr_per_min, last_billed_at, created_at")
    .eq("user_id", userId)
    .in("status", ["open", "waiting_astrologer"]);

  if (!rows?.length) return;

  for (const row of rows) {
    const { data: profile } = await svc
      .from("user_profiles")
      .select("wallet_balance_paise")
      .eq("id", userId)
      .maybeSingle();

    const balance = coerceWalletPaise(profile?.wallet_balance_paise);
    const rate = resolveSessionRateInr(row.rate_inr_per_min, row.astrologer_id);
    const anchor = row.last_billed_at ?? row.created_at;

    if (isDepletedForRow(row.status, balance, rate, anchor)) {
      await runMeterThenFinalizeIfStillStuck(svc, row);
    }
  }
}

/**
 * Scan **open** and **waiting** sessions and close when wallet can’t fund live chat or
 * can’t meet the minimum to leave the queue.
 */
export async function healStuckOpenChatsWithEmptyWallet(
  svc: SupabaseClient<Database>
): Promise<void> {
  const { data: sessions, error } = await svc
    .from("chat_sessions")
    .select(
      "id, user_id, status, astrologer_id, rate_inr_per_min, last_billed_at, created_at"
    )
    .in("status", ["open", "waiting_astrologer"])
    .limit(500);

  if (error || !sessions?.length) return;

  for (const row of sessions) {
    const { data: profile } = await svc
      .from("user_profiles")
      .select("wallet_balance_paise")
      .eq("id", row.user_id)
      .maybeSingle();

    const balance = coerceWalletPaise(profile?.wallet_balance_paise);
    const rate = resolveSessionRateInr(row.rate_inr_per_min, row.astrologer_id);
    const anchor = row.last_billed_at ?? row.created_at;

    if (isDepletedForRow(row.status, balance, rate, anchor)) {
      await runMeterThenFinalizeIfStillStuck(svc, row);
    }
  }
}
