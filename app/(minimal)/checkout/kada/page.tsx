import { Suspense } from "react";
import { CheckoutKadaPage } from "@/components/sections/checkout-kada-page";

export const metadata = {
  title: "Checkout — Vedic Kada",
};

export default function Page() {
  return (
    <Suspense>
      <CheckoutKadaPage />
    </Suspense>
  );
}
