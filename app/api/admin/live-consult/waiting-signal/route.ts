import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/admin/admin-auth";

/** Lightweight poll target for ops inbox “new customer in join queue” alerts. */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminUser(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const svc = createServiceClient();
  const { data, error } = await svc
    .from("chat_sessions")
    .select("id")
    .eq("status", "waiting_astrologer")
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    waitingIds: (data ?? []).map((r) => r.id),
  });
}
