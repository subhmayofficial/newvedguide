"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createClient as createAuthedClient,
  createServiceClient,
} from "@/lib/supabase/server";
import { addEntityNote } from "@/lib/services/notes";
import { updateLeadStatus } from "@/lib/services/lead";
import {
  completePaidKundliDeliveryFromAdminSend,
  updateOrderFulfillmentAssignee,
  updateOrderFulfillmentStatus,
  updateOrderStatus,
} from "@/lib/services/order";
import { createCoupon } from "@/lib/services/coupon";
import {
  createInteraktApiCampaign,
  sendInteraktWhatsApp,
  sendResendEmail,
  triggerKundliDeliveryCompletedEmail,
} from "@/lib/services/integration-delivery";
import { fetchRazorpayOrder, fetchRazorpayOrderPayments } from "@/lib/razorpay";
import { isValidHttpUrl } from "@/lib/services/integration-config";
import {
  getOrderDeliverySettings,
  saveOrderDeliverySettings,
} from "@/lib/admin/order-delivery-settings";
import { saveBunnyCdnSettings } from "@/lib/admin/bunny-cdn-settings";
import {
  upsertSavedSmtpTemplate,
  updateSavedSmtpTemplateById,
} from "@/lib/services/smtp-template-catalog";
import { upsertAdminEmailAutomation } from "@/lib/services/email-automations";
import {
  deleteSavedInteraktTemplateById,
  updateSavedInteraktTemplateById,
  upsertSavedInteraktTemplate,
} from "@/lib/services/interakt-template-catalog";
import {
  processPaidKundliReportUpload,
  type PaidKundliReportUploadResult,
} from "@/lib/admin/paid-kundli-report-upload";
import { executePaidKundliInteraktDelivery } from "@/lib/admin/paid-kundli-interakt-delivery";
import { formatAdminDateTime } from "@/lib/admin/time";
import { markPaymentSuccess } from "@/lib/services/payment";
import {
  applySmtpTemplateVariables,
  collectSmtpTemplateVariableKeys,
  parseSmtpTemplateVarFields,
} from "@/lib/smtp-template-vars";
import {
  ENTITY_NOTE_TYPE,
  FULFILLMENT_STATUS,
  LEAD_STATUS,
  ORDER_FULFILLMENT_ASSIGNEES,
  ORDER_STATUS,
} from "@/lib/constants/commerce";

export async function addLeadNote(leadId: string, note: string) {
  const supabase = createServiceClient();
  await addEntityNote(supabase, {
    entityType: ENTITY_NOTE_TYPE.LEAD,
    entityId: leadId,
    note,
  });
  revalidatePath(`/admindeoghar/leads/${leadId}`);
  revalidatePath("/admindeoghar/leads");
}

