"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";

export async function adminPostAstrologerMessage(formData: FormData): Promise<void> {
  const sessionId = String(formData.get("sessionId") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!sessionId || !body) return;

  const supabase = createServiceClient();
  const { error } = await supabase.from("chat_messages").insert({
    session_id: sessionId,
    sender: "astrologer",
    body,
  });

  if (error) return;

  revalidatePath(`/astro-ops/sessions/${sessionId}`);
  revalidatePath("/astro-ops/sessions");
  revalidatePath("/astro-ops/inbox");
}

export async function adminSetSessionStatus(formData: FormData): Promise<void> {
  const sessionId = String(formData.get("sessionId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  if (!sessionId || (status !== "open" && status !== "closed")) return;

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("chat_sessions")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", sessionId);

  if (error) return;

  revalidatePath(`/astro-ops/sessions/${sessionId}`);
  revalidatePath("/astro-ops/sessions");
  revalidatePath("/astro-ops/inbox");
  revalidatePath("/astro-ops");
}
