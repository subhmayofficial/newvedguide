import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  buildUserChatCloseSummary,
  finalizeUserChatSessionClose,
} from "@/lib/chat/finalize-user-chat-session-close";
import { runChatMeter } from "@/lib/chat/run-chat-meter";

type Params = { params: Promise<{ sessionId: string }> };

export async function POST(_request: Request, { params }: Params) {
  const { sessionId } = await params;
  const trimmed = sessionId?.trim();
  if (!trimmed) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: owned, error: oErr } = await supabase
    .from("chat_sessions")
    .select("id, status, astrologer_id, rate_inr_per_min")
    .eq("id", trimmed)
    .eq("user_id", user.id)
    .maybeSingle();

  if (oErr || !owned) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const svc = createServiceClient();
  const ownedSnap = {
    astrologer_id: owned.astrologer_id,
    rate_inr_per_min: owned.rate_inr_per_min,
  };

  if (owned.status === "closed") {
    const built = await buildUserChatCloseSummary(svc, trimmed, user.id, ownedSnap);
    if (!built.ok) {
      return NextResponse.json({ error: built.error }, { status: built.status });
    }
    return NextResponse.json({ ok: true, summary: built.summary });
  }

  if (owned.status === "open") {
    const metered = await runChatMeter(svc, trimmed, user.id);
    if (!metered.ok) {
      return NextResponse.json({ error: metered.error }, { status: metered.status });
    }
    if (metered.sessionClosed && metered.summary) {
      return NextResponse.json({ ok: true, summary: metered.summary });
    }
  }

  const fin = await finalizeUserChatSessionClose(svc, trimmed, user.id, ownedSnap);
  if (!fin.ok) {
    return NextResponse.json({ error: fin.error }, { status: fin.status });
  }

  return NextResponse.json({ ok: true, summary: fin.summary });
}
