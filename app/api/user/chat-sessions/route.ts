import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { LIVE_CHAT_ASTROLOGERS } from "@/lib/data/live-chat-astrologers";
import {
  affordableChatSeconds,
  hasMinWalletForChatStart,
  minWalletPaiseForChatStart,
} from "@/lib/chat/billing";
import {
  isSupabaseTableMissingError,
  isSupabaseUnknownColumnError,
  SCHEMA_NOT_READY_USER_MESSAGE,
} from "@/lib/supabase/schema-errors";

function isCheckConstraintStatusError(message: string): boolean {
  return (
    message.includes("chat_sessions_status_check") ||
    (message.includes("violates check constraint") && message.includes("status"))
  );
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const astrologerId =
    typeof body === "object" &&
    body !== null &&
    "astrologerId" in body &&
    typeof (body as { astrologerId: unknown }).astrologerId === "string"
      ? (body as { astrologerId: string }).astrologerId.trim()
      : "";

  const astro = LIVE_CHAT_ASTROLOGERS.find((a) => a.id === astrologerId);
  if (!astro) {
    return NextResponse.json({ error: "Unknown astrologer" }, { status: 400 });
  }

  const svc = createServiceClient();
  // Fetch wallet balance + DB rate override in parallel
  const [{ data: prof }, { data: astroConfig }] = await Promise.all([
    svc.from("user_profiles").select("wallet_balance_paise").eq("id", user.id).maybeSingle(),
    svc.from("astrologer_configs").select("rate_inr_per_min").eq("id", astrologerId).maybeSingle(),
  ]);
  const balancePaise = prof?.wallet_balance_paise ?? 0;
  // DB rate takes precedence over static fallback
  const rate = astroConfig?.rate_inr_per_min ?? astro.chatRateInrPerMin;
  if (!hasMinWalletForChatStart(balancePaise, rate)) {
    const needPaise = minWalletPaiseForChatStart(rate);
    return NextResponse.json(
      {
        code: "INSUFFICIENT_BALANCE_FOR_CHAT" as const,
        error:
          "Add minimum 5 min of balance to start a chat — recharge your wallet.",
        minPaise: needPaise,
        rateInrPerMin: rate,
      },
      { status: 402 }
    );
  }
  const budgetSeconds = affordableChatSeconds(balancePaise, rate);
  const started = new Date().toISOString();

  const insertWaiting = {
    user_id: user.id,
    astrologer_id: astrologerId,
    status: "waiting_astrologer" as const,
    rate_inr_per_min: rate,
  };

  const insertLiveFull = {
    user_id: user.id,
    astrologer_id: astrologerId,
    status: "open" as const,
    rate_inr_per_min: rate,
    countdown_started_at: started,
    countdown_budget_seconds: budgetSeconds,
    last_billed_at: started,
  };
  const insertLiveNoLastBilled = {
    user_id: user.id,
    astrologer_id: astrologerId,
    status: "open" as const,
    rate_inr_per_min: rate,
    countdown_started_at: started,
    countdown_budget_seconds: budgetSeconds,
  };
  const insertLiveRateLastBilled = {
    user_id: user.id,
    astrologer_id: astrologerId,
    status: "open" as const,
    rate_inr_per_min: rate,
    last_billed_at: started,
  };
  const insertLiveRateOnly = {
    user_id: user.id,
    astrologer_id: astrologerId,
    status: "open" as const,
    rate_inr_per_min: rate,
  };
  const insertLegacy = {
    user_id: user.id,
    astrologer_id: astrologerId,
    status: "open" as const,
  };

  let session: { id: string } | null = null;
  let insertError: { message: string } | null = null;

  let waitRes = await svc.from("chat_sessions").insert(insertWaiting).select("id").single();

  if (!waitRes.error && waitRes.data) {
    session = waitRes.data;
  } else if (waitRes.error) {
    const wMsg = waitRes.error.message ?? "";

    if (isCheckConstraintStatusError(wMsg)) {
      let live = await svc.from("chat_sessions").insert(insertLiveFull).select("id").single();
      if (live.error && isSupabaseUnknownColumnError(live.error.message, "last_billed_at")) {
        live = await svc.from("chat_sessions").insert(insertLiveNoLastBilled).select("id").single();
      }
      if (!live.error && live.data) {
        session = live.data;
      } else if (live.error) {
        if (isSupabaseUnknownColumnError(live.error.message, "countdown_started_at")) {
          let mid = await svc
            .from("chat_sessions")
            .insert(insertLiveRateLastBilled)
            .select("id")
            .single();
          if (mid.error && isSupabaseUnknownColumnError(mid.error.message, "last_billed_at")) {
            mid = await svc.from("chat_sessions").insert(insertLiveRateOnly).select("id").single();
          }
          if (!mid.error && mid.data) session = mid.data;
          else if (
            mid.error &&
            isSupabaseUnknownColumnError(mid.error.message, "rate_inr_per_min")
          ) {
            const leg = await svc.from("chat_sessions").insert(insertLegacy).select("id").single();
            if (!leg.error && leg.data) session = leg.data;
            else insertError = leg.error ?? mid.error;
          } else {
            insertError = mid.error ?? live.error;
          }
        } else if (isSupabaseUnknownColumnError(live.error.message, "rate_inr_per_min")) {
          const leg = await svc.from("chat_sessions").insert(insertLegacy).select("id").single();
          if (!leg.error && leg.data) session = leg.data;
          else insertError = leg.error ?? live.error;
        } else {
          insertError = live.error;
        }
      }
    } else if (isSupabaseUnknownColumnError(wMsg, "rate_inr_per_min")) {
      const leg = await svc.from("chat_sessions").insert(insertLegacy).select("id").single();
      if (!leg.error && leg.data) session = leg.data;
      else insertError = leg.error ?? waitRes.error;
    } else {
      insertError = waitRes.error;
    }
  }

  if (!session) {
    const msg = insertError?.message ?? "Failed to create session";
    if (isSupabaseTableMissingError(msg)) {
      return NextResponse.json(
        { code: "SCHEMA_NOT_READY" as const, error: SCHEMA_NOT_READY_USER_MESSAGE },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const { error: msgErr } = await svc.from("chat_messages").insert({
    session_id: session.id,
    sender: "system",
    body: "You're in the waiting room. An astrologer usually joins within 1–2 minutes — your paid timer starts only after they connect. Thanks for waiting.",
  });

  if (msgErr) {
    const msg = msgErr.message ?? "";
    if (isSupabaseTableMissingError(msg)) {
      await svc.from("chat_sessions").delete().eq("id", session.id);
      return NextResponse.json(
        { code: "SCHEMA_NOT_READY" as const, error: SCHEMA_NOT_READY_USER_MESSAGE },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: msg || "Failed to initialize chat" },
      { status: 500 }
    );
  }

  return NextResponse.json({ sessionId: session.id });
}
