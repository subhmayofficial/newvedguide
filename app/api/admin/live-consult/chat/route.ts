import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/admin/admin-auth";
import { resolveSessionRateInr } from "@/lib/chat/astrologer-display";
import {
  affordableChatSeconds,
  remainingSecondsFromMeterAccrual,
} from "@/lib/chat/billing";
import type { Database } from "@/types/database";

type ChatMessage = Database["public"]["Tables"]["chat_messages"]["Row"];

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminUser(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId")?.trim();
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  const svc = createServiceClient();
  const { data: session, error: sErr } = await svc
    .from("chat_sessions")
    .select(
      "id, user_id, astrologer_id, status, rate_inr_per_min, countdown_started_at, countdown_budget_seconds, last_billed_at, created_at"
    )
    .eq("id", sessionId)
    .maybeSingle();

  if (sErr || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const { data: messages, error: mErr } = await svc
    .from("chat_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (mErr) {
    return NextResponse.json({ error: mErr.message }, { status: 500 });
  }

  const { data: profile } = await svc
    .from("user_profiles")
    .select("wallet_balance_paise, display_name, avatar_url")
    .eq("id", session.user_id)
    .maybeSingle();

  const rateInrPerMin = resolveSessionRateInr(
    session.rate_inr_per_min,
    session.astrologer_id
  );

  const balancePaise = profile?.wallet_balance_paise ?? 0;
  const meterAnchor = session.last_billed_at ?? session.created_at;
  const remainingSeconds =
    session.status === "waiting_astrologer"
      ? affordableChatSeconds(balancePaise, rateInrPerMin)
      : remainingSecondsFromMeterAccrual(balancePaise, rateInrPerMin, meterAnchor);

  return NextResponse.json({
    session,
    messages: messages as ChatMessage[],
    wallet: {
      balancePaise,
      displayName: profile?.display_name,
      avatarUrl: profile?.avatar_url,
    },
    rateInrPerMin,
    remainingSeconds,
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminUser(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sessionId =
    typeof body === "object" &&
    body !== null &&
    "sessionId" in body &&
    typeof (body as { sessionId: unknown }).sessionId === "string"
      ? (body as { sessionId: string }).sessionId.trim()
      : "";

  const text =
    typeof body === "object" &&
    body !== null &&
    "body" in body &&
    typeof (body as { body: unknown }).body === "string"
      ? (body as { body: string }).body.trim()
      : "";

  if (!sessionId || !text) {
    return NextResponse.json({ error: "sessionId and body required" }, { status: 400 });
  }

  const svc = createServiceClient();

  const { data: sessRow } = await svc
    .from("chat_sessions")
    .select("status")
    .eq("id", sessionId)
    .maybeSingle();

  if (sessRow?.status === "waiting_astrologer") {
    return NextResponse.json(
      {
        error:
          "Join the chat first (Join button in admin) — the user is still in the queue.",
      },
      { status: 409 }
    );
  }

  const { error } = await svc.from("chat_messages").insert({
    session_id: sessionId,
    sender: "astrologer",
    body: text,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
