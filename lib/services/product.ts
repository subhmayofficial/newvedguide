import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export async function getProductBySlug(
  supabase: SupabaseClient<Database>,
  slug: string
): Promise<Database["public"]["Tables"]["products"]["Row"] | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listProducts(
  supabase: SupabaseClient<Database>
): Promise<Database["public"]["Tables"]["products"]["Row"][]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("name");
  if (error) throw error;
  return data ?? [];
}
