/** 7 Horses on Frame — single source of truth for storefront + checkout + API */

export const SEVEN_HORSES_COD_PRICE = 899;
export const SEVEN_HORSES_PREPAID_PRICE = 799;
export const SEVEN_HORSES_PREPAID_DISCOUNT =
  SEVEN_HORSES_COD_PRICE - SEVEN_HORSES_PREPAID_PRICE;
export const SEVEN_HORSES_SIDDH_EXTRA = 251;
export const SEVEN_HORSES_MRP = 2200;

export const SEVEN_HORSES_COD_PRICE_PAISE = SEVEN_HORSES_COD_PRICE * 100;
export const SEVEN_HORSES_PREPAID_DISCOUNT_PAISE =
  SEVEN_HORSES_PREPAID_DISCOUNT * 100;
export const SEVEN_HORSES_SIDDH_EXTRA_PAISE = SEVEN_HORSES_SIDDH_EXTRA * 100;

export function sevenHorsesCodPrice(siddh = false): number {
  return SEVEN_HORSES_COD_PRICE + (siddh ? SEVEN_HORSES_SIDDH_EXTRA : 0);
}

export function sevenHorsesPrepaidPrice(siddh = false): number {
  return sevenHorsesCodPrice(siddh) - SEVEN_HORSES_PREPAID_DISCOUNT;
}

export function sevenHorsesDiscountPct(): number {
  return Math.round((1 - SEVEN_HORSES_COD_PRICE / SEVEN_HORSES_MRP) * 100);
}
