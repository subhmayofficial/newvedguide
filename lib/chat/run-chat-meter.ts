import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  affordableChatSeconds,
  paiseBurnedInInterval,
  remainingSecondsFromMeterAccrual,
} from "@/lib/chat/billing";
import { resolveSessionRateInr } from "@/lib/chat/astrologer-display";
import { isSupabaseUnknownColumnError } from "@/lib/supabase/schema-errors";

const MAX_CATCHUP_SECONDS = 600;

export type RunChatMeterOk = {
  ok: true;
  balancePaise: number;
  last_billed_at: string;
  remainingSeconds: number;
  skipped?: boolean;
};

export type RunChatMeterErr = {
  ok: false;
  error: string;
  status: number;
};

export type RunChatMeterResult = RunChatMeterOk | RunChatMeterErr;

export async function runChatMeter(
  svc: SupabaseClient<Database>,
  sessionId: string,
  userId: string
): Promise<RunChatMeterResult> {
  const trimmed = sessionId.trim();
  const { data: session, error: sErr } = await svc
    .from("chat_sessions")
    .select(
      "id, user_id, status, astrologer_id, rate_inr_per_min, created_at, last_billed_at"
    )
    .eq("id", trimmed)
    .eq("user_id", userId)
    .maybeSingle();

  if (sErr) {
    if (isSupabaseUnknownColumnError(sErr.message, "last_billed_at")) {
      return {
        ok: false,
        error: "Apply migration 031_chat_session_metering.sql for billing.",
        status: 503,
      };
    }
    return { ok: false, error: sErr.message, status: 500 };
  }

  if (!session) {
    return { ok: false, error: "Session not found", status: 404 };
  }

  const rate = resolveSessionRateInr(session.rate_inr_per_min, session.astrologer_id);
  const anchorIso = session.last_billed_at ?? session.created_at;

  const { data: profile, error: pErr } = await svc
    .from("user_profiles")
    .select("wallet_balance_paise")
    .eq("id", userId)
    .maybeSingle();

  if (pErr || !profile) {
    return {
      ok: false,
      error: pErr?.message ?? "Profile not found",
      status: 500,
    };
  }

  let balance = profile.wallet_balance_paise;
  const newLastIso = new Date().toISOString();

  if (session.status !== "open") {
    const remainingSeconds =
      session.status === "waiting_astrologer"
        ? affordableChatSeconds(balance, rate)
        : remainingSecondsFromMeterAccrual(balance, rate, anchorIso);
    return {
      ok: true,
      skipped: true,
      balancePaise: balance,
      last_billed_at: anchorIso,
      remainingSeconds,
    };
  }

  const lastMs = new Date(anchorIso).getTime();
  let deltaSec = Math.floor((Date.now() - lastMs) / 1000);
  deltaSec = Math.min(MAX_CATCHUP_SECONDS, Math.max(0, deltaSec));

  const accrued = paiseBurnedInInterval(deltaSec, rate);
  const charge = Math.min(balance, accrued);

  if (charge > 0) {
    const nextBal = balance - charge;
    const { error: uErr } = await svc
      .from("user_profiles")
      .update({
        wallet_balance_paise: nextBal,
        updated_at: newLastIso,
      })
      .eq("id", userId);

    if (uErr) {
      return { ok: false, error: uErr.message, status: 500 };
    }

    const { error: lErr } = await svc.from("wallet_ledger").insert({
      user_id: userId,
      delta_paise: -charge,
      reason: "live_chat_meter",
      metadata: { session_id: trimmed, seconds: deltaSec, rate_inr_per_min: rate },
    });

    if (lErr) {
      await svc
        .from("user_profiles")
        .update({
          wallet_balance_paise: balance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
      return { ok: false, error: lErr.message, status: 500 };
    }

    balance = nextBal;
  }

  const { error: sessErr } = await svc
    .from("chat_sessions")
    .update({ last_billed_at: newLastIso, updated_at: newLastIso })
    .eq("id", trimmed);

  if (sessErr) {
    if (isSupabaseUnknownColumnError(sessErr.message, "last_billed_at")) {
      return {
        ok: false,
        error: "Apply migration 031_chat_session_metering.sql for billing.",
        status: 503,
      };
    }
    return { ok: false, error: sessErr.message, status: 500 };
  }

  return {
    ok: true,
    balancePaise: balance,
    last_billed_at: newLastIso,
    remainingSeconds: remainingSecondsFromMeterAccrual(balance, rate, newLastIso),
  };
}
