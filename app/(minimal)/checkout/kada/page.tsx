import { Suspense } from "react";
import { CheckoutKadaPage } from "@/components/sections/checkout-kada-page";
import { createServiceClient } from "@/lib/supabase/server";
import { getKadaPricing } from "@/lib/products/kada-pricing-server";

export const metadata = {
  title: "Checkout — Vedic Kada",
};

export const dynamic = "force-dynamic";

export default async function Page() {
  const pricing = await getKadaPricing(createServiceClient());
  return (
    <Suspense>
      <CheckoutKadaPage pricing={pricing} />
    </Suspense>
  );
}
