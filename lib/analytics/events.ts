"use client";

import { getOrCreateSessionId } from "@/lib/analytics/session";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gtag?: (...args: any[]) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dataLayer?: any[];
  }
}

function ga(event: string, params: Record<string, unknown>) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", event, params);
  }
}

function ph(event: string, props?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  import("posthog-js").then(({ default: posthog }) => {
    posthog.capture(event, props);
  });
}

function internalEvent(
  eventName: string,
  fields: {
    eventGroup?: string;
    pagePath?: string;
    sourcePage?: string;
    entryPath?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    referrer?: string;
    metadata?: Record<string, unknown>;
  } = {}
) {
  if (typeof window === "undefined") return;
  const sessionId = getOrCreateSessionId();
  fetch("/api/events/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventName,
      sessionId,
      pagePath: fields.pagePath ?? window.location.pathname,
      sourcePage: fields.sourcePage,
      entryPath: fields.entryPath,
      utmSource: fields.utmSource,
      utmMedium: fields.utmMedium,
      utmCampaign: fields.utmCampaign,
      referrer: fields.referrer ?? document.referrer,
      eventGroup: fields.eventGroup,
      metadata: fields.metadata ?? null,
    }),
  }).catch(() => {});
}

export const track = {
  toolPageViewed(toolSlug: string, attrs?: Record<string, string>) {
    ph("tool_page_viewed", { tool_slug: toolSlug, ...attrs });
  },
  toolFormStarted(toolSlug: string) {
    ph("tool_form_started", { tool_slug: toolSlug });
  },
  toolFormCompleted(toolSlug: string) {
    ph("tool_form_completed", { tool_slug: toolSlug });
    ga("tool_completed", { tool_slug: toolSlug });
  },
  toolResultKundliCtaClicked(toolSlug: string, ctaPosition: string) {
    ph("tool_result_kundli_cta_clicked", {
      tool_slug: toolSlug,
      cta_position: ctaPosition,
    });
  },

  homePageView() {
    ph("home_page_view", {});
    ga("home_page_view", {});
    internalEvent("home_page_view", { eventGroup: "page" });
  },

  salesPageView(sourcePage?: string) {
    ph("sales_page_view", { source_page: sourcePage });
    ga("sales_page_view", { source_page: sourcePage });
    internalEvent("sales_page_view", {
      eventGroup: "page",
      sourcePage,
      pagePath: typeof window !== "undefined" ? window.location.pathname : undefined,
    });
  },

  freeKundliPageViewed(attrs?: Record<string, string>) {
    ph("free_kundli_page_viewed", attrs);
  },
  freeKundliFormStarted(source?: string) {
    ph("free_kundli_form_started", { source });
    ga("free_kundli_start", { source });
    internalEvent("free_kundli_start", {
      eventGroup: "funnel",
      metadata: { source },
    });
  },
  freeKundliStepCompleted(stepNumber: number, stepName: string) {
    ph("free_kundli_step_completed", {
      step_number: stepNumber,
      step_name: stepName,
    });
  },
  freeKundliSubmitted(source?: string, hasEmail = false) {
    ph("free_kundli_submitted", { source, has_email: hasEmail });
    ga("free_kundli_submit", { source });
    ga("generate_lead", { source });
    internalEvent("free_kundli_submit", {
      eventGroup: "funnel",
      metadata: { source, has_email: hasEmail },
    });
  },
  freeKundliResultViewed(
    kundliSubmissionId?: string,
    resultVariant?: "a" | "b"
  ) {
    ph("free_kundli_result_viewed", {
      kundli_submission_id: kundliSubmissionId,
      result_variant: resultVariant,
    });
    ga("free_kundli_result_view", {
      kundli_submission_id: kundliSubmissionId,
      result_variant: resultVariant,
    });
    internalEvent("free_kundli_result_view", {
      eventGroup: "funnel",
      metadata: { kundli_submission_id: kundliSubmissionId, result_variant: resultVariant },
    });
  },

  paidReportCtaClicked(sourcePage: string, ctaPosition: string) {
    ph("paid_report_cta_clicked", {
      source_page: sourcePage,
      cta_position: ctaPosition,
    });
  },

  checkoutViewed(
    productSlug: string,
    sourceFunnel?: string,
    prefilled = false,
    checkoutPagePath = "/checkout/kundli"
  ) {
    ph("checkout_viewed", {
      product_slug: productSlug,
      source_funnel: sourceFunnel,
      prefilled,
    });
    ga("checkout_page_view", {
      product_slug: productSlug,
      source_funnel: sourceFunnel,
      prefilled,
    });
    const params = new URLSearchParams(
      typeof window !== "undefined" ? window.location.search : ""
    );
    fetch("/api/checkout/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: getOrCreateSessionId(),
        sourcePage: checkoutPagePath,
        pagePath: checkoutPagePath,
        sourceFunnel: sourceFunnel,
        utmSource: params.get("utm_source") ?? undefined,
        utmMedium: params.get("utm_medium") ?? undefined,
        utmCampaign: params.get("utm_campaign") ?? undefined,
        referrer: typeof document !== "undefined" ? document.referrer : undefined,
        productSlug,
      }),
    }).catch(() => {});
    internalEvent("checkout_page_view", {
      eventGroup: "page",
      entryPath: sourceFunnel,
      metadata: { product_slug: productSlug, prefilled },
    });
  },
  checkoutDetailsFilled(productSlug: string) {
    ph("checkout_details_filled", { product_slug: productSlug });
  },
  paymentInitiated(
    productSlug: string,
    amountPaise: number,
    sourceFunnel?: string
  ) {
    ph("payment_initiated", {
      product_slug: productSlug,
      amount_paise: amountPaise,
      source_funnel: sourceFunnel,
    });
    ga("payment_initiated", {
      product_slug: productSlug,
      value: amountPaise / 100,
      currency: "INR",
      source_funnel: sourceFunnel,
    });
  },
  paymentSuccess(
    productSlug: string,
    amountPaise: number,
    orderId: string,
    sourceFunnel?: string
  ) {
    ph("payment_success", {
      product_slug: productSlug,
      amount_paise: amountPaise,
      order_id: orderId,
      source_funnel: sourceFunnel,
    });
    ga("payment_success", {
      payment: amountPaise / 100,
      currency: "INR",
      transaction_id: orderId,
    });
    ga("purchase", {
      transaction_id: orderId,
      value: amountPaise / 100,
      currency: "INR",
      items: [{ item_name: productSlug, price: amountPaise / 100 }],
    });
  },
  paymentFailed(productSlug: string, amountPaise: number, errorCode?: string) {
    ph("payment_failed", {
      product_slug: productSlug,
      amount_paise: amountPaise,
      error_code: errorCode,
    });
  },
  thankYouView(orderId?: string) {
    ph("thank_you_view", { order_id: orderId });
    ga("thank_you_view", { order_id: orderId });
    internalEvent("thank_you_view", {
      eventGroup: "funnel",
      metadata: { order_id: orderId },
    });
  },
  checkoutAbandoned(
    productSlug: string,
    sourceFunnel: string,
    stepReached: string
  ) {
    ph("checkout_abandoned", {
      product_slug: productSlug,
      source_funnel: sourceFunnel,
      step_reached: stepReached,
    });
  },

  consultationPageViewed(source?: string) {
    ph("consultation_page_viewed", { source });
  },
  consultationProductSelected(productType: string) {
    ph("consultation_product_selected", { product_type: productType });
  },
  consultationCheckoutStarted(productType: string, amountPaise: number) {
    ph("consultation_checkout_started", {
      product_type: productType,
      amount_paise: amountPaise,
    });
  },

  supportSubmitted(subjectCategory: string) {
    ph("support_submitted", { subject_category: subjectCategory });
  },
};
