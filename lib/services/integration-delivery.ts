import nodemailer from "nodemailer";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import {
  getDeliveryIntegrationsConfig,
  isValidHttpUrl,
  type InteraktIntegrationConfig,
} from "@/lib/services/integration-config";

const REQUEST_TIMEOUT_MS = 12_000;
const MAX_RESPONSE_TEXT_LENGTH = 8_000;

type DeliveryProvider = "interakt" | "smtp" | "make";
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

export interface SmtpEmailInput extends DeliveryContext {
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

  return postJsonWithLogging(supabase, {
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

export async function sendSmtpEmail(
  supabase: SupabaseClient<Database>,
  input: SmtpEmailInput
): Promise<DeliveryAttemptResult> {
  const config = getDeliveryIntegrationsConfig().email;
  const normalizedEmail = input.email?.trim().toLowerCase() ?? "";
  const smtpUrlLabel = config.host ? `smtp://${config.host}:${config.port}` : "smtp://unconfigured";

  if (!config.enabled) {
    await insertDeliveryLog(supabase, {
      provider: "smtp",
      channel: "email",
      eventName: input.eventName,
      status: "skipped",
      triggerSource: input.triggerSource,
      customerId: input.customerId ?? null,
      leadId: input.leadId ?? null,
      orderId: input.orderId ?? null,
      requestUrl: smtpUrlLabel,
      requestMethod: "SMTP",
      errorMessage: "SMTP email integration is disabled",
      createdBy: input.createdBy ?? null,
    });
    return {
      ok: false,
      status: "skipped",
      provider: "smtp",
      message: "SMTP email integration is disabled",
      responseStatus: null,
      responseBody: null,
    };
  }

  if (!config.host || !config.user || !config.pass || !config.from) {
    const message = "SMTP configuration is incomplete";
    await insertDeliveryLog(supabase, {
      provider: "smtp",
      channel: "email",
      eventName: input.eventName,
      status: "failed",
      triggerSource: input.triggerSource,
      customerId: input.customerId ?? null,
      leadId: input.leadId ?? null,
      orderId: input.orderId ?? null,
      requestUrl: smtpUrlLabel,
      requestMethod: "SMTP",
      errorMessage: message,
      createdBy: input.createdBy ?? null,
    });
    return {
      ok: false,
      status: "failed",
      provider: "smtp",
      message,
      responseStatus: null,
      responseBody: null,
    };
  }

  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    const message = "Missing valid recipient email";
    await insertDeliveryLog(supabase, {
      provider: "smtp",
      channel: "email",
      eventName: input.eventName,
      status: "skipped",
      triggerSource: input.triggerSource,
      customerId: input.customerId ?? null,
      leadId: input.leadId ?? null,
      orderId: input.orderId ?? null,
      requestUrl: smtpUrlLabel,
      requestMethod: "SMTP",
      errorMessage: message,
      createdBy: input.createdBy ?? null,
    });
    return {
      ok: false,
      status: "skipped",
      provider: "smtp",
      message,
      responseStatus: null,
      responseBody: null,
    };
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  const fromCandidates = Array.from(new Set([config.from, config.user].filter(Boolean)));
  let lastError: string | null = null;
  let lastFrom: string | null = null;
  let sendAttempt = 0;

  for (const fromAddress of fromCandidates) {
    for (let attempt = 1; attempt <= config.retryCount; attempt += 1) {
      sendAttempt += 1;
      lastFrom = fromAddress!;

      const requestBody = {
        to: normalizedEmail,
        from: fromAddress,
        reply_to: config.replyTo,
        subject: input.subject,
        html: truncateText(input.html, 3000),
        payload_extras: input.payloadExtras ?? null,
      };

      try {
        const info = await transporter.sendMail({
          from: fromAddress,
          to: normalizedEmail,
          replyTo: config.replyTo ?? undefined,
          subject: input.subject,
          html: input.html,
          text: input.text ?? toPlainTextFromHtml(input.html),
        });

        await insertDeliveryLog(supabase, {
          provider: "smtp",
          channel: "email",
          eventName: input.eventName,
          status: "success",
          triggerSource: input.triggerSource,
          customerId: input.customerId ?? null,
          leadId: input.leadId ?? null,
          orderId: input.orderId ?? null,
          requestUrl: smtpUrlLabel,
          requestMethod: "SMTP",
          requestHeadersJson: {
            host: config.host,
            port: String(config.port),
            secure: String(config.secure),
            user: config.user,
            from: fromAddress,
            reply_to: config.replyTo ?? null,
            retries: String(config.retryCount),
          },
          requestBodyJson: requestBody as Json,
          responseStatus: 250,
          responseBody: truncateText(
            JSON.stringify(
              {
                messageId: info.messageId,
                accepted: info.accepted,
                rejected: info.rejected,
                response: info.response,
                envelope: info.envelope,
                attempt,
                total_attempt: sendAttempt,
                sender_used: fromAddress,
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
          provider: "smtp",
          message: `SMTP email sent on attempt ${sendAttempt} using ${fromAddress}`,
          responseStatus: 250,
          responseBody: info.response ?? null,
        };
      } catch (error) {
        lastError = toErrorMessage(error);
      }
    }
  }

  const finalRequestBody = {
    to: normalizedEmail,
    from: lastFrom ?? config.from,
    reply_to: config.replyTo,
    subject: input.subject,
    html: truncateText(input.html, 3000),
    payload_extras: input.payloadExtras ?? null,
  };

  await insertDeliveryLog(supabase, {
    provider: "smtp",
    channel: "email",
    eventName: input.eventName,
    status: "failed",
    triggerSource: input.triggerSource,
    customerId: input.customerId ?? null,
    leadId: input.leadId ?? null,
    orderId: input.orderId ?? null,
    requestUrl: smtpUrlLabel,
    requestMethod: "SMTP",
    requestHeadersJson: {
      host: config.host,
      port: String(config.port),
      secure: String(config.secure),
      user: config.user,
      from: lastFrom ?? config.from,
      reply_to: config.replyTo ?? null,
      retries: String(config.retryCount),
      sender_fallback_enabled: "true",
    },
    requestBodyJson: finalRequestBody as Json,
    responseStatus: null,
    responseBody: null,
    errorMessage: `SMTP send failed after ${sendAttempt} attempts: ${lastError ?? "Unknown error"}`,
    createdBy: input.createdBy ?? null,
  });

  return {
    ok: false,
    status: "failed",
    provider: "smtp",
    message: `SMTP send failed: ${lastError ?? "Unknown error"}`,
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

export async function sendPaymentSuccessSmtpEmail(
  supabase: SupabaseClient<Database>,
  input: PaymentSuccessEmailInput
): Promise<DeliveryAttemptResult> {
  return sendSmtpEmail(supabase, {
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
      "id,order_number,product_slug,total_amount,currency,customer_id,lead_id,source,entry_path,consultation_type,session_note,customers(full_name,phone,email)"
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
    await sendPaymentSuccessSmtpEmail(supabase, {
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
