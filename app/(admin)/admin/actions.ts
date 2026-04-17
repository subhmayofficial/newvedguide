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
import { upsertSavedInteraktTemplate } from "@/lib/services/interakt-template-catalog";
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

  const html = `
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

  const result = await sendSmtpEmail(supabase, {
    eventName: "webhook_test",
    triggerSource: "admin_webhook_test",
    createdBy: await getAdminActor(),
    orderId: toNullable(formData.get("orderId")),
    leadId: toNullable(formData.get("leadId")),
    fullName,
    email,
    subject: `Payment Successful - Your Order is Confirmed (${orderIdLabel})`,
    html,
    payloadExtras: {
      name: fullName,
      order_id: orderIdLabel,
      product,
      amount,
      delivery_text: deliveryText,
      support_link: supportLink,
      note: messageNote,
      test_origin: "admin_panel",
    },
  });

  revalidatePath("/admindeoghar/integrations");
  redirectWithIntegrationResult("smtp", result.status, result.message);
}
