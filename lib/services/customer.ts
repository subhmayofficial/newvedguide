import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone?.trim()) return null;
  const d = phone.replace(/\D/g, "");
  if (d.length >= 10) return d.slice(-10);
  return d.length > 0 ? d : null;
}

export interface UpsertCustomerInput {
  fullName?: string | null;
  phone?: string | null;
  email?: string | null;
  whatsappNumber?: string | null;
  /** first-touch / latest page or channel label */
  source?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
}

export async function findCustomerByPhoneOrEmail(
  supabase: SupabaseClient<Database>,
  input: { phone?: string | null; email?: string | null }
): Promise<Database["public"]["Tables"]["customers"]["Row"] | null> {
  const phone = normalizePhone(input.phone);
  if (phone) {
    const { data } = await supabase
      .from("customers")
      .select("*")
      .eq("phone", phone)
      .maybeSingle();
    if (data) return data;
  }
  const email = input.email?.trim().toLowerCase();
  if (email) {
    const { data } = await supabase
      .from("customers")
      .select("*")
      .ilike("email", email)
      .maybeSingle();
    if (data) return data;
  }
  return null;
}

export async function updateCustomerAttribution(
  supabase: SupabaseClient<Database>,
  customerId: string,
  input: UpsertCustomerInput
): Promise<void> {
  const { data: row } = await supabase
    .from("customers")
    .select("*")
    .eq("id", customerId)
    .single();

  if (!row) return;

  const patch: Database["public"]["Tables"]["customers"]["Update"] = {
    source_latest: input.source ?? row.source_latest,
    utm_source_latest: input.utmSource ?? row.utm_source_latest,
    utm_medium_latest: input.utmMedium ?? row.utm_medium_latest,
    utm_campaign_latest: input.utmCampaign ?? row.utm_campaign_latest,
  };

  if (!row.source_first && input.source) patch.source_first = input.source;
  if (!row.utm_source_first && input.utmSource)
    patch.utm_source_first = input.utmSource;
  if (!row.utm_medium_first && input.utmMedium)
    patch.utm_medium_first = input.utmMedium;
  if (!row.utm_campaign_first && input.utmCampaign)
    patch.utm_campaign_first = input.utmCampaign;

  await supabase.from("customers").update(patch).eq("id", customerId);
}

export async function upsertCustomer(
  supabase: SupabaseClient<Database>,
  input: UpsertCustomerInput
): Promise<Database["public"]["Tables"]["customers"]["Row"]> {
  const phone = normalizePhone(input.phone);
  const email = input.email?.trim() || null;

  const existing = await findCustomerByPhoneOrEmail(supabase, {
    phone: phone ?? undefined,
    email: email ?? undefined,
  });

  if (existing) {
    const patch: Database["public"]["Tables"]["customers"]["Update"] = {
      full_name: input.fullName?.trim() || existing.full_name,
      phone: phone ?? existing.phone,
      email: email ?? existing.email,
      whatsapp_number: input.whatsappNumber ?? existing.whatsapp_number,
      source_latest: input.source ?? existing.source_latest,
      utm_source_latest: input.utmSource ?? existing.utm_source_latest,
      utm_medium_latest: input.utmMedium ?? existing.utm_medium_latest,
      utm_campaign_latest: input.utmCampaign ?? existing.utm_campaign_latest,
    };
    if (!existing.source_first && input.source) patch.source_first = input.source;
    if (!existing.utm_source_first && input.utmSource)
      patch.utm_source_first = input.utmSource;
    if (!existing.utm_medium_first && input.utmMedium)
      patch.utm_medium_first = input.utmMedium;
    if (!existing.utm_campaign_first && input.utmCampaign)
      patch.utm_campaign_first = input.utmCampaign;

    const { data, error } = await supabase
      .from("customers")
      .update(patch)
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const insert: Database["public"]["Tables"]["customers"]["Insert"] = {
    full_name: input.fullName?.trim() ?? null,
    phone,
    email,
    whatsapp_number: input.whatsappNumber ?? null,
    source_first: input.source ?? null,
    source_latest: input.source ?? null,
    utm_source_first: input.utmSource ?? null,
    utm_medium_first: input.utmMedium ?? null,
    utm_campaign_first: input.utmCampaign ?? null,
    utm_source_latest: input.utmSource ?? null,
    utm_medium_latest: input.utmMedium ?? null,
    utm_campaign_latest: input.utmCampaign ?? null,
  };

  const { data, error } = await supabase
    .from("customers")
    .insert(insert)
    .select()
    .single();
  if (error) throw error;
  return data;
}
