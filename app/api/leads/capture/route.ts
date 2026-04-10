import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { JOURNEY_STAGE, LEAD_STATUS, LEAD_TYPE } from "@/lib/constants/commerce";
import { upsertCustomer } from "@/lib/services/customer";
import type { Json } from "@/types/database";

interface CaptureLeadBody {
  phone: string;
  fullName?: string;
  email?: string;
  source?: string;
  toolSlug?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  referrer?: string;
  sessionId?: string;
}

export async function POST(request: Request) {
  try {
    const body: CaptureLeadBody = await request.json();

    if (!body.phone) {
      return NextResponse.json({ error: "Phone is required" }, { status: 400 });
    }

    const supabase = createServiceClient();

    const customer = await upsertCustomer(supabase, {
      fullName: body.fullName,
      phone: body.phone,
      email: body.email,
      source: body.source ?? "capture",
      utmSource: body.utmSource,
      utmMedium: body.utmMedium,
      utmCampaign: body.utmCampaign,
    });

    const utmJson: Json = {
      utm_source: body.utmSource ?? null,
      utm_medium: body.utmMedium ?? null,
      utm_campaign: body.utmCampaign ?? null,
      utm_content: body.utmContent ?? null,
    };

    const { data: existing } = await supabase
      .from("leads")
      .select("id")
      .eq("customer_id", customer.id)
      .eq("lead_type", LEAD_TYPE.FREE_KUNDLI)
      .eq("status", LEAD_STATUS.NEW)
      .eq("has_order", false)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("leads")
        .update({
          source_page: body.source ?? "capture",
          form_name: body.toolSlug ?? "phone_capture",
          session_id: body.sessionId ?? null,
          referrer: body.referrer ?? null,
          utm_json: utmJson,
        })
        .eq("id", existing.id);
      return NextResponse.json({ leadId: existing.id, customerId: customer.id });
    }

    const { data: lead, error } = await supabase
      .from("leads")
      .insert({
        customer_id: customer.id,
        lead_type: LEAD_TYPE.FREE_KUNDLI,
        status: LEAD_STATUS.NEW,
        journey_stage: JOURNEY_STAGE.FREE_KUNDLI_STARTED,
        source_page: body.source ?? "capture",
        form_name: body.toolSlug ?? "phone_capture",
        session_id: body.sessionId ?? null,
        referrer: body.referrer ?? null,
        utm_json: utmJson,
        payload_json: { tool_slug: body.toolSlug ?? null } as Json,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ leadId: lead.id, customerId: customer.id });
  } catch (err) {
    console.error("[leads/capture]", err);
    return NextResponse.json(
      { error: "Failed to capture lead" },
      { status: 500 }
    );
  }
}
