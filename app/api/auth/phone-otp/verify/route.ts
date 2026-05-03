import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { verifyPhoneOtpAndEnsureAuthUser } from "@/lib/auth/phone-otp-server";

export async function POST(request: Request) {
  let body: { phone?: string; code?: string; displayName?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const admin = createServiceClient();
  const verified = await verifyPhoneOtpAndEnsureAuthUser({
    supabaseAdmin: admin,
    rawPhone: typeof body.phone === "string" ? body.phone : "",
    code: typeof body.code === "string" ? body.code : "",
    displayName: typeof body.displayName === "string" ? body.displayName : undefined,
  });

  if (!verified.ok) {
    return NextResponse.json({ error: verified.error }, { status: verified.status });
  }

  const supabase = await createClient();
  const { error: signErr } = await supabase.auth.signInWithPassword({
    email: verified.email,
    password: verified.password,
  });

  if (signErr) {
    return NextResponse.json(
      { error: signErr.message || "Could not start your session." },
      { status: 401 }
    );
  }

  return NextResponse.json({ ok: true });
}
