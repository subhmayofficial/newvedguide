"use client";

// ─── GA4 helper ──────────────────────────────────────────────────────────────

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

// ─── PostHog helper (lazy import to avoid SSR issues) ────────────────────────

function ph(event: string, props?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  import("posthog-js").then(({ default: posthog }) => {
    posthog.capture(event, props);
  });
}

// ─── Typed event helpers ─────────────────────────────────────────────────────

export const track = {
  // ── Tool funnel ───────────────────────────────────────────────────────────
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

  // ── Free Kundli funnel ────────────────────────────────────────────────────
  freeKundliPageViewed(attrs?: Record<string, string>) {
    ph("free_kundli_page_viewed", attrs);
  },
  freeKundliFormStarted(source?: string) {
    ph("free_kundli_form_started", { source });
  },
  freeKundliStepCompleted(stepNumber: number, stepName: string) {
    ph("free_kundli_step_completed", {
      step_number: stepNumber,
      step_name: stepName,
    });
  },
  freeKundliSubmitted(source?: string, hasEmail = false) {
    ph("free_kundli_submitted", { source, has_email: hasEmail });
    ga("generate_lead", { source });
  },
  freeKundliResultViewed(kundliSubmissionId?: string) {
    ph("free_kundli_result_viewed", {
      kundli_submission_id: kundliSubmissionId,
    });
  },

  // ── Paid report funnel ────────────────────────────────────────────────────
  paidReportCtaClicked(sourcePage: string, ctaPosition: string) {
    ph("paid_report_cta_clicked", {
      source_page: sourcePage,
      cta_position: ctaPosition,
    });
  },

  // ── Checkout funnel ───────────────────────────────────────────────────────
  checkoutViewed(productType: string, sourceFunnel?: string, prefilled = false) {
    ph("checkout_viewed", {
      product_type: productType,
      source_funnel: sourceFunnel,
      prefilled,
    });
  },
  checkoutDetailsFilled(productType: string) {
    ph("checkout_details_filled", { product_type: productType });
  },
  paymentInitiated(productType: string, amountPaise: number, sourceFunnel?: string) {
    ph("payment_initiated", {
      product_type: productType,
      amount_paise: amountPaise,
      source_funnel: sourceFunnel,
    });
  },
  paymentSuccess(
    productType: string,
    amountPaise: number,
    orderId: string,
    sourceFunnel?: string
  ) {
    ph("payment_success", {
      product_type: productType,
      amount_paise: amountPaise,
      order_id: orderId,
      source_funnel: sourceFunnel,
    });
    ga("purchase", {
      transaction_id: orderId,
      value: amountPaise / 100,
      currency: "INR",
      items: [{ item_name: productType, price: amountPaise / 100 }],
    });
  },
  paymentFailed(productType: string, amountPaise: number, errorCode?: string) {
    ph("payment_failed", {
      product_type: productType,
      amount_paise: amountPaise,
      error_code: errorCode,
    });
  },
  checkoutAbandoned(
    productType: string,
    sourceFunnel: string,
    stepReached: string
  ) {
    ph("checkout_abandoned", {
      product_type: productType,
      source_funnel: sourceFunnel,
      step_reached: stepReached,
    });
  },

  // ── Consultation funnel ───────────────────────────────────────────────────
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

  // ── Support ───────────────────────────────────────────────────────────────
  supportSubmitted(subjectCategory: string) {
    ph("support_submitted", { subject_category: subjectCategory });
  },
};
