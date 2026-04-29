import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

type SupportRequestBody = {
  fullName?: string;
  email?: string;
  phone?: string;
  subject?: string;
  problem?: string;
};

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SupportRequestBody;
    const fullName = String(body.fullName ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const phone = String(body.phone ?? "").trim();
    const subject = String(body.subject ?? "").trim();
    const problem = String(body.problem ?? "").trim();

    if (!fullName || !email || !subject || !problem) {
      return NextResponse.json(
        { error: "Full name, email, subject and problem are required." },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    if (problem.length < 10) {
      return NextResponse.json(
        { error: "Please describe the problem in at least 10 characters." },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const userAgent = request.headers.get("user-agent");
    const { error } = await supabase.from("support_requests").insert({
      full_name: fullName,
      email,
      phone: phone || null,
      subject,
      problem,
      source_page: "/support",
      user_agent: userAgent,
      status: "new",
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[support][post]", error);
    return NextResponse.json(
      { error: "Unable to submit support request right now. Please try again." },
      { status: 500 }
    );
  }
}
