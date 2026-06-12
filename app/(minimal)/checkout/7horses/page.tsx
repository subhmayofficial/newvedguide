import { Suspense } from "react";
import { SevenHorsesCheckoutPage } from "@/components/sections/checkout-7horses-page";

export const metadata = { title: "Checkout — 7 Horses on Frame" };
export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense>
      <SevenHorsesCheckoutPage />
    </Suspense>
  );
}
