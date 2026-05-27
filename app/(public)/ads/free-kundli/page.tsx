import type { Metadata } from "next";
import { V2FreeKundliLanding } from "@/components/funnels/v2-free-kundli-landing";
import { ADS_FUNNEL, ADS_SOURCES } from "@/lib/constants/ads-funnel";

export const metadata: Metadata = {
  title: "Free Kundli — Instant Janam Chart | VedGuide",
  description:
    "Apni free kundli turant banayein. Janam ki basic details dalein aur career, relationship aur money patterns ka quick chart snapshot dekhein.",
};

export default function AdsFreeKundliPage() {
  return (
    <V2FreeKundliLanding
      sourceDefault={ADS_SOURCES.freeKundliPage}
      pagePath={ADS_FUNNEL.freeKundli}
      resultPath={ADS_FUNNEL.freeKundliResult}
      idPrefix="free-kundli-ads"
      formAnchorId="kundli-form-ads"
    />
  );
}
