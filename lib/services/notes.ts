import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export async function addEntityNote(
  supabase: SupabaseClient<Database>,
  input: {
    entityType: string;
    entityId: string;
    note: string;
    createdBy?: string | null;
  }
): Promise<Database["public"]["Tables"]["notes"]["Row"]> {
  const row: Database["public"]["Tables"]["notes"]["Insert"] = {
    entity_type: input.entityType,
    entity_id: input.entityId,
    note: input.note,
    created_by: input.createdBy ?? null,
  };
  const { data, error } = await supabase.from("notes").insert(row).select().single();
  if (error) throw error;
  return data;
}

export async function listEntityNotes(
  supabase: SupabaseClient<Database>,
  entityType: string,
  entityId: string
): Promise<Database["public"]["Tables"]["notes"]["Row"][]> {
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
