import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type CouponRow = Database["public"]["Tables"]["coupons"]["Row"];

export interface CouponValidationResult {
  coupon: CouponRow;
  discountPaise: number;
  finalAmountPaise: number;
}

export interface CreateCouponInput {
  code: string;
  description?: string | null;
  discountType: "fixed" | "percentage";
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number | null;
  usageLimit?: number | null;
  appliesToProductSlug?: string | null;
  validFrom?: string | null;
  validUntil?: string | null;
  isActive?: boolean;
}

export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase();
}

export async function listCoupons(
  supabase: SupabaseClient<Database>
): Promise<CouponRow[]> {
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createCoupon(
  supabase: SupabaseClient<Database>,
  input: CreateCouponInput
): Promise<CouponRow> {
  const row: Database["public"]["Tables"]["coupons"]["Insert"] = {
    code: normalizeCouponCode(input.code),
    description: input.description ?? null,
    discount_type: input.discountType,
    discount_value: input.discountValue,
    min_order_amount: input.minOrderAmount ?? 0,
    max_discount_amount: input.maxDiscountAmount ?? null,
    usage_limit: input.usageLimit ?? null,
    applies_to_product_slug: input.appliesToProductSlug ?? null,
    valid_from: input.validFrom ?? null,
    valid_until: input.validUntil ?? null,
    is_active: input.isActive ?? true,
  };

  const { data, error } = await supabase
    .from("coupons")
    .insert(row)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function getCouponByCode(
  supabase: SupabaseClient<Database>,
  code: string
): Promise<CouponRow | null> {
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", normalizeCouponCode(code))
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function validateCouponForAmount(
  supabase: SupabaseClient<Database>,
  input: {
    code: string;
    orderAmountPaise: number;
    productSlug?: string | null;
  }
): Promise<CouponValidationResult> {
  const coupon = await getCouponByCode(supabase, input.code);
  if (!coupon) throw new Error("Coupon code not found.");
  if (!coupon.is_active) throw new Error("This coupon is inactive.");

  const now = Date.now();
  if (coupon.valid_from && new Date(coupon.valid_from).getTime() > now) {
    throw new Error("This coupon is not active yet.");
  }
  if (coupon.valid_until && new Date(coupon.valid_until).getTime() < now) {
    throw new Error("This coupon has expired.");
  }
  if (
    typeof coupon.usage_limit === "number" &&
    coupon.usage_count >= coupon.usage_limit
  ) {
    throw new Error("This coupon has reached its usage limit.");
  }
  if (
    coupon.applies_to_product_slug &&
    input.productSlug &&
    coupon.applies_to_product_slug !== input.productSlug
  ) {
    throw new Error("This coupon is not valid for this product.");
  }

  const minOrderAmount = Number(coupon.min_order_amount ?? 0);
  if (input.orderAmountPaise < minOrderAmount) {
    throw new Error(
      `Coupon valid only on orders above Rs ${Math.ceil(minOrderAmount / 100)}.`
    );
  }

  let discountPaise =
    coupon.discount_type === "percentage"
      ? Math.floor((input.orderAmountPaise * Number(coupon.discount_value)) / 100)
      : Number(coupon.discount_value);

  const maxDiscount = coupon.max_discount_amount
    ? Number(coupon.max_discount_amount)
    : null;
  if (maxDiscount !== null) {
    discountPaise = Math.min(discountPaise, maxDiscount);
  }

  discountPaise = Math.max(0, Math.min(discountPaise, input.orderAmountPaise));

  if (discountPaise <= 0) {
    throw new Error("This coupon does not apply to the current order.");
  }

  return {
    coupon,
    discountPaise,
    finalAmountPaise: input.orderAmountPaise - discountPaise,
  };
}

export async function incrementCouponUsage(
  supabase: SupabaseClient<Database>,
  couponId: string
): Promise<void> {
  const { data, error } = await supabase
    .from("coupons")
    .select("usage_count")
    .eq("id", couponId)
    .single();
  if (error) throw error;

  await supabase
    .from("coupons")
    .update({ usage_count: (data?.usage_count ?? 0) + 1 })
    .eq("id", couponId);
}
