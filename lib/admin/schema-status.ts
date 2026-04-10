import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/** True when v2 commerce tables/columns from 002_commerce_admin.sql exist */
export async function commerceSchemaReady(
  supabase: SupabaseClient<Database>
): Promise<boolean> {
  const { error: e1 } = await supabase.from("leads").select("id,status").limit(1);
  if (e1?.code === "42703" || e1?.code === "42P01") return false;

  const { error: e2 } = await supabase.from("customers").select("id").limit(1);
  if (e2?.code === "42P01") return false;

  const { error: e3 } = await supabase.from("events").select("id").limit(1);
  if (e3?.code === "42P01") return false;

  return true;
}
