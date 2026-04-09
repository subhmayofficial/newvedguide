import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

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
}

export async function POST(request: Request) {
  try {
    const body: CaptureLeadBody = await request.json();

    if (!body.phone) {
      return NextResponse.json({ error: "Phone is required" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Upsert on phone — avoid duplicate leads for same number
    const { data, error } = await supabase
      .from("leads")
      .upsert(
        {
          phone: body.phone,
          full_name: body.fullName ?? null,
          email: body.email ?? null,
          source: body.source ?? "free_kundli",
          tool_slug: body.toolSlug ?? null,
          utm_source: body.utmSource ?? null,
          utm_medium: body.utmMedium ?? null,
          utm_campaign: body.utmCampaign ?? null,
          utm_content: body.utmContent ?? null,
          referrer: body.referrer ?? null,
        },
        { onConflict: "phone", ignoreDuplicates: false }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ leadId: data.id });
  } catch (err) {
    console.error("[leads/capture]", err);
    return NextResponse.json(
      { error: "Failed to capture lead" },
      { status: 500 }
    );
  }
}
