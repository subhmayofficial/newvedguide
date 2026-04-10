import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { mapSourceToEntryPath } from "@/lib/constants/commerce";
import { logEvent } from "@/lib/services/event";
import { EVENT_GROUP } from "@/lib/constants/commerce";

interface Body {
  sessionId?: string;
  sourcePage?: string;
  pagePath?: string;
  sourceFunnel?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
  productSlug?: string;
}

export async function POST(request: Request) {
  try {
    const body: Body = await request.json();
    const supabase = createServiceClient();
    const entryPath = mapSourceToEntryPath(body.sourceFunnel);

    await logEvent(supabase, {
      eventName: "checkout_page_view",
      eventGroup: EVENT_GROUP.PAGE,
      sessionId: body.sessionId ?? null,
      sourcePage: body.sourcePage ?? null,
      pagePath: body.pagePath ?? "/checkout/kundli",
      entryPath,
      utmSource: body.utmSource ?? null,
      utmMedium: body.utmMedium ?? null,
      utmCampaign: body.utmCampaign ?? null,
      referrer: body.referrer ?? null,
      metadataJson: { product_slug: body.productSlug ?? "paid-kundli" },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[checkout/view]", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
