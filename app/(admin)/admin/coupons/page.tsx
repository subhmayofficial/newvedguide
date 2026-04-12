import { createServiceClient } from "@/lib/supabase/server";
import { listCoupons } from "@/lib/services/coupon";
import { submitCouponCreateForm } from "@/app/(admin)/admin/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const supabase = createServiceClient();
  const coupons = await listCoupons(supabase);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold">Coupons</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create discount codes for checkout and track usage against paid orders.
        </p>
      </div>

      <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold">Create coupon</h2>
        <form action={submitCouponCreateForm} className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="coupon-code">Coupon code</Label>
            <Input id="coupon-code" name="code" placeholder="SAVE50" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="coupon-description">Description</Label>
            <Input id="coupon-description" name="description" placeholder="Small private code" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="coupon-type">Discount type</Label>
            <select
              id="coupon-type"
              name="discountType"
              className="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
              defaultValue="fixed"
            >
              <option value="fixed">Fixed (paise)</option>
              <option value="percentage">Percentage</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="coupon-value">Discount value</Label>
            <Input id="coupon-value" name="discountValue" type="number" min="1" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="coupon-min-order">Minimum order amount (paise)</Label>
            <Input id="coupon-min-order" name="minOrderAmount" type="number" min="0" defaultValue="0" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="coupon-max-discount">Max discount (paise)</Label>
            <Input id="coupon-max-discount" name="maxDiscountAmount" type="number" min="0" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="coupon-usage-limit">Usage limit</Label>
            <Input id="coupon-usage-limit" name="usageLimit" type="number" min="1" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="coupon-product">Product slug</Label>
            <Input id="coupon-product" name="appliesToProductSlug" placeholder="paid-kundli" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="coupon-valid-from">Valid from</Label>
            <Input id="coupon-valid-from" name="validFrom" type="datetime-local" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="coupon-valid-until">Valid until</Label>
            <Input id="coupon-valid-until" name="validUntil" type="datetime-local" />
          </div>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input type="checkbox" name="isActive" defaultChecked />
            Active coupon
          </label>
          <div className="md:col-span-2">
            <Button type="submit">Create coupon</Button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border/60 bg-muted/30 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Usage</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Validity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {coupons.map((coupon) => (
              <tr key={coupon.id}>
                <td className="px-4 py-3 font-mono text-xs font-semibold">{coupon.code}</td>
                <td className="px-4 py-3 text-xs">{coupon.discount_type}</td>
                <td className="px-4 py-3 text-xs">
                  {coupon.discount_type === "percentage"
                    ? `${coupon.discount_value}%`
                    : `Rs ${(Number(coupon.discount_value) / 100).toFixed(0)}`}
                </td>
                <td className="px-4 py-3 text-xs">
                  {coupon.usage_count}
                  {coupon.usage_limit ? ` / ${coupon.usage_limit}` : ""}
                </td>
                <td className="px-4 py-3 text-xs">{coupon.is_active ? "active" : "inactive"}</td>
                <td className="px-4 py-3 text-xs">{coupon.applies_to_product_slug ?? "all"}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {coupon.valid_until ? new Date(coupon.valid_until).toLocaleString() : "No expiry"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!coupons.length && (
          <p className="p-8 text-center text-sm text-muted-foreground">No coupons created yet.</p>
        )}
      </section>
    </div>
  );
}
