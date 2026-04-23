import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

type ReviewPayload = {
  rating?: number;
  mostUsefulPart?: string;
  personalizationFeedback?: string;
  clarityFeedback?: string;
  improvementFeedback?: string;
  writtenReview?: string;
  name?: string;
  phone?: string;
};

function clampRating(v: unknown): number | null {
  if (typeof v !== "number" || Number.isNaN(v)) return null;
  const r = Math.round(v);
  return r >= 1 && r <= 5 ? r : null;
}

function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  return digits.length >= 10 ? digits : null;
}

export async function POST(request: Request) {
  try {
    const body: ReviewPayload = await request.json();

    const rating = clampRating(body.rating);
    const mostUsefulPart = body.mostUsefulPart?.trim() ?? "";
    const personalizationFeedback = body.personalizationFeedback?.trim() ?? "";
    const clarityFeedback = body.clarityFeedback?.trim() ?? "";
    const improvementFeedback = body.improvementFeedback?.trim() ?? "";
    const writtenReview = body.writtenReview?.trim() || null;
    const name = body.name?.trim() ?? "";
    const phone = normalizePhone(body.phone ?? "");

    if (rating === null)
      return NextResponse.json({ error: "Kripya apni rating dein." }, { status: 400 });
    if (!mostUsefulPart)
      return NextResponse.json({ error: "Kripya ek option chunein." }, { status: 400 });
    if (!personalizationFeedback)
      return NextResponse.json({ error: "Kripya personalization feedback dein." }, { status: 400 });
    if (!clarityFeedback)
      return NextResponse.json({ error: "Kripya clarity feedback dein." }, { status: 400 });
    if (!improvementFeedback)
      return NextResponse.json({ error: "Kripya improvement feedback dein." }, { status: 400 });
    if (!name)
      return NextResponse.json({ error: "Kripya apna naam likhein." }, { status: 400 });

    const supabase = createServiceClient();
    const { error } = await supabase.from("kundli_reviews").insert({
      rating,
      most_useful_part: mostUsefulPart,
      personalization_feedback: personalizationFeedback,
      clarity_feedback: clarityFeedback,
      improvement_feedback: improvementFeedback,
      written_review: writtenReview,
      name,
      phone,
      source: "premium_kundli_review_form",
    });

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[reviews/premium-kundli]", err);
    return NextResponse.json(
      { error: "Review submit nahi ho saka. Dobara try karein." },
      { status: 500 },
    );
  }
}
