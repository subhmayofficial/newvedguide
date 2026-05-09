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
  toolPageViewed(_toolSlug: string, _attrs?: Record<string, string>) {},

  toolFormStarted(_toolSlug: string) {},

  toolFormCompleted(toolSlug: string) {
    ga("tool_completed", { tool_slug: toolSlug });
  },
  toolResultKundliCtaClicked(_toolSlug: string, _ctaPosition: string) {},

  homePageView() {
    ga("home_page_view", {});
    internalEvent("home_page_view", { eventGroup: "page" });
  },

  salesPageView(sourcePage?: string) {
    ga("sales_page_view", { source_page: sourcePage });
    internalEvent("sales_page_view", {
      eventGroup: "page",
      sourcePage,
      pagePath: typeof window !== "undefined" ? window.location.pathname : undefined,
    });
  },

  freeKundliPageViewed(_attrs?: Record<string, string>) {},

  freeKundliFormStarted(source?: string) {
    ga("free_kundli_start", { source });
    internalEvent("free_kundli_start", {
      eventGroup: "funnel",
      metadata: { source },
    });
  },
  freeKundliStepCompleted(_stepNumber: number, _stepName: string) {},

  freeKundliSubmitted(source?: string, hasEmail = false) {
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
    ga("free_kundli_result_view", {
      kundli_submission_id: kundliSubmissionId,
      result_variant: resultVariant,
    });
    internalEvent("free_kundli_result_view", {
      eventGroup: "funnel",
      metadata: { kundli_submission_id: kundliSubmissionId, result_variant: resultVariant },
    });
  },

  paidReportCtaClicked(_sourcePage: string, _ctaPosition: string) {},

  checkoutViewed(
    productSlug: string,
    sourceFunnel?: string,
    prefilled = false,
    checkoutPagePath = "/checkout/kundli"
  ) {
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
  checkoutDetailsFilled(_productSlug: string) {},

  paymentInitiated(
    productSlug: string,
    amountPaise: number,
    sourceFunnel?: string
  ) {
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
    _sourceFunnel?: string
  ) {
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
  paymentFailed(_productSlug: string, _amountPaise: number, _errorCode?: string) {},

  thankYouView(orderId?: string) {
    ga("thank_you_view", { order_id: orderId });
    internalEvent("thank_you_view", {
      eventGroup: "funnel",
      metadata: { order_id: orderId },
    });
  },
  checkoutAbandoned(_productSlug: string, _sourceFunnel: string, _stepReached: string) {},

  consultationPageViewed(_source?: string) {},

  astrologersDirectoryViewed() {},

  astrologerChatCtaClicked(_astrologerId: string, _slug: string) {},

  consultationProductSelected(_productType: string) {},

  consultationCheckoutStarted(_productType: string, _amountPaise: number) {},

  supportSubmitted(_subjectCategory: string) {},
};
