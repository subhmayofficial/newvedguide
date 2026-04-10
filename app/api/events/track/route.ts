import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { logEvent } from "@/lib/services/event";
import type { Json } from "@/types/database";

interface Body {
  eventName: string;
  eventGroup?: string;
  sessionId?: string;
  sourcePage?: string;
  pagePath?: string;
  entryPath?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
  customerId?: string;
  leadId?: string;
  orderId?: string;
  metadata?: Json;
}

export async function POST(request: Request) {
  try {
    const body: Body = await request.json();
    if (!body.eventName) {
      return NextResponse.json({ error: "eventName required" }, { status: 400 });
    }

    const supabase = createServiceClient();
    await logEvent(supabase, {
      eventName: body.eventName,
      eventGroup: body.eventGroup ?? null,
      sessionId: body.sessionId ?? null,
      sourcePage: body.sourcePage ?? null,
      pagePath: body.pagePath ?? null,
      entryPath: body.entryPath ?? null,
      utmSource: body.utmSource ?? null,
      utmMedium: body.utmMedium ?? null,
      utmCampaign: body.utmCampaign ?? null,
      referrer: body.referrer ?? null,
      customerId: body.customerId ?? null,
      leadId: body.leadId ?? null,
      orderId: body.orderId ?? null,
      metadataJson: body.metadata ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[events/track]", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
