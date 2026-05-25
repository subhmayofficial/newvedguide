import { Resend } from "resend";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import {
  getDeliveryIntegrationsConfig,
  isValidHttpUrl,
  type InteraktIntegrationConfig,
} from "@/lib/services/integration-config";
import { applySmtpTemplateVariables } from "@/lib/smtp-template-vars";

const REQUEST_TIMEOUT_MS = 12_000;
const MAX_RESPONSE_TEXT_LENGTH = 8_000;

type DeliveryProvider = "interakt" | "resend" | "make";
type DeliveryChannel = "whatsapp" | "email" | "webhook";
type DeliveryStatus = "success" | "failed" | "skipped";

interface DeliveryContext {
  eventName: string;
  triggerSource: string;
  customerId?: string | null;
  leadId?: string | null;
  orderId?: string | null;
  createdBy?: string | null;
}

export interface DeliveryAttemptResult {
  ok: boolean;
  status: DeliveryStatus;
  provider: DeliveryProvider;
  message: string;
  responseStatus: number | null;
  responseBody: string | null;
}

export interface InteraktWebhookInput extends DeliveryContext {
  fullName?: string | null;
  phone?: string | null;
  templateName?: string | null;
  languageCode?: string | null;
  callbackData?: string | null;
  campaignId?: string | null;
  fileName?: string | null;
  headerValues?: string[];
  bodyValues?: string[];
  buttonValues?: Record<string, string[]>;
  buttonPayload?: Record<string, string[]>;
  metadata?: Record<string, unknown>;
}

export interface InteraktCreateCampaignInput {
  campaignName: string;
  templateName: string;
  languageCode: string;
  createdBy?: string | null;
}

export interface ResendEmailInput extends DeliveryContext {
  fullName?: string | null;
  email?: string | null;
  subject: string;
  html: string;
  text?: string | null;
  payloadExtras?: Record<string, unknown>;
}

export interface PaymentSuccessEmailInput extends DeliveryContext {
  fullName?: string | null;
  email?: string | null;
  orderIdLabel: string;
  product: string;
  amount: string;
  deliveryText: string;
  supportLink: string;
}

export interface InteraktCampaignResult {
  ok: boolean;
  message: string;
  responseStatus: number | null;
  responseBody: string | null;
  campaignId: string | null;
}

type DeliveryLogInput = {
  provider: DeliveryProvider;
  channel: DeliveryChannel;
  eventName: string;
  status: DeliveryStatus;
  triggerSource: string;
  customerId?: string | null;
  leadId?: string | null;
  orderId?: string | null;
  requestUrl?: string | null;
  requestMethod?: string;
  requestHeadersJson?: Json | null;
  requestBodyJson?: Json | null;
  responseStatus?: number | null;
  responseHeadersJson?: Json | null;
  responseBody?: string | null;
  errorMessage?: string | null;
  createdBy?: string | null;
};

type PaidOrderDeliveryRow = {
  id: string;
  order_number: string;
  product_slug: string;
  total_amount: string;
  currency: string;
  customer_id: string;
  lead_id: string | null;
  source: string | null;
  entry_path: string | null;
  consultation_type: string | null;
  session_note: string | null;
  paid_at?: string | null;
  birth_details?: {
    full_name: string | null;
    gender: string | null;
    report_language: string | null;
    date_of_birth: string | null;
    time_of_birth: string | null;
    birth_place: string | null;
  } | null;
  customers: {
    full_name: string | null;
    phone: string | null;
    email: string | null;
  } | null;
};

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function truncateText(input: string | null | undefined, max = MAX_RESPONSE_TEXT_LENGTH): string | null {
  if (!input) return null;
  return input.length > max ? `${input.slice(0, max)}...` : input;
}

/** Surfaces Interakt/Meta-style JSON errors in admin; 400 usually means template/payload mismatch. */
function formatHttpProviderError(
  provider: DeliveryProvider,
  status: number,
  body: string | null
): string {
  const snippet = (body ?? "").trim();
  if (!snippet) {
    return `${provider} API returned ${status}`;
  }
  try {
    const j = JSON.parse(snippet) as Record<string, unknown>;
    const nested =
      j.result && typeof j.result === "object" && j.result !== null
        ? (j.result as Record<string, unknown>)
        : null;
    const msg =
      (typeof j.message === "string" && j.message) ||
      (typeof j.error === "string" && j.error) ||
      (typeof j.msg === "string" && j.msg) ||
      (nested && typeof nested.message === "string" && nested.message) ||
      null;
    if (msg) {
      return `${provider} API returned ${status}: ${msg}`;
    }
  } catch {
    /* not JSON */
  }
  return `${provider} API returned ${status}: ${snippet.slice(0, 500)}`;
}

function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  return digits.length > 10 ? digits.slice(-10) : digits;
}

function normalizeCountryCode(code: string): string {
  if (!code.trim()) return "+91";
  return code.startsWith("+") ? code : `+${code}`;
}

