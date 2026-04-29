import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type AdminEmailAutomationRow = Database["public"]["Tables"]["admin_email_automations"]["Row"];

export async function listAdminEmailAutomations(
  supabase: SupabaseClient<Database>
): Promise<{
  data: AdminEmailAutomationRow[];
  errorCode: string | null;
  errorMessage: string | null;
}> {
  const { data, error } = await supabase
    .from("admin_email_automations")
    .select("id,automation_key,label,description,is_enabled,template_name,created_at,updated_at")
    .order("created_at", { ascending: true });

  return {
    data: (data as AdminEmailAutomationRow[] | null) ?? [],
    errorCode: error?.code ?? null,
    errorMessage: error?.message ?? null,
  };
}

export async function upsertAdminEmailAutomation(
  supabase: SupabaseClient<Database>,
  input: {
    automationKey: string;
    label: string;
    description?: string | null;
    isEnabled: boolean;
    templateName: string;
  }
): Promise<void> {
  const row: Database["public"]["Tables"]["admin_email_automations"]["Insert"] = {
    automation_key: input.automationKey,
    label: input.label,
    description: input.description ?? null,
    is_enabled: input.isEnabled,
    template_name: input.templateName,
  };
  const { error } = await supabase
    .from("admin_email_automations")
    .upsert(row, { onConflict: "automation_key" });
  if (error) throw error;
}
