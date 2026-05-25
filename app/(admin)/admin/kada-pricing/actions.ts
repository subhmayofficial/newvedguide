"use server";

import { revalidatePath } from "next/cache";
import { adminPath } from "@/lib/admin/admin-paths";
import { createServiceClient } from "@/lib/supabase/server";
import { KADA_PRODUCT_SLUGS } from "@/lib/products/kada";
import type { Json } from "@/types/database";

function rupeesToPaise(raw: FormDataEntryValue | null): number | null {
  const n = Number(String(raw ?? "").trim());
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

function mergeMetadata(raw: Json | null, patch: Record<string, Json>): Json {
  const base =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, Json | undefined>)
      : {};
  return { ...base, ...patch };
}

async function updateProductPrice(input: {
  slug: string;
  pricePaise: number;
  mrpPaise?: number | null;
}) {
  const supabase = createServiceClient();
  const { data: current, error: readError } = await supabase
    .from("products")
    .select("metadata_json")
    .eq("slug", input.slug)
    .maybeSingle();
  if (readError) throw readError;

  const patch = {
    price: input.pricePaise,
    ...(input.mrpPaise != null
      ? { metadata_json: mergeMetadata(current?.metadata_json ?? null, { mrp_paise: input.mrpPaise }) }
      : {}),
  };

  const { error } = await supabase
    .from("products")
    .update(patch)
    .eq("slug", input.slug);
  if (error) throw error;
}

export async function updateKadaPricing(formData: FormData) {
  const platedPrice = rupeesToPaise(formData.get("plated_price"));
  const platedMrp = rupeesToPaise(formData.get("plated_mrp"));
  const silverPrice = rupeesToPaise(formData.get("silver_price"));
  const silverMrp = rupeesToPaise(formData.get("silver_mrp"));
  const siddhaPrice = rupeesToPaise(formData.get("siddha_price"));

  if (
    platedPrice == null ||
    platedMrp == null ||
    silverPrice == null ||
    silverMrp == null ||
    siddhaPrice == null
  ) {
    return;
  }

  await updateProductPrice({
    slug: KADA_PRODUCT_SLUGS.PLATED,
    pricePaise: platedPrice,
    mrpPaise: platedMrp,
  });
  await updateProductPrice({
    slug: KADA_PRODUCT_SLUGS.PURE_SILVER,
    pricePaise: silverPrice,
    mrpPaise: silverMrp,
  });
  await updateProductPrice({
    slug: KADA_PRODUCT_SLUGS.SIDDHA_ADDON,
    pricePaise: siddhaPrice,
  });

  revalidatePath(adminPath("/kada-pricing"));
  revalidatePath("/products/kada");
  revalidatePath("/checkout/kada");
}