function buildSafeHeaders(headers: Record<string, string>): Record<string, string> {
  const safe = { ...headers };
  for (const key of Object.keys(safe)) {
    if (/authorization|secret|token|api[-_]?key/i.test(key)) {
      safe[key] = "[REDACTED]";
    }
  }
  return safe;
}

function headersToJson(headers: Headers): Json {
  const out: Record<string, string> = {};
  headers.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

function toPlainTextFromHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<li>/gi, "- ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function insertDeliveryLog(
  supabase: SupabaseClient<Database>,
  input: DeliveryLogInput
): Promise<void> {
  const row: Database["public"]["Tables"]["integration_deliveries"]["Insert"] = {
    provider: input.provider,
    channel: input.channel,
    event_name: input.eventName,
    status: input.status,
    trigger_source: input.triggerSource,
    customer_id: input.customerId ?? null,
    lead_id: input.leadId ?? null,
    order_id: input.orderId ?? null,
    request_url: input.requestUrl ?? null,
    request_method: input.requestMethod ?? "POST",
    request_headers_json: input.requestHeadersJson ?? null,
    request_body_json: input.requestBodyJson ?? null,
    response_status: input.responseStatus ?? null,
    response_headers_json: input.responseHeadersJson ?? null,
    response_body: input.responseBody ?? null,
    error_message: input.errorMessage ?? null,
    created_by: input.createdBy ?? null,
  };

  const { error } = await supabase.from("integration_deliveries").insert(row);
  if (error) {
    console.error("[integration-deliveries][insert]", error.message);
  }
}

