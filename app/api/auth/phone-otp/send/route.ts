import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendPhoneOtpWhatsApp } from "@/lib/auth/phone-otp-server";

export async function POST(request: Request) {
  let body: { phone?: string; consent?: boolean };
  try {
    body = (await request.json()) as { phone?: string; consent?: boolean };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const supabase = createServiceClient();
  const result = await sendPhoneOtpWhatsApp({
    supabase,
    rawPhone: typeof body.phone === "string" ? body.phone : "",
    consent: body.consent === true,
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.error,
        hint: result.hint,
        retryAfterSeconds: result.retryAfterSeconds,
      },
      { status: result.status }
    );
  }

  return NextResponse.json({ ok: true });
}
