import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import {
  ENTRY_PATH,
  JOURNEY_STAGE,
  LEAD_STATUS,
  LEAD_TYPE,
} from "@/lib/constants/commerce";

export async function createLeadFromFreeKundli(
  supabase: SupabaseClient<Database>,
  input: {
    customerId: string;
    entryPath: string;
    sourcePage?: string | null;
    formName?: string | null;
    sessionId?: string | null;
    referrer?: string | null;
    utmJson?: Json | null;
    payloadJson?: Json | null;
  }
): Promise<Database["public"]["Tables"]["leads"]["Row"]> {
  const row: Database["public"]["Tables"]["leads"]["Insert"] = {
    customer_id: input.customerId,
    lead_type: LEAD_TYPE.FREE_KUNDLI,
    status: LEAD_STATUS.QUALIFIED,
    journey_stage: JOURNEY_STAGE.FREE_KUNDLI_SUBMITTED,
    entry_path: input.entryPath,
    source_page: input.sourcePage ?? null,
    form_name: input.formName ?? null,
    session_id: input.sessionId ?? null,
    referrer: input.referrer ?? null,
    utm_json: input.utmJson ?? null,
    payload_json: input.payloadJson ?? null,
    qualification_reason: "free_kundli_form_submitted",
  };
  const { data, error } = await supabase.from("leads").insert(row).select().single();
  if (error) throw error;
  return data;
}

/** Merge with early capture lead if present */
export async function upsertLeadFromFreeKundli(
  supabase: SupabaseClient<Database>,
  input: {
    customerId: string;
    entryPath: string;
    sourcePage?: string | null;
    formName?: string | null;
    sessionId?: string | null;
    referrer?: string | null;
    utmJson?: Json | null;
    payloadJson?: Json | null;
  }
): Promise<Database["public"]["Tables"]["leads"]["Row"]> {
  const { data: row } = await supabase
    .from("leads")
    .select("*")
    .eq("customer_id", input.customerId)
    .eq("lead_type", LEAD_TYPE.FREE_KUNDLI)
    .eq("has_order", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (row) {
    const { data, error } = await supabase
      .from("leads")
      .update({
        status: LEAD_STATUS.QUALIFIED,
        journey_stage: JOURNEY_STAGE.FREE_KUNDLI_SUBMITTED,
        entry_path: input.entryPath,
        source_page: input.sourcePage ?? row.source_page,
        form_name: input.formName ?? row.form_name,
        session_id: input.sessionId ?? row.session_id,
        referrer: input.referrer ?? row.referrer,
        utm_json: input.utmJson ?? row.utm_json,
        payload_json: input.payloadJson ?? row.payload_json,
        qualification_reason: "free_kundli_form_submitted",
      })
      .eq("id", row.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  return createLeadFromFreeKundli(supabase, input);
}

/** Find reusable business lead for customer (e.g. free kundli → checkout) */
export async function findActiveLeadForCustomer(
  supabase: SupabaseClient<Database>,
  customerId: string
): Promise<Database["public"]["Tables"]["leads"]["Row"] | null> {
  const { data } = await supabase
    .from("leads")
    .select("*")
    .eq("customer_id", customerId)
    .in("status", ["new", "qualified"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function createLeadFromPaymentInitiation(
  supabase: SupabaseClient<Database>,
  input: {
    customerId: string;
    entryPath: string;
    sourcePage?: string | null;
    sessionId?: string | null;
    referrer?: string | null;
    utmJson?: Json | null;
    productInterest?: string | null;
  }
): Promise<Database["public"]["Tables"]["leads"]["Row"]> {
  const row: Database["public"]["Tables"]["leads"]["Insert"] = {
    customer_id: input.customerId,
    lead_type: LEAD_TYPE.PAYMENT_INITIATED,
    status: LEAD_STATUS.QUALIFIED,
    journey_stage: JOURNEY_STAGE.PAYMENT_INITIATED,
    entry_path: input.entryPath || ENTRY_PATH.DIRECT_SALES,
    source_page: input.sourcePage ?? null,
    session_id: input.sessionId ?? null,
    referrer: input.referrer ?? null,
    utm_json: input.utmJson ?? null,
    product_interest: input.productInterest ?? null,
    qualification_reason: "payment_flow_started",
  };
  const { data, error } = await supabase.from("leads").insert(row).select().single();
  if (error) throw error;
  return data;
}

export async function updateLeadJourneyStage(
  supabase: SupabaseClient<Database>,
  leadId: string,
  journeyStage: string
): Promise<void> {
  await supabase.from("leads").update({ journey_stage: journeyStage }).eq("id", leadId);
}

export async function updateLeadStatus(
  supabase: SupabaseClient<Database>,
  input: {
    leadId: string;
    status: string;
    lostReason?: string | null;
    conversionReason?: string | null;
  }
): Promise<void> {
  const patch: Database["public"]["Tables"]["leads"]["Update"] = {
    status: input.status,
    lost_reason: input.lostReason ?? null,
    conversion_reason: input.conversionReason ?? null,
  };
  await supabase.from("leads").update(patch).eq("id", input.leadId);
}

export async function linkLeadToOrder(
  supabase: SupabaseClient<Database>,
  leadId: string,
  orderId: string
): Promise<void> {
  await supabase
    .from("leads")
    .update({ linked_order_id: orderId, has_order: true })
    .eq("id", leadId);
}

export async function getOrCreateLeadForCheckout(
  supabase: SupabaseClient<Database>,
  input: {
    customerId: string;
    entryPath: string;
    sourcePage?: string | null;
    sessionId?: string | null;
    referrer?: string | null;
    utmJson?: Json | null;
    productSlug: string;
  }
): Promise<Database["public"]["Tables"]["leads"]["Row"]> {
  const existing = await findActiveLeadForCustomer(supabase, input.customerId);
  if (existing && !existing.has_order) {
    const { data, error } = await supabase
      .from("leads")
      .update({
        journey_stage: JOURNEY_STAGE.PAYMENT_INITIATED,
        lead_type:
          existing.lead_type === LEAD_TYPE.FREE_KUNDLI
            ? LEAD_TYPE.FREE_KUNDLI
            : LEAD_TYPE.PAYMENT_INITIATED,
        entry_path: input.entryPath,
        source_page: input.sourcePage ?? existing.source_page,
        session_id: input.sessionId ?? existing.session_id,
        referrer: input.referrer ?? existing.referrer,
        utm_json: input.utmJson ?? existing.utm_json,
        product_interest: input.productSlug,
      })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  return createLeadFromPaymentInitiation(supabase, {
    customerId: input.customerId,
    entryPath: input.entryPath,
    sourcePage: input.sourcePage,
    sessionId: input.sessionId,
    referrer: input.referrer,
    utmJson: input.utmJson,
    productInterest: input.productSlug,
  });
}
