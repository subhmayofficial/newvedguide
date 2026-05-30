import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";

export interface MetaCapiDeliveryLogInput {
  orderId?: string | null;
  customerId?: string | null;
  leadId?: string | null;
  triggerSource: string;
  requestUrl: string;
  requestBody: Record<string, unknown>;
  responseStatus: number;
  responseBody: string;
  status: "success" | "failed";
  errorMessage?: string | null;
  createdBy?: string | null;
}

export async function logMetaCapiDelivery(
  supabase: SupabaseClient<Database>,
  input: MetaCapiDeliveryLogInput
): Promise<void> {
  const row: Database["public"]["Tables"]["integration_deliveries"]["Insert"] = {
    provider: "meta_capi",
    channel: "webhook",
    event_name: "Purchase",
    status: input.status,
    trigger_source: input.triggerSource,
    customer_id: input.customerId ?? null,
    lead_id: input.leadId ?? null,
    order_id: input.orderId ?? null,
    request_url: input.requestUrl,
    request_method: "POST",
    request_body_json: input.requestBody as Json,
    response_status: input.responseStatus,
    response_body: input.responseBody.slice(0, 8000),
    error_message: input.errorMessage ?? null,
    created_by: input.createdBy ?? null,
  };

  const { error } = await supabase.from("integration_deliveries").insert(row);
  if (error) {
    console.error("[meta-capi][delivery-log]", error.message);
  }
}
