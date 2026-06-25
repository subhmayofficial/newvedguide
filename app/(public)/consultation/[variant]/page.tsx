import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ConsultationLanding } from "@/components/sections/consultation-landing";
import { ConsultationRelationshipLanding } from "@/components/sections/consultation-relationship-landing";
import { CONSULTATION_VARIANTS, getConsultationVariant } from "@/lib/consultation-variants";

export function generateStaticParams() {
  return Object.keys(CONSULTATION_VARIANTS).map((variant) => ({ variant }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ variant: string }>;
}): Promise<Metadata> {
  const { variant: slug } = await params;
  const variant = getConsultationVariant(slug);
  if (!variant) return {};
  return {
    title: variant.metaTitle,
    description: variant.metaDescription,
  };
}

export default async function ConsultationVariantPage({
  params,
}: {
  params: Promise<{ variant: string }>;
}) {
  const { variant: slug } = await params;
  const variant = getConsultationVariant(slug);
  if (!variant) notFound();

  if (slug === "relationship") return <ConsultationRelationshipLanding />;

  return <ConsultationLanding variant={variant} />;
}
