import type { SupabaseClient } from "@supabase/supabase-js";
import {
  FALLBACK_KADA_PRICING,
  KADA_PRODUCT_SLUGS,
  type KadaPricing,
} from "@/lib/products/kada";
import type { Database, Json } from "@/types/database";

function toPaise(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : fallback;
}

function metadataNumber(raw: Json | null, key: string, fallback: number): number {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return fallback;
  return toPaise((raw as Record<string, Json | undefined>)[key], fallback);
}

export async function getKadaPricing(
  supabase: SupabaseClient<Database>
): Promise<KadaPricing> {
  const { data } = await supabase
    .from("products")
    .select("slug,price,metadata_json")
    .in("slug", [
      KADA_PRODUCT_SLUGS.PLATED,
      KADA_PRODUCT_SLUGS.PURE_SILVER,
      KADA_PRODUCT_SLUGS.SIDDHA_ADDON,
    ]);

  const bySlug = new Map((data ?? []).map((p) => [p.slug, p]));
  const plated = bySlug.get(KADA_PRODUCT_SLUGS.PLATED);
  const silver = bySlug.get(KADA_PRODUCT_SLUGS.PURE_SILVER);
  const siddha = bySlug.get(KADA_PRODUCT_SLUGS.SIDDHA_ADDON);

  return {
    platedPricePaise: toPaise(plated?.price, FALLBACK_KADA_PRICING.platedPricePaise),
    platedMrpPaise: metadataNumber(
      plated?.metadata_json ?? null,
      "mrp_paise",
      FALLBACK_KADA_PRICING.platedMrpPaise
    ),
    silverPricePaise: toPaise(silver?.price, FALLBACK_KADA_PRICING.silverPricePaise),
    silverMrpPaise: metadataNumber(
      silver?.metadata_json ?? null,
      "mrp_paise",
      FALLBACK_KADA_PRICING.silverMrpPaise
    ),
    siddhaPricePaise: toPaise(siddha?.price, FALLBACK_KADA_PRICING.siddhaPricePaise),
    prepaidDiscountPaise: FALLBACK_KADA_PRICING.prepaidDiscountPaise,
  };
}

