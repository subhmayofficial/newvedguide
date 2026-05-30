import { createHash } from "crypto";

export interface MetaCapiConfig {
  pixelId: string;
  accessToken: string;
  testEventCode?: string;
}

export interface MetaPurchaseContext {
  orderId: string;
  orderNumber: string;
  valuePaise: number;
  currency: string;
  email?: string | null;
  phone?: string | null;
  eventSourceUrl: string;
  clientIpAddress?: string | null;
  clientUserAgent?: string | null;
  fbp?: string | null;
  fbc?: string | null;
}

export function getMetaCapiConfig(): MetaCapiConfig | null {
  if (process.env.META_CAPI_ENABLED === "false") return null;
  const pixelId = process.env.META_PIXEL_ID?.trim();
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN?.trim();
  if (!pixelId || !accessToken) return null;
  return {
    pixelId,
    accessToken,
    testEventCode: process.env.META_CAPI_TEST_EVENT_CODE?.trim() || undefined,
  };
}

/** Only paid-kundli orders from /ads URLs fire Meta CAPI Purchase. */
export function isMetaCapiAdsPurchaseOrder(
  source: string | null | undefined,
  entryPath: string | null | undefined
): boolean {
  const page = (source ?? "").trim().toLowerCase();
  const entry = (entryPath ?? "").trim().toLowerCase();
  return page.startsWith("/ads") || entry === "ads" || entry.startsWith("ads_");
}

/** Orders from /kundli/new-checkout (kundli_direct_lp funnel). */
export function isKundliNewCheckoutOrder(
  source: string | null | undefined,
  entryPath: string | null | undefined
): boolean {
  const page = (source ?? "").trim();
  const entry = (entryPath ?? "").trim().toLowerCase();
  return (
    page === "/kundli/new-checkout" ||
    entry === "kundli_direct_lp" ||
    page.toLowerCase().includes("kundli_direct_lp")
  );
}

function sha256Normalized(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeEmail(email: string): string | null {
  const e = email.trim().toLowerCase();
  return e.includes("@") ? e : null;
}

/** Meta CAPI: digits only with country code (default India 91). */
function normalizePhone(phone: string): string | null {
  let digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) digits = `91${digits}`;
  else if (digits.startsWith("0")) digits = digits.replace(/^0+/, "");
  if (digits.length < 11) return null;
  return digits;
}

export async function sendMetaPurchaseEvent(
  config: MetaCapiConfig,
  input: MetaPurchaseContext
): Promise<MetaCapiSendResult> {
  const userData: Record<string, string | string[]> = {};

  if (input.email) {
    const normalized = normalizeEmail(input.email);
    if (normalized) userData.em = [sha256Normalized(normalized)];
  }
  if (input.phone) {
    const normalized = normalizePhone(input.phone);
    if (normalized) userData.ph = [sha256Normalized(normalized)];
  }
  if (input.clientIpAddress?.trim()) {
    userData.client_ip_address = input.clientIpAddress.trim();
  }
  if (input.clientUserAgent?.trim()) {
    userData.client_user_agent = input.clientUserAgent.trim();
  }
  if (input.fbp?.trim()) userData.fbp = input.fbp.trim();
  if (input.fbc?.trim()) userData.fbc = input.fbc.trim();

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.orderId,
        action_source: "website",
        event_source_url: input.eventSourceUrl,
        user_data: userData,
        custom_data: {
          currency: input.currency,
          value: input.valuePaise / 100,
          order_id: input.orderNumber || input.orderId,
          content_ids: ["paid-kundli"],
          content_type: "product",
        },
      },
    ],
  };

  if (config.testEventCode) {
    payload.test_event_code = config.testEventCode;
  }

  const requestUrlSafe = `https://graph.facebook.com/v21.0/${config.pixelId}/events`;
  const url = `${requestUrlSafe}?access_token=${encodeURIComponent(config.accessToken)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const responseText = await res.text();
  let json: { error?: { message?: string }; events_received?: number } = {};
  try {
    json = JSON.parse(responseText) as typeof json;
  } catch {
    json = {};
  }

  if (!res.ok) {
    console.error("[meta-capi][purchase]", {
      orderId: input.orderId,
      status: res.status,
      body: json,
    });
    return {
      ok: false,
      error: json.error?.message ?? `HTTP ${res.status}`,
      responseStatus: res.status,
      responseBody: responseText,
      requestUrlSafe,
      requestBody: payload,
    };
  }

  console.info("[meta-capi][purchase] ok", {
    orderId: input.orderId,
    eventsReceived: json.events_received ?? null,
    testEventCode: config.testEventCode ?? null,
    eventSourceUrl: input.eventSourceUrl,
  });

  return {
    ok: true,
    responseStatus: res.status,
    responseBody: responseText,
    requestUrlSafe,
    requestBody: payload,
    eventsReceived: json.events_received,
  };
}

export interface MetaCapiSendResult {
  ok: boolean;
  error?: string;
  responseStatus?: number;
  responseBody?: string;
  requestUrlSafe?: string;
  requestBody?: Record<string, unknown>;
  eventsReceived?: number;
}
