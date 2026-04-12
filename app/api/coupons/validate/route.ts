import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { validateCouponForAmount } from "@/lib/services/coupon";

interface ValidateCouponBody {
  code?: string;
  amountPaise?: number;
  productSlug?: string;
}

export async function POST(request: Request) {
  try {
    const body: ValidateCouponBody = await request.json();
    if (!body.code || !body.amountPaise) {
      return NextResponse.json(
        { error: "Coupon code and amount are required." },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const result = await validateCouponForAmount(supabase, {
      code: body.code,
      orderAmountPaise: body.amountPaise,
      productSlug: body.productSlug ?? null,
    });

    return NextResponse.json({
      code: result.coupon.code,
      discountPaise: result.discountPaise,
      finalAmountPaise: result.finalAmountPaise,
      discountType: result.coupon.discount_type,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to validate coupon.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