export async function submitLeadNoteForm(formData: FormData) {
  const leadId = String(formData.get("leadId") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (!leadId || !note) return;
  await addLeadNote(leadId, note);
}

export async function submitLeadLostForm(formData: FormData) {
  const leadId = String(formData.get("leadId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!leadId || !reason) return;
  await markLeadLost(leadId, reason);
}

async function markLeadLost(leadId: string, reason: string) {
  const supabase = createServiceClient();
  await updateLeadStatus(supabase, {
    leadId,
    status: LEAD_STATUS.LOST,
    lostReason: reason,
  });
  revalidatePath(`/admindeoghar/leads/${leadId}`);
  revalidatePath("/admindeoghar/leads");
}

export async function addOrderNote(orderId: string, note: string) {
  const supabase = createServiceClient();
  await addEntityNote(supabase, {
    entityType: ENTITY_NOTE_TYPE.ORDER,
    entityId: orderId,
    note,
  });
  revalidatePath(`/admindeoghar/orders/${orderId}`);
  revalidatePath("/admindeoghar/orders");
}

export async function submitOrderNoteForm(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (!orderId || !note) return;
  await addOrderNote(orderId, note);
}

export async function setOrderFulfillment(
  orderId: string,
  fulfillmentStatus: string
) {
  const supabase = createServiceClient();
  await updateOrderFulfillmentStatus(supabase, orderId, fulfillmentStatus);
  if (fulfillmentStatus === FULFILLMENT_STATUS.DELIVERED) {
    await updateOrderStatus(supabase, orderId, {
      status: ORDER_STATUS.FULFILLED,
    });
    await supabase
      .from("orders")
      .update({
        delivery_scheduled_at: null,
        delivery_schedule_customer_name: null,
        delivery_schedule_report_url: null,
      })
      .eq("id", orderId);
  } else if (fulfillmentStatus === FULFILLMENT_STATUS.IN_PROGRESS) {
    await updateOrderStatus(supabase, orderId, {
      status: ORDER_STATUS.PROCESSING,
    });
  }
  revalidatePath(`/admindeoghar/orders/${orderId}`);
  revalidatePath("/admindeoghar/orders");
}

export async function setOrderProcessing(orderId: string) {
  const supabase = createServiceClient();
  await updateOrderStatus(supabase, orderId, {
    status: ORDER_STATUS.PROCESSING,
  });
  revalidatePath(`/admindeoghar/orders/${orderId}`);
  revalidatePath("/admindeoghar/orders");
}

export async function submitOrderProcessingForm(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "");
  if (!orderId) return;
  await setOrderProcessing(orderId);
}

export async function submitOrderFulfillmentForm(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "");
  const status = String(formData.get("fulfillment") ?? "");
  if (!orderId || !status) return;
  await setOrderFulfillment(orderId, status);
}

export async function submitCouponCreateForm(formData: FormData) {
  const supabase = createServiceClient();
  const code = String(formData.get("code") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const discountType = String(formData.get("discountType") ?? "fixed");
  const discountValue = Number(formData.get("discountValue") ?? 0);
  const minOrderAmount = Number(formData.get("minOrderAmount") ?? 0);
  const maxDiscountAmountRaw = String(formData.get("maxDiscountAmount") ?? "").trim();
  const usageLimitRaw = String(formData.get("usageLimit") ?? "").trim();
  const appliesToProductSlug = String(formData.get("appliesToProductSlug") ?? "").trim();
  const validFrom = String(formData.get("validFrom") ?? "").trim();
  const validUntil = String(formData.get("validUntil") ?? "").trim();
  const isActive = String(formData.get("isActive") ?? "off") === "on";

  if (!code || !discountValue || discountValue <= 0) return;
  if (discountType !== "fixed" && discountType !== "percentage") return;

  await createCoupon(supabase, {
    code,
    description: description || null,
    discountType,
    discountValue,
    minOrderAmount,
    maxDiscountAmount: maxDiscountAmountRaw ? Number(maxDiscountAmountRaw) : null,
    usageLimit: usageLimitRaw ? Number(usageLimitRaw) : null,
    appliesToProductSlug: appliesToProductSlug || null,
    validFrom: validFrom || null,
    validUntil: validUntil || null,
    isActive,
  });

  revalidatePath("/admindeoghar/coupons");
}

const ALLOWED_FULFILLMENT = new Set<string>(Object.values(FULFILLMENT_STATUS));
const ALLOWED_ASSIGNEES = new Set<string>(ORDER_FULFILLMENT_ASSIGNEES);

export async function updateOrderFulfillmentFromList(
  orderId: string,
  fulfillmentStatus: string
) {
  if (!orderId || !ALLOWED_FULFILLMENT.has(fulfillmentStatus)) return;
  await setOrderFulfillment(orderId, fulfillmentStatus);
}

export async function updateOrderAssigneeFromList(orderId: string, assignee: string) {
  if (!orderId) return;
  const trimmed = assignee.trim();
  const value =
    trimmed === "" ? null : ALLOWED_ASSIGNEES.has(trimmed) ? trimmed : null;
  if (trimmed !== "" && value === null) return;
  const supabase = createServiceClient();
  await updateOrderFulfillmentAssignee(supabase, orderId, value);
  revalidatePath("/admindeoghar/orders");
  revalidatePath(`/admindeoghar/orders/${orderId}`);
}

async function getAdminActor(): Promise<string | null> {
  try {
    const authClient = await createAuthedClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();
    if (!user) return null;
    return user.email ?? user.id;
  } catch {
    return null;
  }
}

function toNullable(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? "").trim();
  return text ? text : null;
}

function redirectWithIntegrationResult(
  provider: "interakt" | "resend",
  status: string,
  message: string
) {
  const q = new URLSearchParams();
  q.set("provider", provider);
  q.set("test_status", status);
  q.set("test_message", message);
  redirect(`/admindeoghar/integrations?${q.toString()}`);
}

function redirectWithAutomationResult(status: string, message: string): never {
  const q = new URLSearchParams();
  q.set("automation_status", status);
  q.set("automation_message", message);
  redirect(`/admindeoghar/automations?${q.toString()}`);
}

export async function submitInteraktWebhookTestForm(formData: FormData) {
  const supabase = createServiceClient();
  const bodyValuesRaw = toNullable(formData.get("bodyValues"));
  const bodyValues = bodyValuesRaw
    ? bodyValuesRaw
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean)
    : undefined;

  const result = await sendInteraktWhatsApp(supabase, {
    eventName: "webhook_test",
    triggerSource: "admin_webhook_test",
    createdBy: await getAdminActor(),
    orderId: toNullable(formData.get("orderId")),
    leadId: toNullable(formData.get("leadId")),
    fullName: toNullable(formData.get("fullName")),
    phone: toNullable(formData.get("phone")),
    templateName: toNullable(formData.get("templateName")),
    bodyValues,
    metadata: {
      test_origin: "admin_panel",
    },
  });

  revalidatePath("/admindeoghar/integrations");
  redirectWithIntegrationResult("interakt", result.status, result.message);
}

function parseStringList(formData: FormData, key: string): string[] {
  return formData
    .getAll(key)
    .map((value) => String(value).trim())
    .filter(Boolean);
}

