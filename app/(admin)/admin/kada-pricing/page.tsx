import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { adminPath } from "@/lib/admin/admin-paths";
import { getKadaPricing } from "@/lib/products/kada-pricing-server";
import { updateKadaPricing } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const dynamic = "force-dynamic";

function rs(paise: number): string {
  return (paise / 100).toFixed(0);
}

export default async function AdminKadaPricingPage() {
  const supabase = createServiceClient();
  const pricing = await getKadaPricing(supabase);
  const paymentBypassOn = process.env.ALLOW_TEST_KADA_PAYMENT_BYPASS === "true";

  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Catalog
          </p>
          <h1 className="font-heading mt-1 text-3xl font-bold">Kada pricing</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Update `/products/kada`, `/checkout/kada`, and server-side order validation prices from one place.
          </p>
        </div>
        <Link
          href={adminPath("/orders?product=kada")}
          className="inline-flex h-9 items-center rounded-md border border-border bg-card px-3 text-xs font-semibold text-foreground hover:bg-muted/60"
        >
          View Kada orders
        </Link>
      </div>

      <div className="rounded-2xl border border-amber-300/50 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-700/40 dark:bg-amber-950/25 dark:text-amber-100">
        <p className="font-semibold">
          Test payment bypass: {paymentBypassOn ? "ON" : "OFF"}
        </p>
        <p className="mt-1 text-xs opacity-90">
          Set <code className="rounded bg-white/70 px-1 py-0.5 dark:bg-black/20">ALLOW_TEST_KADA_PAYMENT_BYPASS=true</code>{" "}
          locally to make prepaid Kada checkout mark orders paid without Razorpay.
        </p>
      </div>

      <form action={updateKadaPricing} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold">Edit prices</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter rupee amounts. They are saved to `products.price` in paise.
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <PriceCard
            title="Silver Plated Kada"
            description="Main product: vedic-kada-plated"
            priceName="plated_price"
            mrpName="plated_mrp"
            defaultPrice={rs(pricing.platedPricePaise)}
            defaultMrp={rs(pricing.platedMrpPaise)}
          />
          <PriceCard
            title="Pure Silver Kada"
            description="Main product: vedic-kada-pure-silver"
            priceName="silver_price"
            mrpName="silver_mrp"
            defaultPrice={rs(pricing.silverPricePaise)}
            defaultMrp={rs(pricing.silverMrpPaise)}
          />
        </div>

        <div className="mt-5 rounded-2xl border border-border/70 bg-muted/20 p-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Siddh Energisation add-on</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Product: <code>kada-siddha-energisation</code>
            </p>
          </div>
          <div className="mt-4 max-w-xs">
            <Label htmlFor="siddha_price">Add-on price (₹)</Label>
            <Input
              id="siddha_price"
              name="siddha_price"
              type="number"
              min="0"
              step="1"
              required
              defaultValue={rs(pricing.siddhaPricePaise)}
              className="mt-1"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Prepaid discount is currently fixed at ₹{rs(pricing.prepaidDiscountPaise)} in code.
          </p>
          <Button type="submit">Save Kada pricing</Button>
        </div>
      </form>
    </div>
  );
}

function PriceCard({
  title,
  description,
  priceName,
  mrpName,
  defaultPrice,
  defaultMrp,
}: {
  title: string;
  description: string;
  priceName: string;
  mrpName: string;
  defaultPrice: string;
  defaultMrp: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor={priceName}>Selling price (₹)</Label>
          <Input
            id={priceName}
            name={priceName}
            type="number"
            min="0"
            step="1"
            required
            defaultValue={defaultPrice}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor={mrpName}>MRP / strike price (₹)</Label>
          <Input
            id={mrpName}
            name={mrpName}
            type="number"
            min="0"
            step="1"
            required
            defaultValue={defaultMrp}
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );
}

