import type { Metadata } from "next";
import { ConsultationLanding } from "@/components/sections/consultation-landing";

export const metadata: Metadata = {
  title: "Personal Consultation",
  description:
    "Book a private Vedic astrology session with AstroGuru Ashutosh — 15 or 45 minute packages, personalized kundli report, and clear guidance.",
};

export default function ConsultationPage() {
  return <ConsultationLanding />;
}
