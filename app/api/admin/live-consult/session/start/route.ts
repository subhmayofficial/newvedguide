import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/admin/admin-auth";
import { startConsultSessionFromWaiting } from "@/lib/chat/start-consult-session";

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

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  const svc = createServiceClient();
  const result = await startConsultSessionFromWaiting(svc, sessionId);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  revalidatePath("/admindeoghar/live-consult/inbox");
  revalidatePath("/admindeoghar/live-consult/sessions");
  revalidatePath(`/admindeoghar/live-consult/sessions/${sessionId}`);
  revalidatePath("/admindeoghar/live-consult");
  revalidatePath("/astrologers/chats");
  revalidatePath(`/astrologers/chats/${sessionId}`);
  revalidatePath(`/astrologers/chats/waiting/${sessionId}`);

  return NextResponse.json({ ok: true, alreadyLive: result.alreadyLive });
}
