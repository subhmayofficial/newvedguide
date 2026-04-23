import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

type ReviewPayload = {
  ratingOverall?: number;
  favoritePart?: string;
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

    const ratingOverall = clampRating(body.ratingOverall);
    const favoritePart = body.favoritePart?.trim() ?? "";
    const phone = normalizePhone(body.phone ?? "");

    if (ratingOverall === null)
      return NextResponse.json({ error: "Kripya apni rating dein." }, { status: 400 });
    if (!favoritePart || favoritePart.length < 5)
      return NextResponse.json({ error: "Kripya short feedback likhein." }, { status: 400 });

    const supabase = createServiceClient();
    const { error } = await supabase.from("kundli_reviews").insert({
      customer_name: "Anonymous",
      phone,
      rating_overall: ratingOverall,
      rating_accuracy: ratingOverall,
      rating_clarity: ratingOverall,
      rating_design: ratingOverall,
      favorite_part: favoritePart,
      improvements: null,
      recommend_score: 10,
      testimonial: null,
      source_page: "premium-kundli-review",
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
