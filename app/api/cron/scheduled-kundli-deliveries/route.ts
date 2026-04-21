import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { processDueScheduledPaidKundliDeliveries } from "@/lib/admin/paid-kundli-interakt-delivery";

/**
 * Run due scheduled paid-kundli WhatsApp deliveries.
 * Secure with CRON_SECRET: Authorization: Bearer <CRON_SECRET>
 * If CRON_SECRET is unset, only non-production requests are allowed.
 */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { ok: false, error: "Set CRON_SECRET to call this endpoint in production" },
      { status: 503 }
    );
  }

  const supabase = createServiceClient();
  const out = await processDueScheduledPaidKundliDeliveries(supabase, {
    createdBy: "cron_scheduled_kundli_delivery",
  });

  if (out.sent > 0) {
    revalidatePath("/admindeoghar/orders");
  }

  return NextResponse.json({
    ok: true,
    attempted: out.attempted,
    sent: out.sent,
    failures: out.failures,
  });
}
