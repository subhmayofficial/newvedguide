import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";

export interface LogEventInput {
  eventName: string;
  eventGroup?: string | null;
  customerId?: string | null;
  leadId?: string | null;
  orderId?: string | null;
  sessionId?: string | null;
  sourcePage?: string | null;
  pagePath?: string | null;
  entryPath?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  referrer?: string | null;
  metadataJson?: Json | null;
}

export async function logEvent(
  supabase: SupabaseClient<Database>,
  input: LogEventInput
): Promise<void> {
  const row: Database["public"]["Tables"]["events"]["Insert"] = {
    event_name: input.eventName,
    event_group: input.eventGroup ?? null,
    customer_id: input.customerId ?? null,
    lead_id: input.leadId ?? null,
    order_id: input.orderId ?? null,
    session_id: input.sessionId ?? null,
    source_page: input.sourcePage ?? null,
    page_path: input.pagePath ?? null,
    entry_path: input.entryPath ?? null,
    utm_source: input.utmSource ?? null,
    utm_medium: input.utmMedium ?? null,
    utm_campaign: input.utmCampaign ?? null,
    referrer: input.referrer ?? null,
    metadata_json: input.metadataJson ?? null,
  };
  const { error } = await supabase.from("events").insert(row);
  if (error) console.error("[logEvent]", error.message);
}

export async function getEntityTimeline(
  supabase: SupabaseClient<Database>,
  input: {
    customerId?: string;
    leadId?: string;
    orderId?: string;
    limit?: number;
  }
): Promise<Database["public"]["Tables"]["events"]["Row"][]> {
  let q = supabase.from("events").select("*");
  if (input.orderId) q = q.eq("order_id", input.orderId);
  else if (input.leadId) q = q.eq("lead_id", input.leadId);
  else if (input.customerId) q = q.eq("customer_id", input.customerId);
  else return [];
  const lim = input.limit ?? 100;
  const { data, error } = await q
    .order("created_at", { ascending: false })
    .limit(lim);
  if (error) throw error;
  return data ?? [];
}
