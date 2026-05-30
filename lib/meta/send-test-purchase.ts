import {
  getMetaCapiConfig,
  sendMetaPurchaseEvent,
  type MetaCapiConfig,
  type MetaCapiSendResult,
} from "@/lib/meta/capi";

export interface SendMetaTestPurchaseInput {
  testEventCode?: string;
  orderId?: string;
  valueRupees?: number;
  email?: string;
  phone?: string;
}

export async function sendMetaTestPurchaseEvent(
  input: SendMetaTestPurchaseInput = {}
): Promise<MetaCapiSendResult & { configMissing?: boolean }> {
  const base = getMetaCapiConfig();
  if (!base) {
    return { ok: false, configMissing: true, error: "Meta CAPI not configured" };
  }

  const config: MetaCapiConfig = {
    ...base,
    testEventCode: input.testEventCode?.trim() || base.testEventCode,
  };

  const orderId = input.orderId?.trim() || `admin_test_${Date.now()}`;
  const valueRupees = input.valueRupees ?? 399;

  return sendMetaPurchaseEvent(config, {
    orderId,
    orderNumber: orderId,
    valuePaise: Math.round(valueRupees * 100),
    currency: "INR",
    email: input.email ?? "test@vedguide.com",
    phone: input.phone ?? "9876543210",
    eventSourceUrl: "https://vedguide.com/ads/kundli/new-checkout",
  });
}