async function postJsonWithLogging(
  supabase: SupabaseClient<Database>,
  input: {
    provider: DeliveryProvider;
    channel: DeliveryChannel;
    context: DeliveryContext;
    url: string;
    requestHeaders: Record<string, string>;
    requestBody: Record<string, unknown>;
  }
): Promise<DeliveryAttemptResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const safeHeaders = buildSafeHeaders(input.requestHeaders);

  try {
    const response = await fetch(input.url, {
      method: "POST",
      headers: input.requestHeaders,
      body: JSON.stringify(input.requestBody),
      signal: controller.signal,
      cache: "no-store",
    });
    const responseText = truncateText(await response.text());
    const status: DeliveryStatus = response.ok ? "success" : "failed";
    const message = response.ok
      ? `${input.provider} delivery sent`
      : formatHttpProviderError(input.provider, response.status, responseText);

    await insertDeliveryLog(supabase, {
      provider: input.provider,
      channel: input.channel,
      eventName: input.context.eventName,
      status,
      triggerSource: input.context.triggerSource,
      customerId: input.context.customerId ?? null,
      leadId: input.context.leadId ?? null,
      orderId: input.context.orderId ?? null,
      requestUrl: input.url,
      requestMethod: "POST",
      requestHeadersJson: safeHeaders,
      requestBodyJson: input.requestBody as Json,
      responseStatus: response.status,
      responseHeadersJson: headersToJson(response.headers),
      responseBody: responseText,
      createdBy: input.context.createdBy ?? null,
      errorMessage: response.ok ? null : responseText ?? "Unknown API error",
    });

    return {
      ok: response.ok,
      status,
      provider: input.provider,
      message,
      responseStatus: response.status,
      responseBody: responseText,
    };
  } catch (error) {
    const errMessage = toErrorMessage(error);

    await insertDeliveryLog(supabase, {
      provider: input.provider,
      channel: input.channel,
      eventName: input.context.eventName,
      status: "failed",
      triggerSource: input.context.triggerSource,
      customerId: input.context.customerId ?? null,
      leadId: input.context.leadId ?? null,
      orderId: input.context.orderId ?? null,
      requestUrl: input.url,
      requestMethod: "POST",
      requestHeadersJson: safeHeaders,
      requestBodyJson: input.requestBody as Json,
      responseStatus: null,
      responseBody: null,
      createdBy: input.context.createdBy ?? null,
      errorMessage: errMessage,
    });

    return {
      ok: false,
      status: "failed",
      provider: input.provider,
      message: errMessage,
      responseStatus: null,
      responseBody: null,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function sendInteraktWhatsApp(
  supabase: SupabaseClient<Database>,
  input: InteraktWebhookInput
): Promise<DeliveryAttemptResult> {
  const config = getDeliveryIntegrationsConfig().interakt;
  const normalizedPhone = normalizePhone(input.phone);

  if (!config.enabled) {
    await insertDeliveryLog(supabase, {
      provider: "interakt",
      channel: "whatsapp",
      eventName: input.eventName,
      status: "skipped",
      triggerSource: input.triggerSource,
      customerId: input.customerId ?? null,
      leadId: input.leadId ?? null,
      orderId: input.orderId ?? null,
      requestUrl: config.endpointUrl,
      requestMethod: "POST",
      errorMessage: "Interakt integration is disabled",
      createdBy: input.createdBy ?? null,
    });
    return {
      ok: false,
      status: "skipped",
      provider: "interakt",
      message: "Interakt integration is disabled",
      responseStatus: null,
      responseBody: null,
    };
  }

  if (!isValidHttpUrl(config.endpointUrl)) {
    const message = "Interakt API URL is invalid";
    await insertDeliveryLog(supabase, {
      provider: "interakt",
      channel: "whatsapp",
      eventName: input.eventName,
      status: "failed",
      triggerSource: input.triggerSource,
      customerId: input.customerId ?? null,
      leadId: input.leadId ?? null,
      orderId: input.orderId ?? null,
      requestUrl: config.endpointUrl,
      requestMethod: "POST",
      errorMessage: message,
      createdBy: input.createdBy ?? null,
    });
    return {
      ok: false,
      status: "failed",
      provider: "interakt",
      message,
      responseStatus: null,
      responseBody: null,
    };
  }

  if (!config.apiKey) {
    const message = "Interakt API key is not configured";
    await insertDeliveryLog(supabase, {
      provider: "interakt",
      channel: "whatsapp",
      eventName: input.eventName,
      status: "failed",
      triggerSource: input.triggerSource,
      customerId: input.customerId ?? null,
      leadId: input.leadId ?? null,
      orderId: input.orderId ?? null,
      requestUrl: config.endpointUrl,
      requestMethod: "POST",
      errorMessage: message,
      createdBy: input.createdBy ?? null,
    });
    return {
      ok: false,
      status: "failed",
      provider: "interakt",
      message,
      responseStatus: null,
      responseBody: null,
    };
  }

  if (!normalizedPhone || normalizedPhone.length < 10) {
    const message = "Missing valid customer phone for WhatsApp delivery";
    await insertDeliveryLog(supabase, {
      provider: "interakt",
      channel: "whatsapp",
      eventName: input.eventName,
      status: "skipped",
      triggerSource: input.triggerSource,
      customerId: input.customerId ?? null,
      leadId: input.leadId ?? null,
      orderId: input.orderId ?? null,
      requestUrl: config.endpointUrl,
      requestMethod: "POST",
      errorMessage: message,
      createdBy: input.createdBy ?? null,
    });
    return {
      ok: false,
      status: "skipped",
      provider: "interakt",
      message,
      responseStatus: null,
      responseBody: null,
    };
  }

  // Interakt returns 400 if bodyValues length ≠ template {{n}} count, or wrong template/language.
  const bodyValues =
    input.bodyValues && input.bodyValues.length
      ? input.bodyValues
      : [input.fullName?.trim() || "Customer"];
  const requestBody: Record<string, unknown> = {
    countryCode: normalizeCountryCode(config.countryCode),
    phoneNumber: normalizedPhone,
    callbackData:
      input.callbackData?.trim() ||
      input.orderId ||
      input.leadId ||
      `vedguide_${Date.now()}`,
    type: "Template",
    template: {
      name: input.templateName?.trim() || config.templateName,
      languageCode: input.languageCode?.trim() || config.languageCode,
      bodyValues,
    },
  };
  const template = requestBody.template as Record<string, unknown>;
  if (input.headerValues?.length) {
    template.headerValues = input.headerValues;
  }
  if (input.fileName?.trim()) {
    template.fileName = input.fileName.trim();
  }
  if (input.buttonValues && Object.keys(input.buttonValues).length) {
    template.buttonValues = input.buttonValues;
  }
  if (input.buttonPayload && Object.keys(input.buttonPayload).length) {
    template.buttonPayload = input.buttonPayload;
  }
  if (input.campaignId?.trim()) {
    requestBody.campaignId = input.campaignId.trim();
  }
  if (input.metadata && Object.keys(input.metadata).length) {
    requestBody.metadata = input.metadata;
  }

  const posted = await postJsonWithLogging(supabase, {
    provider: "interakt",
    channel: "whatsapp",
    context: input,
    url: config.endpointUrl,
    requestHeaders: {
      Authorization: `Basic ${config.apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    requestBody,
  });

  // Interakt often returns HTTP 200 with { "result": false, "message": "..." } for logical failures.
  if (posted.ok && posted.responseBody) {
    try {
      const j = JSON.parse(posted.responseBody) as {
        result?: boolean;
        message?: string;
        msg?: string;
      };
      if (j.result === false) {
        const detail =
          (typeof j.message === "string" && j.message) ||
          (typeof j.msg === "string" && j.msg) ||
          "Interakt rejected the send.";
        return {
          ...posted,
          ok: false,
          status: "failed",
          message: `interakt: ${detail}`,
        };
      }
    } catch {
      /* non-JSON body */
    }
  }

  return posted;
}

export async function createInteraktApiCampaign(
  supabase: SupabaseClient<Database>,
  input: InteraktCreateCampaignInput
): Promise<InteraktCampaignResult> {
  const config = getDeliveryIntegrationsConfig().interakt;
  const campaignUrl = "https://api.interakt.ai/v1/public/create-campaign/";

  if (!config.enabled) {
    await insertDeliveryLog(supabase, {
      provider: "interakt",
      channel: "webhook",
      eventName: "create_api_campaign",
      status: "skipped",
      triggerSource: "admin_interakt_campaign_test",
      requestUrl: campaignUrl,
      requestMethod: "POST",
      errorMessage: "Interakt integration is disabled",
      createdBy: input.createdBy ?? null,
    });

    return {
      ok: false,
      message: "Interakt integration is disabled",
      responseStatus: null,
      responseBody: null,
      campaignId: null,
    };
  }

  if (!config.apiKey) {
    await insertDeliveryLog(supabase, {
      provider: "interakt",
      channel: "webhook",
      eventName: "create_api_campaign",
      status: "failed",
      triggerSource: "admin_interakt_campaign_test",
      requestUrl: campaignUrl,
      requestMethod: "POST",
      errorMessage: "Interakt API key is not configured",
      createdBy: input.createdBy ?? null,
    });

    return {
      ok: false,
      message: "Interakt API key is not configured",
      responseStatus: null,
      responseBody: null,
      campaignId: null,
    };
  }

  const requestBody = {
    campaign_name: input.campaignName.trim(),
    campaign_type: "PublicAPI",
    template_name: input.templateName.trim(),
    language_code: input.languageCode.trim() || config.languageCode,
  };

  const result = await postJsonWithLogging(supabase, {
    provider: "interakt",
    channel: "webhook",
    context: {
      eventName: "create_api_campaign",
      triggerSource: "admin_interakt_campaign_test",
      createdBy: input.createdBy ?? null,
    },
    url: campaignUrl,
    requestHeaders: {
      Authorization: `Basic ${config.apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    requestBody,
  });

  let campaignId: string | null = null;
  if (result.responseBody) {
    try {
      const parsed = JSON.parse(result.responseBody) as {
        data?: { campaign_id?: string };
      };
      campaignId = parsed.data?.campaign_id ?? null;
    } catch {
      campaignId = null;
    }
  }

  return {
    ok: result.ok,
    message: campaignId
      ? `${result.message} (campaign ${campaignId})`
      : result.message,
    responseStatus: result.responseStatus,
    responseBody: result.responseBody,
    campaignId,
  };
}

let resendClient: Resend | null = null;

function getResendClient(apiKey: string): Resend {
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export async function sendResendEmail(
  supabase: SupabaseClient<Database>,
  input: ResendEmailInput
): Promise<DeliveryAttemptResult> {
  const config = getDeliveryIntegrationsConfig().email;
  const normalizedEmail = input.email?.trim().toLowerCase() ?? "";
  const resendUrlLabel = "https://api.resend.com/emails";

  if (!config.enabled) {
    await insertDeliveryLog(supabase, {
      provider: "resend",
      channel: "email",
      eventName: input.eventName,
      status: "skipped",
      triggerSource: input.triggerSource,
      customerId: input.customerId ?? null,
      leadId: input.leadId ?? null,
      orderId: input.orderId ?? null,
      requestUrl: resendUrlLabel,
      requestMethod: "POST",
      errorMessage: "Resend email integration is disabled",
      createdBy: input.createdBy ?? null,
    });
    return {
      ok: false,
      status: "skipped",
      provider: "resend",
      message: "Resend email integration is disabled",
      responseStatus: null,
      responseBody: null,
    };
  }

  if (!config.apiKey || !config.from) {
    const message = "Resend configuration is incomplete";
    await insertDeliveryLog(supabase, {
      provider: "resend",
      channel: "email",
      eventName: input.eventName,
      status: "failed",
      triggerSource: input.triggerSource,
      customerId: input.customerId ?? null,
      leadId: input.leadId ?? null,
      orderId: input.orderId ?? null,
      requestUrl: resendUrlLabel,
      requestMethod: "POST",
      errorMessage: message,
      createdBy: input.createdBy ?? null,
    });
    return {
      ok: false,
      status: "failed",
      provider: "resend",
      message,
      responseStatus: null,
      responseBody: null,
    };
  }

  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    const message = "Missing valid recipient email";
    await insertDeliveryLog(supabase, {
      provider: "resend",
      channel: "email",
      eventName: input.eventName,
      status: "skipped",
      triggerSource: input.triggerSource,
      customerId: input.customerId ?? null,
      leadId: input.leadId ?? null,
      orderId: input.orderId ?? null,
      requestUrl: resendUrlLabel,
      requestMethod: "POST",
      errorMessage: message,
      createdBy: input.createdBy ?? null,
    });
    return {
      ok: false,
      status: "skipped",
      provider: "resend",
      message,
      responseStatus: null,
      responseBody: null,
    };
  }

  const client = getResendClient(config.apiKey);
  const fromAddress = config.from;
  let lastError: string | null = null;
  let sendAttempt = 0;

  for (let attempt = 1; attempt <= config.retryCount; attempt += 1) {
    sendAttempt += 1;
    const requestBody = {
      to: [normalizedEmail],
      from: fromAddress,
      reply_to: config.replyTo,
      subject: input.subject,
      html: truncateText(input.html, 3000),
      payload_extras: input.payloadExtras ?? null,
    };

    try {
      const { data, error } = await client.emails.send({
        from: fromAddress,
        to: [normalizedEmail],
        replyTo: config.replyTo ?? undefined,
        subject: input.subject,
        html: input.html,
        text: input.text ?? toPlainTextFromHtml(input.html),
      });

      if (error) {
        lastError = error.message ?? "Resend API error";
        continue;
      }

      await insertDeliveryLog(supabase, {
        provider: "resend",
        channel: "email",
        eventName: input.eventName,
        status: "success",
        triggerSource: input.triggerSource,
        customerId: input.customerId ?? null,
        leadId: input.leadId ?? null,
        orderId: input.orderId ?? null,
        requestUrl: resendUrlLabel,
        requestMethod: "POST",
        requestHeadersJson: {
          authorization: "[REDACTED]",
          content_type: "application/json",
        },
        requestBodyJson: requestBody as Json,
        responseStatus: 200,
        responseBody: truncateText(
          JSON.stringify(
            {
              id: data?.id ?? null,
              attempt,
              total_attempt: sendAttempt,
            },
            null,
            2
          )
        ),
        createdBy: input.createdBy ?? null,
      });

      return {
        ok: true,
        status: "success",
        provider: "resend",
        message: `Resend email sent on attempt ${sendAttempt}`,
        responseStatus: 200,
        responseBody: data?.id ?? null,
      };
    } catch (error) {
      lastError = toErrorMessage(error);
    }
  }

  const finalRequestBody = {
    to: normalizedEmail,
    from: fromAddress,
    reply_to: config.replyTo,
    subject: input.subject,
    html: truncateText(input.html, 3000),
    payload_extras: input.payloadExtras ?? null,
  };

  await insertDeliveryLog(supabase, {
    provider: "resend",
    channel: "email",
    eventName: input.eventName,
    status: "failed",
    triggerSource: input.triggerSource,
    customerId: input.customerId ?? null,
    leadId: input.leadId ?? null,
    orderId: input.orderId ?? null,
    requestUrl: resendUrlLabel,
    requestMethod: "POST",
    requestHeadersJson: {
      authorization: "[REDACTED]",
      from: fromAddress,
      reply_to: config.replyTo ?? null,
      retries: String(config.retryCount),
    },
    requestBodyJson: finalRequestBody as Json,
    responseStatus: null,
    responseBody: null,
    errorMessage: `Resend send failed after ${sendAttempt} attempts: ${lastError ?? "Unknown error"}`,
    createdBy: input.createdBy ?? null,
  });

  return {
    ok: false,
    status: "failed",
    provider: "resend",
    message: `Resend send failed: ${lastError ?? "Unknown error"}`,
    responseStatus: null,
    responseBody: null,
  };
}

function renderPaymentSuccessEmailHtml(input: PaymentSuccessEmailInput): string {
  const safeName = escapeHtml(input.fullName?.trim() || "Customer");
  const safeOrderId = escapeHtml(input.orderIdLabel);
  const safeProduct = escapeHtml(input.product);
  const safeAmount = escapeHtml(input.amount);
  const safeDelivery = escapeHtml(input.deliveryText);
  const safeSupportLink = escapeHtml(input.supportLink);

  return `
<h2>Hey ${safeName},</h2>
<p>Payment successful! Your order is confirmed.</p>

<h3>Order Details:</h3>
<ul>
<li>Order ID: ${safeOrderId}</li>
<li>Product: ${safeProduct}</li>
<li>Amount: Rs ${safeAmount}</li>
</ul>

<p>${safeDelivery}</p>

<p>Support: <a href="${safeSupportLink}">Click here</a></p>
`.trim();
}

export async function sendPaymentSuccessEmail(
  supabase: SupabaseClient<Database>,
  input: PaymentSuccessEmailInput
): Promise<DeliveryAttemptResult> {
  return sendResendEmail(supabase, {
    ...input,
    subject: `Payment Successful - Your Order is Confirmed (${input.orderIdLabel})`,
    html: renderPaymentSuccessEmailHtml(input),
    payloadExtras: {
      name: input.fullName ?? null,
      order_id: input.orderIdLabel,
      product: input.product,
      amount: input.amount,
      delivery_text: input.deliveryText,
      support_link: input.supportLink,
    },
  });
}

function formatProductLabel(slug: string): string {
  if (slug === "paid-kundli") return "Paid Kundli Report";
  if (slug === "fast-track-addon") return "FastTrack Add-on";
  if (slug === "consultation-15min") return "Consultation 15 Min";
  if (slug === "consultation-45min") return "Consultation 45 Min";
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function resolveDeliveryText(productSlug: string): string {
  if (productSlug === "fast-track-addon") {
    return "Your FastTrack request is in priority queue. Delivery starts within ~12 hours.";
  }
  if (productSlug.startsWith("consultation-")) {
    return "Our team will contact you soon with your consultation confirmation and next steps.";
  }
  return "Your report delivery is in process. Typical timeline is 24-48 hours.";
}

function prettyDateTime(raw: string | null | undefined): string {
  if (!raw) return "";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Kolkata",
    }).format(new Date(raw));
  } catch {
    return raw;
  }
}

function firstConfiguredEmail(...candidates: Array<string | null | undefined>): string {
  for (const raw of candidates) {
    const v = raw?.trim();
    if (!v) continue;
    const angleMatch = v.match(/<\s*([^<>\s@]+@[^<>\s@]+\.[^<>\s@]+)\s*>/);
    if (angleMatch?.[1]) return angleMatch[1];
    const mailtoMatch = v.match(/^mailto:([^?\s]+@[^?\s]+\.[^?\s]+)/i);
    if (mailtoMatch?.[1]) return mailtoMatch[1];
    const plainMatch = v.match(/^[^<>\s@]+@[^<>\s@]+\.[^<>\s@]+$/);
    if (plainMatch) return v;
  }
  return "";
}

function buildOrderEmailVars(input: {
  fullName: string;
  email: string;
  phone: string;
  orderId: string;
  orderUuid?: string | null;
  product: string;
  amountRupees: string;
  supportLink: string;
  deliveryText: string;
  paidAt?: string | null;
  birth?: PaidOrderDeliveryRow["birth_details"];
}): Record<string, string> {
  const firstName = input.fullName.trim().split(/\s+/)[0] || input.fullName;
  const amountWithCurrency = `Rs ${input.amountRupees}`;
  const birth = input.birth ?? null;
  const paidAtFormatted = prettyDateTime(input.paidAt);
  const orderDate = paidAtFormatted || prettyDateTime(new Date().toISOString());
  const supportEmail = firstConfiguredEmail(
    process.env.RESEND_REPLY_TO,
    process.env.RESEND_FROM,
    process.env.EMAIL_SUPPORT_LINK
  );
  const deliveryTime = input.deliveryText.match(/\d+\s*[-–]\s*\d+\s*(?:hours?|hrs?|days?)/i)?.[0] ?? input.deliveryText;
  return {
    name: input.fullName,
    first_name: firstName,
    firstName,
    customer_name: input.fullName,
    customerName: input.fullName,
    "customer.name": input.fullName,
    "customer.full_name": input.fullName,
    full_name: input.fullName,
    fullName: input.fullName,
    email: input.email,
    customer_email: input.email,
    customerEmail: input.email,
    "customer.email": input.email,
    phone: input.phone,
    customer_phone: input.phone,
    customerPhone: input.phone,
    "customer.phone": input.phone,
    order_id: input.orderId,
    orderId: input.orderId,
    "order.id": input.orderId,
    order_number: input.orderId,
    orderNumber: input.orderId,
    "order.number": input.orderId,
    order_uuid: input.orderUuid ?? "",
    orderUuid: input.orderUuid ?? "",
    product: input.product,
    product_name: input.product,
    productName: input.product,
    "product.name": input.product,
    amount: input.amountRupees,
    amount_rupees: input.amountRupees,
    amountRupees: input.amountRupees,
    amount_inr: amountWithCurrency,
    amountInr: amountWithCurrency,
    amount_paid: amountWithCurrency,
    amountPaid: amountWithCurrency,
    paid_amount: amountWithCurrency,
    paidAmount: amountWithCurrency,
    order_amount: amountWithCurrency,
    orderAmount: amountWithCurrency,
    payment_amount: amountWithCurrency,
    paymentAmount: amountWithCurrency,
    total_amount: amountWithCurrency,
    totalAmount: amountWithCurrency,
    price: amountWithCurrency,
    "order.amount": amountWithCurrency,
    support_link: input.supportLink,
    supportLink: input.supportLink,
    support_email: supportEmail,
    supportEmail,
    delivery_text: input.deliveryText,
    deliveryText: input.deliveryText,
    delivery_time: deliveryTime,
    deliveryTime,
    order_date: orderDate,
    orderDate,
    payment_date: paidAtFormatted,
    paymentDate: paidAtFormatted,
    paid_at: paidAtFormatted,
    paidAt: paidAtFormatted,
    order_status: "Confirmed",
    orderStatus: "Confirmed",
    payment_status: "Paid",
    paymentStatus: "Paid",
    birth_name: birth?.full_name ?? input.fullName,
    birthName: birth?.full_name ?? input.fullName,
    gender: birth?.gender ?? "",
    report_language: birth?.report_language ?? "",
    reportLanguage: birth?.report_language ?? "",
    dob: birth?.date_of_birth ?? "",
    date_of_birth: birth?.date_of_birth ?? "",
    dateOfBirth: birth?.date_of_birth ?? "",
    tob: birth?.time_of_birth ?? "",
    time_of_birth: birth?.time_of_birth ?? "",
    timeOfBirth: birth?.time_of_birth ?? "",
    pob: birth?.birth_place ?? "",
    birth_place: birth?.birth_place ?? "",
    birthPlace: birth?.birth_place ?? "",
  };
}

function siteOriginFromEnv(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return "";
  try {
    return new URL(raw).origin;
  } catch {
    return "";
  }
}

/** URL for WhatsApp template button variable (dynamic URL). */
function buildKundliDeliveryButtonUrl(
  config: InteraktIntegrationConfig,
  order: PaidOrderDeliveryRow
): string {
  const tmpl = config.kundliDeliveryButtonLinkTemplate;
  const num = order.order_number ?? "";
  const id = order.id ?? "";
  if (tmpl) {
    return tmpl
      .replaceAll("{order_number}", num)
      .replaceAll("{order_id}", id);
  }
  const origin = siteOriginFromEnv();
  const path = "/kundli-report";
  if (origin) return `${origin.replace(/\/$/, "")}${path}`;
  return `https://vedguide.com${path}`;
}

export async function triggerPaymentSuccessDeliveries(
  supabase: SupabaseClient<Database>,
  orderId: string
): Promise<void> {
  const config = getDeliveryIntegrationsConfig();
  if (!config.interakt.triggerOnPaymentSuccess && !config.email.triggerOnPaymentSuccess) {
    return;
  }

  const { data } = await supabase
    .from("orders")
    .select(
      "id,order_number,product_slug,total_amount,currency,customer_id,lead_id,source,entry_path,consultation_type,session_note,paid_at,birth_details(full_name,gender,report_language,date_of_birth,time_of_birth,birth_place),customers(full_name,phone,email)"
    )
    .eq("id", orderId)
    .maybeSingle();

  const order = data as PaidOrderDeliveryRow | null;
  if (!order) return;

  const customer = order.customers;
  const fullName = customer?.full_name ?? "Customer";
  const amountRupees = (Number(order.total_amount) / 100).toFixed(0);
  const productName = formatProductLabel(order.product_slug);

  if (config.interakt.triggerOnPaymentSuccess) {
    if (order.product_slug === "paid-kundli") {
      const btnIdx = config.interakt.kundliDeliveryButtonIndex || "0";
      const buttonUrl = buildKundliDeliveryButtonUrl(config.interakt, order);
      await sendInteraktWhatsApp(supabase, {
        eventName: "payment_success",
        triggerSource: "payment_success_auto_kundli",
        orderId: order.id,
        leadId: order.lead_id,
        customerId: order.customer_id,
        fullName,
        phone: customer?.phone ?? null,
        templateName: config.interakt.kundliDeliveryTemplateName,
        languageCode: config.interakt.kundliDeliveryTemplateLanguage,
        bodyValues: [fullName],
        buttonValues: { [btnIdx]: [buttonUrl] },
        metadata: {
          order_number: order.order_number,
          product_slug: order.product_slug,
          source: order.source,
          entry_path: order.entry_path,
          interakt_template: config.interakt.kundliDeliveryTemplateName,
        },
      });
    } else {
      await sendInteraktWhatsApp(supabase, {
        eventName: "payment_success",
        triggerSource: "payment_success_auto",
        orderId: order.id,
        leadId: order.lead_id,
        customerId: order.customer_id,
        fullName,
        phone: customer?.phone ?? null,
        bodyValues: [fullName, productName, `Rs ${amountRupees}`],
        metadata: {
          order_number: order.order_number,
          product_slug: order.product_slug,
          source: order.source,
          entry_path: order.entry_path,
        },
      });
    }
  }

  if (config.email.triggerOnPaymentSuccess) {
    if (order.product_slug === "paid-kundli") {
      const { data: automationRow } = await supabase
        .from("admin_email_automations")
        .select("is_enabled,template_name")
        .eq("automation_key", "kundli_order_confirmation")
        .maybeSingle();

      const automationEnabled = automationRow?.is_enabled ?? true;
      const automationTemplateName =
        automationRow?.template_name?.trim() || "kundli_order_confirmation";

      if (!automationEnabled) {
        return;
      }

      const { data: templateRow } = await supabase
        .from("admin_smtp_templates")
        .select("subject,html")
        .eq("name", automationTemplateName)
        .eq("is_active", true)
        .maybeSingle();

      if (templateRow?.html) {
        const vars = buildOrderEmailVars({
          fullName,
          email: customer?.email ?? "",
          phone: customer?.phone ?? "",
          orderId: order.order_number,
          orderUuid: order.id,
          product: productName,
          amountRupees,
          supportLink: config.email.supportLink,
          deliveryText: resolveDeliveryText(order.product_slug),
          paidAt: order.paid_at,
          birth: order.birth_details ?? null,
        });
        const subject =
          applySmtpTemplateVariables(templateRow.subject || "Order confirmation", vars).trim() ||
          `Order Confirmed (${order.order_number})`;
        const html = applySmtpTemplateVariables(templateRow.html, vars).trim();
        await sendResendEmail(supabase, {
          eventName: "kundli_order_confirmation",
          triggerSource: "automation_kundli_order_confirmation",
          orderId: order.id,
          leadId: order.lead_id,
          customerId: order.customer_id,
          fullName,
          email: customer?.email ?? null,
          subject,
          html,
          payloadExtras: {
            automation_key: "kundli_order_confirmation",
            automation_template_name: automationTemplateName,
            vars,
          },
        });
      } else {
        await sendPaymentSuccessEmail(supabase, {
          eventName: "payment_success",
          triggerSource: "payment_success_auto_fallback",
          orderId: order.id,
          leadId: order.lead_id,
          customerId: order.customer_id,
          fullName,
          email: customer?.email ?? null,
          orderIdLabel: order.order_number,
          product: productName,
          amount: amountRupees,
          deliveryText: resolveDeliveryText(order.product_slug),
          supportLink: config.email.supportLink,
        });
      }
    } else {
      await sendPaymentSuccessEmail(supabase, {
        eventName: "payment_success",
        triggerSource: "payment_success_auto",
        orderId: order.id,
        leadId: order.lead_id,
        customerId: order.customer_id,
        fullName,
        email: customer?.email ?? null,
        orderIdLabel: order.order_number,
        product: productName,
        amount: amountRupees,
        deliveryText: resolveDeliveryText(order.product_slug),
        supportLink: config.email.supportLink,
      });
    }
  }
}

export async function triggerKundliDeliveryCompletedEmail(
  supabase: SupabaseClient<Database>,
  input: {
    orderId: string;
    customerName: string;
    reportUrl: string;
    createdBy?: string | null;
    triggerSource?: string;
  }
): Promise<void> {
  const config = getDeliveryIntegrationsConfig();
  if (!config.email.enabled) return;

  const { data: orderRaw } = await supabase
    .from("orders")
    .select("id,order_number,product_slug,total_amount,customer_id,lead_id,paid_at,birth_details(full_name,gender,report_language,date_of_birth,time_of_birth,birth_place),customers(full_name,email,phone)")
    .eq("id", input.orderId)
    .maybeSingle();
  const order = orderRaw as PaidOrderDeliveryRow | null;
  if (!order || order.product_slug !== "paid-kundli") return;

  const customer = order.customers;
  const fullName = input.customerName?.trim() || customer?.full_name || "Customer";
  const email = customer?.email?.trim() || null;
  if (!email) return;

  const { data: automationRow } = await supabase
    .from("admin_email_automations")
    .select("is_enabled,template_name")
    .eq("automation_key", "kundli_delivery_completed")
    .maybeSingle();
  const automationEnabled = automationRow?.is_enabled ?? true;
  const automationTemplateName =
    automationRow?.template_name?.trim() || "kundli_delivery_completed";
  if (!automationEnabled) return;

  const { data: templateRow } = await supabase
    .from("admin_smtp_templates")
    .select("subject,html")
    .eq("name", automationTemplateName)
    .eq("is_active", true)
    .maybeSingle();
  if (!templateRow?.html) return;

  const amountRupees = (Number(order.total_amount) / 100).toFixed(0);
  const vars = {
    ...buildOrderEmailVars({
      fullName,
      email,
      phone: customer?.phone ?? "",
      orderId: order.order_number,
      orderUuid: order.id,
      product: "Paid Kundli Report",
      amountRupees,
      supportLink: config.email.supportLink,
      deliveryText: "Your paid kundli report has been delivered.",
      paidAt: order.paid_at,
      birth: order.birth_details ?? null,
    }),
    report_url: input.reportUrl,
    reportUrl: input.reportUrl,
  };
  const subject =
    applySmtpTemplateVariables(templateRow.subject || "Kundli report delivered", vars).trim() ||
    `Kundli report delivered (${order.order_number})`;
  const html = applySmtpTemplateVariables(templateRow.html, vars).trim();

  await sendResendEmail(supabase, {
    eventName: "kundli_delivery_completed",
    triggerSource: input.triggerSource ?? "automation_kundli_delivery_completed",
    orderId: order.id,
    leadId: order.lead_id,
    customerId: order.customer_id,
    createdBy: input.createdBy ?? null,
    fullName,
    email,
    subject,
    html,
    payloadExtras: {
      automation_key: "kundli_delivery_completed",
      automation_template_name: automationTemplateName,
      vars,
    },
  });
}
