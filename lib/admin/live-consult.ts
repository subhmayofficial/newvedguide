import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { isSupabaseTableMissingError } from "@/lib/supabase/schema-errors";
import { LIVE_CHAT_ASTROLOGERS } from "@/lib/data/live-chat-astrologers";

export type LiveConsultSchemaResult =
  | { ok: true }
  | { ok: false; message: string };

export async function checkLiveConsultSchema(
  supabase: SupabaseClient<Database>
): Promise<LiveConsultSchemaResult> {
  const { error } = await supabase.from("user_profiles").select("id").limit(1);
  if (error && isSupabaseTableMissingError(error.message)) {
    return {
      ok: false,
      message:
        "Tables not found. Run migration 026_user_wallet_chat.sql in Supabase, then refresh.",
    };
  }
  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true };
}

export function astrologerLabel(astrologerId: string): string {
  return LIVE_CHAT_ASTROLOGERS.find((a) => a.id === astrologerId)?.name ?? astrologerId;
}
