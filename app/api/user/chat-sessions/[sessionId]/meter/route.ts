import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
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

  const svc = createServiceClient();
  const result = await runChatMeter(svc, trimmed, user.id);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const { skipped, sessionClosed, summary, ...rest } = result;
  const payload: Record<string, unknown> = { ...rest };
  if (skipped) payload.skipped = true;
  if (sessionClosed) {
    payload.sessionClosed = true;
    if (summary) payload.summary = summary;
  }
  return NextResponse.json(payload);
}
