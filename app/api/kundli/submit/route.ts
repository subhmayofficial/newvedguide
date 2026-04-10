import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { calculateKundli } from "@/lib/kundli/calculate";
import { mapSourceToEntryPath } from "@/lib/constants/commerce";
import { JOURNEY_STAGE } from "@/lib/constants/commerce";
import { upsertCustomer } from "@/lib/services/customer";
import { upsertLeadFromFreeKundli } from "@/lib/services/lead";
import { saveBirthDetails } from "@/lib/services/birth-details";
import { logEvent } from "@/lib/services/event";
import { EVENT_GROUP } from "@/lib/constants/commerce";
import type { Json } from "@/types/database";

interface SubmitKundliBody {
  leadId?: string;
  fullName: string;
  phone?: string;
  gender?: string;
  email?: string;
  dob: string;
  tob: string;
  pob: string;
  lat?: number;
  lon?: number;
  timezone?: string;
  source?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
  sessionId?: string;
}

export async function POST(request: Request) {
  try {
    const body: SubmitKundliBody = await request.json();

    if (!body.fullName || !body.dob || !body.tob || !body.pob) {
      return NextResponse.json(
        { error: "Missing required birth details" },
        { status: 400 }
      );
    }

    const resultData = calculateKundli({
      dob: body.dob,
      tob: body.tob,
      lat: body.lat ?? 28.6139,
      lon: body.lon ?? 77.209,
      timezone: body.timezone ?? "Asia/Kolkata",
    });

    const supabase = createServiceClient();
    const entryPath = mapSourceToEntryPath(body.source);

    const utmJson: Json = {
      utm_source: body.utmSource ?? null,
      utm_medium: body.utmMedium ?? null,
      utm_campaign: body.utmCampaign ?? null,
    };

    const customer = await upsertCustomer(supabase, {
      fullName: body.fullName,
      phone: body.phone,
      email: body.email,
      source: body.source ?? "free_kundli_page",
      utmSource: body.utmSource,
      utmMedium: body.utmMedium,
      utmCampaign: body.utmCampaign,
    });

    const lead = await upsertLeadFromFreeKundli(supabase, {
      customerId: customer.id,
      entryPath,
      sourcePage: body.source ?? "free_kundli_page",
      formName: "free_kundli",
      sessionId: body.sessionId,
      referrer: body.referrer,
      utmJson,
      payloadJson: {
        gender: body.gender ?? null,
      } as Json,
    });

    await saveBirthDetails(supabase, {
      customerId: customer.id,
      leadId: lead.id,
      fullName: body.fullName,
      gender: body.gender ?? null,
      dateOfBirth: body.dob,
      timeOfBirth: body.tob,
      birthPlace: body.pob,
      latitude: body.lat ?? null,
      longitude: body.lon ?? null,
      timezone: body.timezone ?? "Asia/Kolkata",
    });

    await logEvent(supabase, {
      eventName: "free_kundli_submit",
      eventGroup: EVENT_GROUP.FUNNEL,
      customerId: customer.id,
      leadId: lead.id,
      sessionId: body.sessionId ?? null,
      sourcePage: body.source ?? null,
      pagePath: "/free-kundli",
      entryPath,
      utmSource: body.utmSource ?? null,
      utmMedium: body.utmMedium ?? null,
      utmCampaign: body.utmCampaign ?? null,
      referrer: body.referrer ?? null,
      metadataJson: { journey_stage: JOURNEY_STAGE.FREE_KUNDLI_SUBMITTED },
    });

    let submissionId: string | null = null;
    try {
      const { data: row, error: dbError } = await supabase
        .from("kundli_submissions")
        .insert({
          lead_id: lead.id,
          full_name: body.fullName,
          phone: body.phone ?? "",
          email: body.email ?? null,
          dob: body.dob,
          tob: body.tob,
          pob: body.pob,
          lat: body.lat ?? null,
          lon: body.lon ?? null,
          timezone: body.timezone ?? "Asia/Kolkata",
          result_data: resultData as unknown as Json,
          source: body.source ?? "free_kundli_page",
          utm_source: body.utmSource ?? null,
          utm_medium: body.utmMedium ?? null,
          utm_campaign: body.utmCampaign ?? null,
        })
        .select("id")
        .single();

      if (dbError) {
        console.error("[kundli/submit] DB save failed (non-fatal):", dbError.message);
      } else {
        submissionId = row?.id ?? null;
      }
    } catch (dbErr) {
      console.error("[kundli/submit] DB save threw (non-fatal):", dbErr);
    }

    return NextResponse.json({
      submissionId: submissionId ?? crypto.randomUUID(),
      result: resultData,
      leadId: lead.id,
      customerId: customer.id,
    });
  } catch (err) {
    console.error("[kundli/submit] Unexpected error:", err);
    return NextResponse.json(
      { error: "Failed to process kundli" },
      { status: 500 }
    );
  }
}