function parseGroupedValueMap(
  formData: FormData,
  indexKey: string,
  valuesKey: string
): Record<string, string[]> {
  const indices = formData.getAll(indexKey).map((value) => String(value).trim());
  const values = formData.getAll(valuesKey).map((value) => String(value).trim());
  const out: Record<string, string[]> = {};

  for (let idx = 0; idx < indices.length; idx += 1) {
    const index = indices[idx];
    const raw = values[idx] ?? "";
    if (!index || !raw) continue;
    const parsed = raw
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    if (!parsed.length) continue;
    out[index] = parsed;
  }

  return out;
}

function parseOptionalJsonObject(value: string | null): Record<string, unknown> | undefined {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

export async function submitInteraktAdvancedTemplateForm(formData: FormData) {
  const supabase = createServiceClient();
  const headerValues = parseStringList(formData, "headerValues");
  const bodyValues = parseStringList(formData, "bodyValues");
  const buttonValues = parseGroupedValueMap(formData, "buttonValueIndex", "buttonValueItems");
  const buttonPayload = parseGroupedValueMap(
    formData,
    "buttonPayloadIndex",
    "buttonPayloadItems"
  );

  const metadataRaw = toNullable(formData.get("metadataJson"));
  const metadata = parseOptionalJsonObject(metadataRaw);
  const result = await sendInteraktWhatsApp(supabase, {
    eventName: "webhook_test",
    triggerSource: "admin_interakt_advanced_test",
    createdBy: await getAdminActor(),
    orderId: toNullable(formData.get("orderId")),
    leadId: toNullable(formData.get("leadId")),
    fullName: toNullable(formData.get("fullName")),
    phone: toNullable(formData.get("phone")),
    templateName: toNullable(formData.get("templateName")),
    languageCode: toNullable(formData.get("languageCode")),
    callbackData: toNullable(formData.get("callbackData")),
    campaignId: toNullable(formData.get("campaignId")),
    fileName: toNullable(formData.get("fileName")),
    headerValues: headerValues.length ? headerValues : undefined,
    bodyValues: bodyValues.length ? bodyValues : undefined,
    buttonValues: Object.keys(buttonValues).length ? buttonValues : undefined,
    buttonPayload: Object.keys(buttonPayload).length ? buttonPayload : undefined,
    metadata: {
      test_origin: "admin_panel",
      ...(metadata ?? {}),
    },
  });

  revalidatePath("/admindeoghar/integrations");
  redirectWithIntegrationResult("interakt", result.status, result.message);
}

export async function submitInteraktCreateCampaignForm(formData: FormData) {
  const supabase = createServiceClient();
  const campaignName = toNullable(formData.get("campaignName"));
  const templateName = toNullable(formData.get("templateName"));
  const languageCode = toNullable(formData.get("languageCode")) ?? "en";

  if (!campaignName || !templateName) {
    return redirectWithIntegrationResult(
      "interakt",
      "failed",
      "Campaign name and template name are required"
    );
  }

  const result = await createInteraktApiCampaign(supabase, {
    campaignName,
    templateName,
    languageCode,
    createdBy: await getAdminActor(),
  });

  revalidatePath("/admindeoghar/integrations");
  redirectWithIntegrationResult(
    "interakt",
    result.ok ? "success" : "failed",
    result.message
  );
}

function parseCsvLabels(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseButtonLabelLines(
  value: string | null
): Array<{ buttonIndex: string; label: string }> {
  if (!value) return [];
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      const separatorIndex = line.indexOf(":");
      if (separatorIndex < 0) return [];
      const buttonIndex = line.slice(0, separatorIndex).trim();
      const labels = line
        .slice(separatorIndex + 1)
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);
      return labels.map((label) => ({ buttonIndex, label }));
    });
}

