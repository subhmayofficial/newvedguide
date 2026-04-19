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
  updateOrderFulfillmentAssignee,
  updateOrderFulfillmentStatus,
  updateOrderStatus,
} from "@/lib/services/order";
import { createCoupon } from "@/lib/services/coupon";
import {
  createInteraktApiCampaign,
  sendInteraktWhatsApp,
  sendSmtpEmail,
} from "@/lib/services/integration-delivery";
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
import {
  deleteSavedInteraktTemplateById,
  updateSavedInteraktTemplateById,
  upsertSavedInteraktTemplate,
} from "@/lib/services/interakt-template-catalog";
import {
  processPaidKundliReportUpload,
  type PaidKundliReportUploadResult,
} from "@/lib/admin/paid-kundli-report-upload";
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
  provider: "interakt" | "smtp",
  status: string,
  message: string
) {
  const q = new URLSearchParams();
  q.set("provider", provider);
  q.set("test_status", status);
  q.set("test_message", message);
  redirect(`/admindeoghar/integrations?${q.toString()}`);
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
          "smtp",
          "failed",
          `Missing value for template variable {{${key}}}`
        );
      }
    }
    subject = applySmtpTemplateVariables(subject, smtpVars);
    html = applySmtpTemplateVariables(html, smtpVars);
  }

  const result = await sendSmtpEmail(supabase, {
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
  redirectWithIntegrationResult("smtp", result.status, result.message);
}

export async function submitSmtpTemplateCreateForm(formData: FormData) {
  const supabase = createServiceClient();
  const name = toNullable(formData.get("templateName"));
  const subject = toNullable(formData.get("templateSubject")) ?? "";
  const html = toNullable(formData.get("templateHtml")) ?? "";
  const notes = toNullable(formData.get("notes"));

  if (!name) {
    redirectWithIntegrationResult("smtp", "failed", "Template name is required");
  }
  if (!html.trim()) {
    redirectWithIntegrationResult("smtp", "failed", "Template HTML is required");
  }

  await upsertSavedSmtpTemplate(supabase, {
    name: name as string,
    subject,
    html,
    notes,
    isActive: true,
  });

  revalidatePath("/admindeoghar/integrations");
  redirectWithIntegrationResult("smtp", "success", "SMTP template saved");
}

export async function submitSmtpTemplateUpdateForm(formData: FormData) {
  const supabase = createServiceClient();
  const templateId = toNullable(formData.get("templateId"));
  const name = toNullable(formData.get("templateName"));
  const subject = toNullable(formData.get("templateSubject")) ?? "";
  const html = toNullable(formData.get("templateHtml")) ?? "";
  const notes = toNullable(formData.get("notes"));

  if (!templateId || !isTemplateRowId(templateId)) {
    redirectWithIntegrationResult("smtp", "failed", "Invalid template id");
  }
  if (!name) {
    redirectWithIntegrationResult("smtp", "failed", "Template name is required");
  }
  if (!html.trim()) {
    redirectWithIntegrationResult("smtp", "failed", "Template HTML is required");
  }

  await updateSavedSmtpTemplateById(supabase, templateId as string, {
    name: name as string,
    subject,
    html,
    notes,
  });

  revalidatePath("/admindeoghar/integrations");
  redirectWithIntegrationResult("smtp", "success", "SMTP template updated");
}

function redirectWithOrderDeliveryResult(status: "success" | "failed", message: string) {
  const q = new URLSearchParams();
  q.set("delivery_status", status);
  q.set("delivery_msg", message);
  redirect(`/admindeoghar/orders?${q.toString()}`);
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

  const { data: row, error } = await supabase
    .from("orders")
    .select(
      "id,order_number,product_slug,payment_status,customer_id,lead_id,customers(phone,full_name)"
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    redirectWithOrderDeliveryResult("failed", "Order not found");
  }
  if (!row) {
    redirectWithOrderDeliveryResult("failed", "Order not found");
  }

  type OrderRow = {
    id: string;
    order_number: string;
    product_slug: string;
    payment_status: string;
    customer_id: string;
    lead_id: string | null;
    customers: { phone: string | null; full_name: string | null } | null;
  };

  const order = row as unknown as OrderRow;

  if (order.product_slug !== "paid-kundli") {
    redirectWithOrderDeliveryResult(
      "failed",
      "Delivery WhatsApp is only for paid Kundli orders"
    );
  }
  if (order.payment_status !== "paid") {
    redirectWithOrderDeliveryResult("failed", "Order must be paid before sending delivery WhatsApp");
  }

  const phone = order.customers?.phone ?? null;
  const digits = phone?.replace(/\D/g, "") ?? "";
  if (!digits || digits.length < 10 || !phone) {
    redirectWithOrderDeliveryResult("failed", "Customer phone is missing or invalid");
  }

  const settings = await getOrderDeliverySettings(supabase);
  const btnIdx = settings.interakt_button_index.trim() || "0";
  const buttonValues: Record<string, string[]> = { [btnIdx]: [reportUrl] };

  const result = await sendInteraktWhatsApp(supabase, {
    eventName: "order_report_delivery",
    triggerSource: "admin_order_deliver_button",
    orderId: order.id,
    leadId: order.lead_id,
    customerId: order.customer_id,
    fullName: customerName,
    phone,
    templateName: settings.interakt_template_name,
    languageCode: settings.interakt_template_language,
    bodyValues: [customerName],
    buttonValues,
    callbackData: order.order_number,
    metadata: {
      order_number: order.order_number,
      report_url: reportUrl,
    },
    createdBy: await getAdminActor(),
  });

  if (result.ok) {
    await setOrderFulfillment(order.id, FULFILLMENT_STATUS.DELIVERED);
  } else {
    revalidatePath("/admindeoghar/orders");
  }

  redirectWithOrderDeliveryResult(
    result.ok ? "success" : "failed",
    result.message
  );
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
