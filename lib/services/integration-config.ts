export interface InteraktIntegrationConfig {
  enabled: boolean;
  endpointUrl: string;
  templateListApiUrl: string | null;
  apiKey: string | null;
  templateName: string;
  languageCode: string;
  countryCode: string;
  triggerOnPaymentSuccess: boolean;
  /** WhatsApp template for `paid-kundli` payment success (body {{1}} = name; button URL {{1}}). */
  kundliDeliveryTemplateName: string;
  kundliDeliveryTemplateLanguage: string;
  /** Interakt button index for the URL button (usually first button = "0"). */
  kundliDeliveryButtonIndex: string;
  /**
   * Optional URL template for the button. Placeholders: `{order_number}`, `{order_id}`.
   * If unset, defaults to `{NEXT_PUBLIC_SITE_URL}/kundli-report`.
   */
  kundliDeliveryButtonLinkTemplate: string | null;
}

export interface SmtpEmailIntegrationConfig {
  enabled: boolean;
  host: string | null;
  port: number;
  secure: boolean;
  user: string | null;
  pass: string | null;
  from: string | null;
  replyTo: string | null;
  supportLink: string;
  retryCount: number;
  triggerOnPaymentSuccess: boolean;
}

export interface DeliveryIntegrationsConfig {
  interakt: InteraktIntegrationConfig;
  email: SmtpEmailIntegrationConfig;
}

const INTERAKT_DEFAULT_ENDPOINT = "https://api.interakt.ai/v1/public/message/";
const DEFAULT_SUPPORT_LINK = "https://wa.me/919999999999";

function readBoolean(input: string | undefined, fallback: boolean): boolean {
  if (input == null || input.trim() === "") return fallback;
  const normalized = input.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

/** If `INTERAKT_ENABLED` is unset, treat as on when an API key exists (avoids “disabled” after only setting the key). */
function readInteraktEnabled(apiKey: string | null): boolean {
  const raw = process.env.INTERAKT_ENABLED;
  if (raw != null && raw.trim() !== "") {
    return readBoolean(raw, false);
  }
  return Boolean(apiKey);
}

function readNumber(input: string | undefined, fallback: number): number {
  if (!input || !input.trim()) return fallback;
  const parsed = Number(input);
  if (Number.isNaN(parsed) || !Number.isFinite(parsed)) return fallback;
  return parsed;
}

/**
 * Interakt expects `Authorization: Basic <secret>`. Users often paste
 * `Basic <secret>` or `"Basic ..."` from docs — strip so we do not send `Basic Basic …`.
 */
export function normalizeInteraktApiKey(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  let k = raw.trim();
  if (
    (k.startsWith('"') && k.endsWith('"')) ||
    (k.startsWith("'") && k.endsWith("'"))
  ) {
    k = k.slice(1, -1).trim();
  }
  if (/^basic\s+/i.test(k)) {
    k = k.replace(/^basic\s+/i, "").trim();
  }
  return k.length ? k : null;
}

export function getDeliveryIntegrationsConfig(): DeliveryIntegrationsConfig {
  const supportFromPublicEnv = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim()
    ? `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim()}`
    : null;

  const interaktApiKey = normalizeInteraktApiKey(process.env.INTERAKT_API_KEY);

  return {
    interakt: {
      enabled: readInteraktEnabled(interaktApiKey),
      endpointUrl: process.env.INTERAKT_API_URL?.trim() || INTERAKT_DEFAULT_ENDPOINT,
      templateListApiUrl: process.env.INTERAKT_TEMPLATE_LIST_API_URL?.trim() || null,
      apiKey: interaktApiKey,
      templateName: process.env.INTERAKT_TEMPLATE_NAME?.trim() || "order_paid_update",
      languageCode: process.env.INTERAKT_TEMPLATE_LANGUAGE?.trim() || "en",
      countryCode: process.env.INTERAKT_COUNTRY_CODE?.trim() || "+91",
      triggerOnPaymentSuccess: readBoolean(process.env.INTERAKT_AUTO_DELIVERY_ON_PAYMENT, true),
      kundliDeliveryTemplateName:
        process.env.INTERAKT_KUNDLI_TEMPLATE_NAME?.trim() || "kundlidelivery_bt",
      kundliDeliveryTemplateLanguage:
        process.env.INTERAKT_KUNDLI_TEMPLATE_LANG?.trim() || "hi",
      kundliDeliveryButtonIndex:
        process.env.INTERAKT_KUNDLI_BUTTON_INDEX?.trim() || "0",
      kundliDeliveryButtonLinkTemplate:
        process.env.INTERAKT_KUNDLI_BUTTON_LINK?.trim() || null,
    },
    email: {
      enabled: readBoolean(process.env.SMTP_EMAIL_ENABLED, false),
      host: process.env.SMTP_HOST?.trim() || null,
      port: readNumber(process.env.SMTP_PORT, 465),
      secure: readBoolean(process.env.SMTP_SECURE, true),
      user: process.env.SMTP_USER?.trim() || null,
      pass: process.env.SMTP_PASS?.trim() || null,
      from: process.env.EMAIL_FROM?.trim() || null,
      replyTo: process.env.EMAIL_REPLY_TO?.trim() || null,
      supportLink:
        process.env.EMAIL_SUPPORT_LINK?.trim() ||
        supportFromPublicEnv ||
        DEFAULT_SUPPORT_LINK,
      retryCount: Math.max(1, Math.min(3, readNumber(process.env.SMTP_RETRY_COUNT, 2))),
      triggerOnPaymentSuccess: readBoolean(process.env.SMTP_AUTO_DELIVERY_ON_PAYMENT, true),
    },
  };
}

export function maskSecret(value: string | null | undefined): string {
  if (!value) return "Not set";
  if (value.length <= 8) return "********";
  return `${value.slice(0, 4)}******${value.slice(-4)}`;
}

export function isValidHttpUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

