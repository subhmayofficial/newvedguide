import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { calculateKundli } from "@/lib/kundli/calculate";

interface SubmitKundliBody {
  leadId?: string;
  fullName: string;
  phone?: string;
  gender?: string;
  email?: string;
  dob: string;   // "YYYY-MM-DD"
  tob: string;   // "HH:MM"
  pob: string;   // place of birth text
  lat?: number;
  lon?: number;
  timezone?: string;
  source?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
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

    // Compute kundli result
    const resultData = calculateKundli({
      dob: body.dob,
      tob: body.tob,
      lat: body.lat ?? 28.6139,   // default Delhi if geocode unavailable
      lon: body.lon ?? 77.209,
      timezone: body.timezone ?? "Asia/Kolkata",
    });

    // DB save is non-blocking — user always gets their result even if insert fails
    let submissionId: string | null = null;
    try {
      const supabase = createServiceClient();
      const { data: row, error: dbError } = await supabase
        .from("kundli_submissions")
        .insert({
          lead_id: body.leadId ?? null,
          full_name: body.fullName,
          phone: body.phone ?? "",
          email: body.email ?? null,
          dob: body.dob,
          tob: body.tob,
          pob: body.pob,
          lat: body.lat ?? null,
          lon: body.lon ?? null,
          timezone: body.timezone ?? "Asia/Kolkata",
          result_data: resultData as unknown as import("@/types/database").Json,
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
    });
  } catch (err) {
    console.error("[kundli/submit] Unexpected error:", err);
    return NextResponse.json(
      { error: "Failed to process kundli" },
      { status: 500 }
    );
  }
}
