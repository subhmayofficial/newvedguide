import type { Metadata } from "next";
import { Suspense } from "react";
import { ConsultationRelationshipCheckout } from "@/components/sections/consultation-relationship-checkout";

export const metadata: Metadata = {
  title: "Relationship Consultation Booking — VedGuide",
  description: "Apna relationship consultation session book karein AstroGuru Ashutosh ke saath. Starting ₹499.",
};

export default function RelationshipCheckoutPage() {
  return (
    <Suspense>
      <ConsultationRelationshipCheckout />
    </Suspense>
  );
}
