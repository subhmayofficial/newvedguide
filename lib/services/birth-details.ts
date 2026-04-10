import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export interface SaveBirthDetailsInput {
  customerId?: string | null;
  leadId?: string | null;
  fullName?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  timeOfBirth?: string | null;
  birthPlace?: string | null;
  birthCity?: string | null;
  birthState?: string | null;
  birthCountry?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  timezone?: string | null;
  birthAccuracy?: string | null;
}

export async function saveBirthDetails(
  supabase: SupabaseClient<Database>,
  input: SaveBirthDetailsInput
): Promise<Database["public"]["Tables"]["birth_details"]["Row"]> {
  const row: Database["public"]["Tables"]["birth_details"]["Insert"] = {
    customer_id: input.customerId ?? null,
    lead_id: input.leadId ?? null,
    full_name: input.fullName ?? null,
    gender: input.gender ?? null,
    date_of_birth: input.dateOfBirth ?? null,
    time_of_birth: input.timeOfBirth ?? null,
    birth_place: input.birthPlace ?? null,
    birth_city: input.birthCity ?? null,
    birth_state: input.birthState ?? null,
    birth_country: input.birthCountry ?? null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    timezone: input.timezone ?? null,
    birth_accuracy: input.birthAccuracy ?? null,
  };
  const { data, error } = await supabase.from("birth_details").insert(row).select().single();
  if (error) throw error;
  return data;
}

export async function getBirthDetailsByLead(
  supabase: SupabaseClient<Database>,
  leadId: string
): Promise<Database["public"]["Tables"]["birth_details"]["Row"] | null> {
  const { data } = await supabase
    .from("birth_details")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function linkBirthDetailsToOrder(
  supabase: SupabaseClient<Database>,
  birthDetailsId: string,
  orderId: string
): Promise<void> {
  await supabase.from("orders").update({ birth_details_id: birthDetailsId }).eq("id", orderId);
}
