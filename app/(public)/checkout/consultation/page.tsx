import type { Metadata } from "next";
import { Suspense } from "react";
import { ConsultationCheckout } from "@/components/sections/consultation-checkout";

export const metadata: Metadata = {
  title: "Book Consultation — VedGuide",
  description: "Book your private Vedic astrology session with AstroGuru Ashutosh.",
};

export default function ConsultationCheckoutPage() {
  return (
    <Suspense>
      <ConsultationCheckout />
    </Suspense>
  );
}
