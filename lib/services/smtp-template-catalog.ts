import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type SavedSmtpTemplateRow = Database["public"]["Tables"]["admin_smtp_templates"]["Row"];

export type SavedSmtpTemplate = {
  id: string;
  name: string;
  subject: string;
  html: string;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SavedSmtpTemplateInput = {
  name: string;
  subject: string;
  html: string;
  notes?: string | null;
  isActive?: boolean;
};

export function mapSavedSmtpTemplate(row: SavedSmtpTemplateRow): SavedSmtpTemplate {
  return {
    id: row.id,
    name: row.name,
    subject: row.subject,
    html: row.html,
    notes: row.notes,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listSavedSmtpTemplates(
  supabase: SupabaseClient<Database>
): Promise<{
  data: SavedSmtpTemplate[];
  errorCode: string | null;
  errorMessage: string | null;
}> {
  const { data, error } = await supabase
    .from("admin_smtp_templates")
    .select("id,name,subject,html,notes,is_active,created_at,updated_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  return {
    data: ((data as SavedSmtpTemplateRow[] | null) ?? []).map(mapSavedSmtpTemplate),
    errorCode: error?.code ?? null,
    errorMessage: error?.message ?? null,
  };
}

export async function upsertSavedSmtpTemplate(
  supabase: SupabaseClient<Database>,
  input: SavedSmtpTemplateInput
): Promise<void> {
  const row: Database["public"]["Tables"]["admin_smtp_templates"]["Insert"] = {
    name: input.name.trim(),
    subject: input.subject.trim(),
    html: input.html,
    notes: input.notes?.trim() || null,
    is_active: input.isActive ?? true,
  };
  const { error } = await supabase.from("admin_smtp_templates").upsert(row, { onConflict: "name" });
  if (error) throw error;
}

export async function updateSavedSmtpTemplateById(
  supabase: SupabaseClient<Database>,
  id: string,
  input: SavedSmtpTemplateInput
): Promise<void> {
  const row: Database["public"]["Tables"]["admin_smtp_templates"]["Update"] = {
    name: input.name.trim(),
    subject: input.subject.trim(),
    html: input.html,
    notes: input.notes?.trim() || null,
  };
  if (typeof input.isActive === "boolean") {
    row.is_active = input.isActive;
  }
  const { error } = await supabase.from("admin_smtp_templates").update(row).eq("id", id);
  if (error) throw error;
}

