import type { Metadata } from "next";
import { AstrologersDirectory } from "@/components/sections/astrologers-directory";

export const metadata: Metadata = {
  title: "Talk to Astrologers — Live chat rates",
  description:
    "Browse VedGuide astrologers, compare per-minute chat pricing, and choose who you want for love, career, wealth, vastu, or full Vedic depth. Wallet-based live chat coming soon.",
  alternates: {
    canonical: "/astrologers",
  },
  openGraph: {
    title: "Talk to Astrologers — VedGuide",
    description:
      "Choose your astrologer and see transparent per-minute chat rates. Private guidance rooted in Vedic Jyotish.",
    url: "/astrologers",
  },
};

export default function AstrologersPage() {
  return <AstrologersDirectory />;
}
