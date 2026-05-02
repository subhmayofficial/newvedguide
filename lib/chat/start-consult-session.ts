import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { affordableChatSeconds } from "@/lib/chat/billing";
import { resolveSessionRateInr } from "@/lib/chat/astrologer-display";

const START_SYSTEM_MESSAGE =
  "Your astrologer has joined — the session timer has started. You're now on the clock at the per-minute rate.";

/**
 * Transition waiting_astrologer → open and set metering anchors from current wallet.
 * Idempotent: if already open, returns { ok: true, alreadyLive: true }.
 */
export async function startConsultSessionFromWaiting(
  svc: SupabaseClient<Database>,
  sessionId: string
): Promise<
  | { ok: true; alreadyLive: boolean }
  | { ok: false; error: string; status: number }
> {
  const trimmed = sessionId.trim();
  const { data: session, error: sErr } = await svc
    .from("chat_sessions")
    .select("id, user_id, status, astrologer_id, rate_inr_per_min")
    .eq("id", trimmed)
    .maybeSingle();

  if (sErr || !session) {
    return { ok: false, error: sErr?.message ?? "Session not found", status: 404 };
  }

  if (session.status === "open") {
    return { ok: true, alreadyLive: true };
  }

  if (session.status !== "waiting_astrologer") {
    return {
      ok: false,
      error: "Session is not waiting for an astrologer",
      status: 409,
    };
  }

  const { data: profile, error: pErr } = await svc
    .from("user_profiles")
    .select("wallet_balance_paise")
    .eq("id", session.user_id)
    .maybeSingle();

  if (pErr || !profile) {
    return {
      ok: false,
      error: pErr?.message ?? "User profile not found",
      status: 500,
    };
  }

  const rate = resolveSessionRateInr(session.rate_inr_per_min, session.astrologer_id);
  const balancePaise = profile.wallet_balance_paise ?? 0;
  const budgetSeconds = affordableChatSeconds(balancePaise, rate);
  const started = new Date().toISOString();

  const { data: updated, error: uErr } = await svc
    .from("chat_sessions")
    .update({
      status: "open",
      last_billed_at: started,
      countdown_started_at: started,
      countdown_budget_seconds: budgetSeconds,
      updated_at: started,
    })
    .eq("id", trimmed)
    .eq("status", "waiting_astrologer")
    .select("id")
    .maybeSingle();

  if (uErr) {
    return { ok: false, error: uErr.message, status: 500 };
  }

  if (!updated) {
    const { data: again } = await svc
      .from("chat_sessions")
      .select("status")
      .eq("id", trimmed)
      .maybeSingle();
    if (again?.status === "open") {
      return { ok: true, alreadyLive: true };
    }
    return {
      ok: false,
      error: "Could not start session (race or invalid state)",
      status: 409,
    };
  }

  const { error: mErr } = await svc.from("chat_messages").insert({
    session_id: trimmed,
    sender: "system",
    body: START_SYSTEM_MESSAGE,
  });

  if (mErr) {
    return { ok: false, error: mErr.message, status: 500 };
  }

  return { ok: true, alreadyLive: false };
}