function parseIndexedValuePairs(
  formData: FormData,
  indexKey: string,
  valueKey: string
): Record<string, string[]> {
  const indices = formData.getAll(indexKey).map((value) => String(value).trim());
  const values = formData.getAll(valueKey).map((value) => String(value).trim());
  const out: Record<string, string[]> = {};

  for (let idx = 0; idx < indices.length; idx += 1) {
    const buttonIndex = indices[idx];
    const value = values[idx];
    if (!buttonIndex || !value) continue;
    if (!out[buttonIndex]) out[buttonIndex] = [];
    out[buttonIndex].push(value);
  }

  return out;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isTemplateRowId(value: string | null): value is string {
  return Boolean(value && UUID_RE.test(value));
}

export async function submitInteraktTemplateCatalogForm(formData: FormData) {
  const supabase = createServiceClient();
  const name = toNullable(formData.get("templateName"));
  const languageCode = toNullable(formData.get("languageCode")) ?? "en";

  if (!name) {
    return redirectWithIntegrationResult("interakt", "failed", "Template name is required");
  }

  await upsertSavedInteraktTemplate(supabase, {
    name,
    languageCode,
    headerLabels: parseCsvLabels(toNullable(formData.get("headerLabels"))),
    bodyLabels: parseCsvLabels(toNullable(formData.get("bodyLabels"))),
    buttonValueLabels: parseButtonLabelLines(toNullable(formData.get("buttonValueLabels"))),
    buttonPayloadLabels: parseButtonLabelLines(
      toNullable(formData.get("buttonPayloadLabels"))
    ),
    fileNameRequired: String(formData.get("fileNameRequired") ?? "") === "on",
    notes: toNullable(formData.get("notes")),
    source: "manual",
    isActive: true,
  });

  revalidatePath("/admindeoghar/integrations");
  redirectWithIntegrationResult("interakt", "success", `${name} saved`);
}

export async function submitInteraktTemplateUpdateForm(formData: FormData) {
  const supabase = createServiceClient();
  const id = toNullable(formData.get("templateId"));
  if (!isTemplateRowId(id)) {
    return redirectWithIntegrationResult("interakt", "failed", "Invalid or missing template id");
  }

  const name = toNullable(formData.get("templateName"));
  const languageCode = toNullable(formData.get("languageCode")) ?? "en";

  if (!name) {
    return redirectWithIntegrationResult("interakt", "failed", "Template name is required");
  }

  try {
    await updateSavedInteraktTemplateById(supabase, id, {
      name,
      languageCode,
      headerLabels: parseCsvLabels(toNullable(formData.get("headerLabels"))),
      bodyLabels: parseCsvLabels(toNullable(formData.get("bodyLabels"))),
      buttonValueLabels: parseButtonLabelLines(toNullable(formData.get("buttonValueLabels"))),
      buttonPayloadLabels: parseButtonLabelLines(
        toNullable(formData.get("buttonPayloadLabels"))
      ),
      fileNameRequired: String(formData.get("fileNameRequired") ?? "") === "on",
      notes: toNullable(formData.get("notes")),
      source: "manual",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    revalidatePath("/admindeoghar/integrations");
    return redirectWithIntegrationResult("interakt", "failed", msg);
  }

  revalidatePath("/admindeoghar/integrations");
  redirectWithIntegrationResult("interakt", "success", `${name} updated`);
}

export async function submitInteraktTemplateDeleteForm(formData: FormData) {
  const supabase = createServiceClient();
  const id = toNullable(formData.get("templateId"));
  if (!isTemplateRowId(id)) {
    return redirectWithIntegrationResult("interakt", "failed", "Invalid or missing template id");
  }

  try {
    await deleteSavedInteraktTemplateById(supabase, id);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    revalidatePath("/admindeoghar/integrations");
    return redirectWithIntegrationResult("interakt", "failed", msg);
  }

  revalidatePath("/admindeoghar/integrations");
  redirectWithIntegrationResult("interakt", "success", "Template deleted");
}

export async function submitInteraktSavedTemplateSendForm(formData: FormData) {
  const supabase = createServiceClient();
  const templateName = toNullable(formData.get("templateName"));
  const languageCode = toNullable(formData.get("languageCode"));

  if (!templateName) {
    return redirectWithIntegrationResult("interakt", "failed", "Select a saved template");
  }

  const result = await sendInteraktWhatsApp(supabase, {
    eventName: "saved_template_send",
    triggerSource: "admin_interakt_saved_template_send",
    createdBy: await getAdminActor(),
    orderId: toNullable(formData.get("orderId")),
    leadId: toNullable(formData.get("leadId")),
    fullName: toNullable(formData.get("fullName")),
    phone: toNullable(formData.get("phone")),
    templateName,
    languageCode,
    callbackData: toNullable(formData.get("callbackData")),
    campaignId: toNullable(formData.get("campaignId")),
    fileName: toNullable(formData.get("fileName")),
    headerValues: formData.getAll("headerValues").map((value) => String(value).trim()).filter(Boolean),
    bodyValues: formData.getAll("bodyValues").map((value) => String(value).trim()).filter(Boolean),
    buttonValues: parseIndexedValuePairs(formData, "buttonValueIndex", "buttonValueValue"),
    buttonPayload: parseIndexedValuePairs(
      formData,
      "buttonPayloadIndex",
      "buttonPayloadValue"
    ),
    metadata: {
      test_origin: "admin_saved_template_send",
      ...(parseOptionalJsonObject(toNullable(formData.get("metadataJson"))) ?? {}),
    },
  });

  revalidatePath("/admindeoghar/integrations");
  redirectWithIntegrationResult("interakt", result.status, result.message);
}

export async function submitSmtpEmailTestForm(formData: FormData) {
  const supabase = createServiceClient();
  const fullName = toNullable(formData.get("fullName"));
  const email = toNullable(formData.get("email"));
  const messageNote = toNullable(formData.get("message"));
  const orderIdLabel = toNullable(formData.get("orderIdLabel")) ?? "VG-TEST-EMAIL";
  const product = toNullable(formData.get("product")) ?? "Paid Kundli Report";
  const amount = toNullable(formData.get("amount")) ?? "399";
  const deliveryText =
    toNullable(formData.get("deliveryText")) ??
    "Your report delivery is in process. Typical timeline is 24-48 hours.";
  const supportLink =
    toNullable(formData.get("supportLink")) ?? "https://wa.me/919999999999";

  const customHtml = toNullable(formData.get("customHtml"));
  const smtpTemplateId = toNullable(formData.get("smtpTemplateId"));

  const defaultHtml = `
<h2>Hey ${fullName ?? "Customer"},</h2>
<p>Payment successful! Your order is confirmed.</p>

<h3>Order Details:</h3>
<ul>
<li>Order ID: ${orderIdLabel}</li>
<li>Product: ${product}</li>
<li>Amount: Rs ${amount}</li>
</ul>

<p>${deliveryText}</p>

<p>Support: <a href="${supportLink}">Click here</a></p>
`.trim();

  let resolvedTemplateHtml: string | null = null;
  let resolvedTemplateSubject: string | null = null;
  if (smtpTemplateId && isTemplateRowId(smtpTemplateId)) {
    const { data: tpl } = await supabase
      .from("admin_smtp_templates")
      .select("subject,html")
      .eq("id", smtpTemplateId)
      .maybeSingle();
    if (tpl) {
      resolvedTemplateHtml = tpl.html ?? null;
      resolvedTemplateSubject = tpl.subject ?? null;
    }
  }

  let html = (customHtml ?? resolvedTemplateHtml ?? defaultHtml).trim();
  let subject =
    (resolvedTemplateSubject ?? "").trim() ||
    `Payment Successful - Your Order is Confirmed (${orderIdLabel})`;

  const templateVarKeys = collectSmtpTemplateVariableKeys(subject, html);
  const smtpVars = parseSmtpTemplateVarFields(formData);

  if (templateVarKeys.length > 0) {
    for (const key of templateVarKeys) {
      const v = smtpVars[key];
      if (!v?.trim()) {
        redirectWithIntegrationResult(
          "resend",
          "failed",
          `Missing value for template variable {{${key}}}`
        );
      }
    }
    subject = applySmtpTemplateVariables(subject, smtpVars);
    html = applySmtpTemplateVariables(html, smtpVars);
  }

  const result = await sendResendEmail(supabase, {
    eventName: "webhook_test",
    triggerSource: "admin_webhook_test",
    createdBy: await getAdminActor(),
    orderId: toNullable(formData.get("orderId")),
    leadId: toNullable(formData.get("leadId")),
    fullName,
    email,
    subject,
    html,
    payloadExtras: {
      ...(templateVarKeys.length > 0
        ? {
            smtp_template_vars: smtpVars,
            smtp_template_var_keys: templateVarKeys,
          }
        : {
            name: fullName,
            order_id: orderIdLabel,
            product,
            amount,
            delivery_text: deliveryText,
            support_link: supportLink,
          }),
      note: messageNote,
      test_origin: "admin_panel",
    },
  });

  revalidatePath("/admindeoghar/integrations");
  redirectWithIntegrationResult("resend", result.status, result.message);
}

export async function submitSmtpTemplateCreateForm(formData: FormData) {
  const supabase = createServiceClient();
  const name = toNullable(formData.get("templateName"));
  const subject = toNullable(formData.get("templateSubject")) ?? "";
  const html = toNullable(formData.get("templateHtml")) ?? "";
  const notes = toNullable(formData.get("notes"));

  if (!name) {
    redirectWithIntegrationResult("resend", "failed", "Template name is required");
  }
  if (!html.trim()) {
    redirectWithIntegrationResult("resend", "failed", "Template HTML is required");
  }

  await upsertSavedSmtpTemplate(supabase, {
    name: name as string,
    subject,
    html,
    notes,
    isActive: true,
  });

  revalidatePath("/admindeoghar/integrations");
  redirectWithIntegrationResult("resend", "success", "Email template saved");
}

export async function submitSmtpTemplateUpdateForm(formData: FormData) {
  const supabase = createServiceClient();
  const templateId = toNullable(formData.get("templateId"));
  const name = toNullable(formData.get("templateName"));
  const subject = toNullable(formData.get("templateSubject")) ?? "";
  const html = toNullable(formData.get("templateHtml")) ?? "";
  const notes = toNullable(formData.get("notes"));

  if (!templateId || !isTemplateRowId(templateId)) {
    redirectWithIntegrationResult("resend", "failed", "Invalid template id");
  }
  if (!name) {
    redirectWithIntegrationResult("resend", "failed", "Template name is required");
  }
  if (!html.trim()) {
    redirectWithIntegrationResult("resend", "failed", "Template HTML is required");
  }

  await updateSavedSmtpTemplateById(supabase, templateId as string, {
    name: name as string,
    subject,
    html,
    notes,
  });

  revalidatePath("/admindeoghar/integrations");
  redirectWithIntegrationResult("resend", "success", "Email template updated");
}

export async function submitEmailAutomationUpdateForm(formData: FormData) {
  const supabase = createServiceClient();
  const automationKey = toNullable(formData.get("automationKey"));
  const label = toNullable(formData.get("label"));
  const description = toNullable(formData.get("description"));
  const templateName = toNullable(formData.get("templateName"));
  const isEnabled = String(formData.get("isEnabled") ?? "") === "on";

  if (!automationKey || !label || !templateName) {
    redirectWithAutomationResult("failed", "Automation key, label and template name are required");
  }

  try {
    await upsertAdminEmailAutomation(supabase, {
      automationKey: automationKey as string,
      label: label as string,
      description,
      templateName: templateName as string,
      isEnabled,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to update automation";
    redirectWithAutomationResult("failed", msg.slice(0, 220));
  }

  revalidatePath("/admindeoghar/automations");
  redirectWithAutomationResult("success", "Automation updated");
}

export async function submitEmailAutomationTestForm(formData: FormData) {
  const supabase = createServiceClient();
  const automationKey = toNullable(formData.get("automationKey"));
  const testEmail = toNullable(formData.get("testEmail"));

  if (!automationKey || !testEmail || !testEmail.includes("@")) {
    redirectWithAutomationResult("failed", "Valid test email and automation key are required");
  }

  const { data: automation } = await supabase
    .from("admin_email_automations")
    .select("automation_key,template_name,is_enabled")
    .eq("automation_key", automationKey as string)
    .maybeSingle();

  if (!automation) {
    redirectWithAutomationResult("failed", "Automation not found");
  }

  const templateName = automation.template_name?.trim() || "";
  if (!templateName) {
    redirectWithAutomationResult("failed", "No template configured for this automation");
  }

  const { data: template } = await supabase
    .from("admin_smtp_templates")
    .select("subject,html")
    .eq("name", templateName)
    .eq("is_active", true)
    .maybeSingle();

  if (!template?.html) {
    redirectWithAutomationResult("failed", `Template "${templateName}" not found in saved templates`);
  }

  const vars: Record<string, string> = {
    name: "Test User",
    full_name: "Test User",
    email: testEmail as string,
    phone: "9999999999",
    order_id: "VG-TEST-AUTO-001",
    order_number: "VG-TEST-AUTO-001",
    product: "Paid Kundli Report",
    amount: "399",
    support_link: "https://wa.me/919999999999",
    delivery_text: "This is an automation test email.",
  };
  const needed = collectSmtpTemplateVariableKeys(template.subject ?? "", template.html ?? "");
  for (const key of needed) {
    if (!(key in vars)) {
      vars[key] = `test_${key}`;
    }
  }

  const subject =
    applySmtpTemplateVariables(template.subject || "Automation test email", vars).trim() ||
    "Automation test email";
  const html = applySmtpTemplateVariables(template.html, vars);

  const result = await sendResendEmail(supabase, {
    eventName: "automation_manual_test",
    triggerSource: `automation_manual_test_${automation.automation_key}`,
    createdBy: await getAdminActor(),
    email: testEmail,
    subject,
    html,
    payloadExtras: {
      automation_key: automation.automation_key,
      template_name: templateName,
      is_enabled: automation.is_enabled,
      test_vars: vars,
    },
  });

  revalidatePath("/admindeoghar/automations");
  redirectWithAutomationResult(result.ok ? "success" : "failed", result.message);
}

function redirectWithOrderDeliveryResult(status: "success" | "failed", message: string): never {
  const q = new URLSearchParams();
  q.set("delivery_status", status);
  q.set("delivery_msg", message);
  redirect(`/admindeoghar/orders?${q.toString()}`);
}

function redirectWithOrderPaymentResult(
  status: "success" | "failed",
  message: string,
  returnTo: "orders" | "order_detail",
  orderId?: string
): never {
  const q = new URLSearchParams();
  q.set("payment_reconcile_status", status);
  q.set("payment_reconcile_msg", message);
  if (returnTo === "order_detail" && orderId) {
    redirect(`/admindeoghar/orders/${orderId}?${q.toString()}`);
  }
  redirect(`/admindeoghar/orders?${q.toString()}`);
}

export async function submitOrderPaymentReconcileForm(formData: FormData) {
  const supabase = createServiceClient();
  const orderIdRaw = toNullable(formData.get("orderId"));
  const returnToRaw = toNullable(formData.get("returnTo"));
  const returnTo: "orders" | "order_detail" =
    returnToRaw === "order_detail" ? "order_detail" : "orders";

  if (!isTemplateRowId(orderIdRaw)) {
    redirectWithOrderPaymentResult("failed", "Invalid order id", returnTo);
  }
  const orderId = orderIdRaw as string;

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select("id,order_number,payment_status")
    .eq("id", orderId)
    .maybeSingle();

  if (orderErr || !order) {
    redirectWithOrderPaymentResult("failed", "Order not found", returnTo, orderId);
  }

  const { data: payment, error: payErr } = await supabase
    .from("payments")
    .select("id,status,provider_order_id,provider_payment_id")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (payErr || !payment) {
    redirectWithOrderPaymentResult("failed", "Payment row not found", returnTo, orderId);
  }

  if (payment.status === "paid" && payment.provider_payment_id) {
    redirectWithOrderPaymentResult(
      "success",
      "Already marked paid. No changes needed.",
      returnTo,
      orderId
    );
  }

  if (!payment.provider_order_id) {
    redirectWithOrderPaymentResult(
      "failed",
      "No Razorpay order id found on payment row.",
      returnTo,
      orderId
    );
  }

  try {
    const [gatewayOrder, orderPayments] = await Promise.all([
      fetchRazorpayOrder(payment.provider_order_id),
      fetchRazorpayOrderPayments(payment.provider_order_id),
    ]);
    const successfulPayment = orderPayments.find((p) =>
      p.status === "captured" || p.status === "authorized"
    );
    const isGatewayPaid = gatewayOrder.status === "paid" || gatewayOrder.amount_paid > 0;

    if (!successfulPayment && !isGatewayPaid) {
      redirectWithOrderPaymentResult(
        "failed",
        `Gateway shows unpaid (${gatewayOrder.status}). No DB update done.`,
        returnTo,
        orderId
      );
    }

    await markPaymentSuccess(supabase, {
      orderId,
      paymentId: payment.id,
      providerPaymentId:
        successfulPayment?.id ??
        payment.provider_payment_id ??
        `reconciled_${payment.provider_order_id}`,
      providerSignature: "admin_reconcile",
      rawResponse: {
        source: "admin_reconcile_action",
        gateway_order_id: payment.provider_order_id,
        gateway_order_status: gatewayOrder.status,
        gateway_amount_paid: gatewayOrder.amount_paid,
        gateway_payment_id: successfulPayment?.id ?? null,
      },
    });

    revalidatePath("/admindeoghar/orders");
    revalidatePath(`/admindeoghar/orders/${orderId}`);
    redirectWithOrderPaymentResult(
      "success",
      `Payment reconciled for ${order.order_number}.`,
      returnTo,
      orderId
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message.slice(0, 220) : "Reconcile failed";
    redirectWithOrderPaymentResult("failed", msg, returnTo, orderId);
  }
}

export async function submitOrderInteraktDeliveryForm(formData: FormData) {
  const supabase = createServiceClient();
  const orderIdRaw = toNullable(formData.get("orderId"));
  if (!isTemplateRowId(orderIdRaw)) {
    redirectWithOrderDeliveryResult("failed", "Invalid order id");
  }
  const orderId = orderIdRaw as string;

  const customerNameRaw = toNullable(formData.get("customerName"));
  const trimmedCustomerName = customerNameRaw?.trim() ?? "";
  if (!trimmedCustomerName) {
    redirectWithOrderDeliveryResult("failed", "Customer name is required");
  }
  const customerName = trimmedCustomerName;

  const reportUrlRaw = toNullable(formData.get("reportUrl"));
  if (!reportUrlRaw || !isValidHttpUrl(reportUrlRaw)) {
    redirectWithOrderDeliveryResult("failed", "Report URL must be a valid http(s) link");
  }
  const reportUrl = reportUrlRaw as string;

  const sendTiming = toNullable(formData.get("sendTiming")) ?? "now";

  if (sendTiming === "scheduled") {
    const scheduledAtRaw = toNullable(formData.get("scheduledAt"))?.trim() ?? "";
    if (!scheduledAtRaw) {
      redirectWithOrderDeliveryResult("failed", "Choose a date and time for scheduled delivery");
    }
    const at = new Date(scheduledAtRaw);
    if (Number.isNaN(at.getTime())) {
      redirectWithOrderDeliveryResult("failed", "Invalid schedule date/time");
    }
    if (at.getTime() < Date.now() + 60_000) {
      redirectWithOrderDeliveryResult(
        "failed",
        "Schedule time must be at least 1 minute from now"
      );
    }

    const { data: orderCheck, error: checkErr } = await supabase
      .from("orders")
      .select("id,product_slug,payment_status,fulfillment_status")
      .eq("id", orderId)
      .maybeSingle();

    if (checkErr || !orderCheck) {
      redirectWithOrderDeliveryResult("failed", "Order not found");
    }
    if (orderCheck.product_slug !== "paid-kundli") {
      redirectWithOrderDeliveryResult(
        "failed",
        "Delivery scheduling is only for paid Kundli orders"
      );
    }
    if (orderCheck.payment_status !== "paid") {
      redirectWithOrderDeliveryResult("failed", "Order must be paid before scheduling delivery");
    }
    if (orderCheck.fulfillment_status === FULFILLMENT_STATUS.DELIVERED) {
      redirectWithOrderDeliveryResult("failed", "Order is already delivered");
    }

    const { error: upErr } = await supabase
      .from("orders")
      .update({
        delivery_scheduled_at: at.toISOString(),
        delivery_schedule_customer_name: customerName,
        delivery_schedule_report_url: reportUrl,
      })
      .eq("id", orderId);

    if (upErr) {
      redirectWithOrderDeliveryResult("failed", upErr.message.slice(0, 220));
    }

    revalidatePath("/admindeoghar/orders");
    revalidatePath(`/admindeoghar/orders/${orderId}`);
    redirectWithOrderDeliveryResult(
      "success",
      `WhatsApp delivery scheduled for ${formatAdminDateTime(at.toISOString())}`
    );
  }

  const result = await executePaidKundliInteraktDelivery(supabase, {
    orderId,
    customerName,
    reportUrl,
    createdBy: await getAdminActor(),
  });

  if (result.ok) {
    await completePaidKundliDeliveryFromAdminSend(supabase, orderId);
    await triggerKundliDeliveryCompletedEmail(supabase, {
      orderId,
      customerName,
      reportUrl,
      createdBy: await getAdminActor(),
      triggerSource: "automation_kundli_delivery_completed_admin",
    });
    revalidatePath(`/admindeoghar/orders/${orderId}`);
    revalidatePath("/admindeoghar/orders");
  } else {
    revalidatePath("/admindeoghar/orders");
  }

  redirectWithOrderDeliveryResult(
    result.ok ? "success" : "failed",
    result.message
  );
}

export async function clearOrderDeliveryScheduleForm(formData: FormData) {
  const supabase = createServiceClient();
  const orderIdRaw = toNullable(formData.get("orderId"));
  if (!isTemplateRowId(orderIdRaw)) {
    redirectWithOrderDeliveryResult("failed", "Invalid order id");
  }
  const orderId = orderIdRaw as string;

  const { error } = await supabase
    .from("orders")
    .update({
      delivery_scheduled_at: null,
      delivery_schedule_customer_name: null,
      delivery_schedule_report_url: null,
    })
    .eq("id", orderId);

  if (error) {
    redirectWithOrderDeliveryResult("failed", error.message.slice(0, 220));
  }

  revalidatePath("/admindeoghar/orders");
  revalidatePath(`/admindeoghar/orders/${orderId}`);
  redirectWithOrderDeliveryResult("success", "Scheduled delivery cleared");
}

export async function submitOrderDeliverySettingsForm(formData: FormData) {
  const supabase = createServiceClient();
  const interakt_template_name = toNullable(formData.get("interakt_template_name"));
  const interakt_template_language =
    toNullable(formData.get("interakt_template_language")) ?? "hi";
  const interakt_button_index = toNullable(formData.get("interakt_button_index")) ?? "0";

  if (!interakt_template_name) {
    redirect("/admindeoghar/settings?settings_err=template_name_required");
  }

  try {
    await saveOrderDeliverySettings(supabase, {
      interakt_template_name,
      interakt_template_language,
      interakt_button_index,
    });
  } catch (e) {
    const msg = e instanceof Error ? encodeURIComponent(e.message.slice(0, 400)) : "save_failed";
    redirect(`/admindeoghar/settings?settings_err=${msg}`);
  }

  revalidatePath("/admindeoghar/settings");
  revalidatePath("/admindeoghar/orders");
  redirect("/admindeoghar/settings?settings_saved=1");
}

export async function submitBunnyCdnSettingsForm(formData: FormData) {
  const supabase = createServiceClient();
  const storage_zone_name = toNullable(formData.get("storage_zone_name")) ?? "";
  const storage_region = toNullable(formData.get("storage_region")) ?? "";
  const cdnRaw = (toNullable(formData.get("cdn_public_base_url")) ?? "")
    .trim()
    .replace(/\/+$/, "");

  if (cdnRaw && !isValidHttpUrl(cdnRaw)) {
    redirect("/admindeoghar/settings?bunny_err=invalid_cdn_url");
  }

  try {
    await saveBunnyCdnSettings(supabase, {
      storage_zone_name,
      storage_region,
      cdn_public_base_url: cdnRaw,
    });
  } catch (e) {
    const msg =
      e instanceof Error ? encodeURIComponent(e.message.slice(0, 400)) : "save_failed";
    redirect(`/admindeoghar/settings?bunny_err=${msg}`);
  }

  revalidatePath("/admindeoghar/settings");
  redirect("/admindeoghar/settings?bunny_saved=1");
}

export type UploadPaidKundliReportResult = PaidKundliReportUploadResult;

/** Prefer POST `/api/admin/orders/[orderId]/kundli-report-upload` for large files (no Server Action body cap). */
export async function uploadPaidKundliReportAction(
  formData: FormData
): Promise<UploadPaidKundliReportResult> {
  try {
    const actor = await getAdminActor();
    if (!actor) {
      return { ok: false, error: "Not signed in" };
    }

    const orderId = toNullable(formData.get("orderId"));
    if (!isTemplateRowId(orderId)) {
      return { ok: false, error: "Invalid order" };
    }
    const id = orderId as string;

    const rawFile = formData.get("file");
    if (!rawFile || typeof rawFile === "string") {
      return { ok: false, error: "Choose a file to upload" };
    }
    const file = rawFile as File;

    const supabase = createServiceClient();
    return await processPaidKundliReportUpload(supabase, id, file);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      error:
        msg && msg !== "[object Object]"
          ? msg.slice(0, 500)
          : "Unexpected error while uploading (check server logs)",
    };
  }
}
