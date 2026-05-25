export const KADA_PRODUCT_SLUGS = {
  PLATED: "vedic-kada-plated",
  PURE_SILVER: "vedic-kada-pure-silver",
  SIDDHA_ADDON: "kada-siddha-energisation",
} as const;

export type KadaVariant = "plated" | "silver";
export type KadaDesign = "classic" | "traditional" | "ornate";
export type KadaSizeCode = "S" | "M" | "L" | "XL";
export type KadaPaymentMethod = "cod" | "prepaid";

export const KADA_VARIANTS: Record<
  KadaVariant,
  {
    label: string;
    productSlug: string;
    pricePaise: number;
    mrpPaise: number;
  }
> = {
  plated: {
    label: "Silver Plated",
    productSlug: KADA_PRODUCT_SLUGS.PLATED,
    pricePaise: 74_900,
    mrpPaise: 159_900,
  },
  silver: {
    label: "Pure Silver",
    productSlug: KADA_PRODUCT_SLUGS.PURE_SILVER,
    pricePaise: 449_900,
    mrpPaise: 799_900,
  },
};

export const KADA_DESIGN_LABELS: Record<KadaDesign, string> = {
  classic: "Classic Plain",
  traditional: "Traditional",
  ornate: "Ornate Finish",
};

export const KADA_SIZE_LABELS: Record<KadaSizeCode, string> = {
  S: 'S - 2.2"',
  M: 'M - 2.4"',
  L: 'L - 2.6"',
  XL: 'XL - 2.8"',
};

export const KADA_SIDDHA_ADDON_PRICE_PAISE = 29_900;
export const KADA_PREPAID_DISCOUNT_PAISE = 5_000;

export type KadaPricing = {
  platedPricePaise: number;
  platedMrpPaise: number;
  silverPricePaise: number;
  silverMrpPaise: number;
  siddhaPricePaise: number;
  prepaidDiscountPaise: number;
};

export const FALLBACK_KADA_PRICING: KadaPricing = {
  platedPricePaise: KADA_VARIANTS.plated.pricePaise,
  platedMrpPaise: KADA_VARIANTS.plated.mrpPaise,
  silverPricePaise: KADA_VARIANTS.silver.pricePaise,
  silverMrpPaise: KADA_VARIANTS.silver.mrpPaise,
  siddhaPricePaise: KADA_SIDDHA_ADDON_PRICE_PAISE,
  prepaidDiscountPaise: KADA_PREPAID_DISCOUNT_PAISE,
};

export function isKadaProductSlug(slug: string | null | undefined): boolean {
  return slug === KADA_PRODUCT_SLUGS.PLATED || slug === KADA_PRODUCT_SLUGS.PURE_SILVER;
}

export function parseKadaVariant(raw: string | null | undefined): KadaVariant {
  return raw === "silver" ? "silver" : "plated";
}

export function parseKadaDesign(raw: string | null | undefined): KadaDesign {
  if (raw === "traditional" || raw === "ornate") return raw;
  return "classic";
}

export function parseKadaSize(raw: string | null | undefined): KadaSizeCode {
  if (raw === "S" || raw === "L" || raw === "XL") return raw;
  return "M";
}

export function kadaTotalPaise(input: {
  variant: KadaVariant;
  siddha: boolean;
  paymentMethod: KadaPaymentMethod;
  pricing?: KadaPricing;
}): number {
  const pricing = input.pricing ?? FALLBACK_KADA_PRICING;
  const base =
    input.variant === "silver"
      ? pricing.silverPricePaise
      : pricing.platedPricePaise;
  return (
    base +
    (input.siddha ? pricing.siddhaPricePaise : 0) -
    (input.paymentMethod === "prepaid" ? pricing.prepaidDiscountPaise : 0)
  );
}

export function kadaVariantPricePaise(variant: KadaVariant, pricing?: KadaPricing): number {
  const p = pricing ?? FALLBACK_KADA_PRICING;
  return variant === "silver" ? p.silverPricePaise : p.platedPricePaise;
}

export function kadaVariantMrpPaise(variant: KadaVariant, pricing?: KadaPricing): number {
  const p = pricing ?? FALLBACK_KADA_PRICING;
  return variant === "silver" ? p.silverMrpPaise : p.platedMrpPaise;
}

