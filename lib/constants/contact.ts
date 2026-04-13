/**
 * WhatsApp deep links. Set `NEXT_PUBLIC_WHATSAPP_NUMBER` to digits only with country code (e.g. 919876543210).
 */
export function getWhatsAppHref(prefillMessage: string): string {
  const raw =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "") ?? "91XXXXXXXXXX";
  return `https://wa.me/${raw}?text=${encodeURIComponent(prefillMessage)}`;
}
