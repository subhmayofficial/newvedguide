/** Whole rupees from paise (100 paise = ₹1). */
export function formatInrFromPaise(paise: number): string {
  const rupees = Math.floor(paise / 100);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(rupees);
}

/** Rupees with up to 2 decimals (for meter deductions and order totals). */
export function formatInrFromPaisePrecise(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rupees);
}
