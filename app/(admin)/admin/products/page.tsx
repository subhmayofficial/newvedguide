import { createServiceClient } from "@/lib/supabase/server";
import { upsertProduct } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const supabase = createServiceClient();
  const { data: products } = await supabase.from("products").select("*").order("name");

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-heading text-3xl font-bold">Products</h1>
        <p className="mt-1 text-sm text-muted-foreground">Catalog — used by checkout pricing</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/30 text-[11px] font-semibold uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Used in</th>
              <th className="px-4 py-3">Price (paise)</th>
              <th className="px-4 py-3">Active</th>
            </tr>
          </thead>
          <tbody>
            {(products ?? []).map((p) => (
              <tr key={p.id} className="border-b border-border/40">
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 font-mono text-xs">{p.slug}</td>
                <td className="px-4 py-3">{p.type}</td>
                <td className="px-4 py-3 text-xs">{productUsageLabel(p.slug)}</td>
                <td className="px-4 py-3 tabular-nums">{p.price}</td>
                <td className="px-4 py-3">{p.is_active ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold">Create / edit</h2>
        <form action={upsertProduct} className="mt-6 grid max-w-lg gap-4">
          <input type="hidden" name="id" value="" />
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required className="mt-1" />
          </div>
          <div>
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" name="slug" required className="mt-1 font-mono text-sm" />
          </div>
          <div>
            <Label htmlFor="type">Type</Label>
            <Input id="type" name="type" required placeholder="report | addon" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="price_paise">Price (paise)</Label>
            <Input id="price_paise" name="price_paise" type="number" required className="mt-1" />
          </div>
          <div>
            <Label htmlFor="currency">Currency</Label>
            <Input id="currency" name="currency" defaultValue="INR" className="mt-1" />
          </div>
          <div className="flex items-center gap-2">
            <input id="is_active" name="is_active" type="checkbox" defaultChecked className="size-4" />
            <Label htmlFor="is_active">Active</Label>
          </div>
          <div>
            <Label htmlFor="delivery_type">Delivery type</Label>
            <Input id="delivery_type" name="delivery_type" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="delivery_eta_hours">ETA hours</Label>
            <Input id="delivery_eta_hours" name="delivery_eta_hours" type="number" className="mt-1" />
          </div>
          <Button type="submit" size="sm" className="w-fit">
            Save product
          </Button>
        </form>
      </div>
    </div>
  );
}

function productUsageLabel(slug: string): string {
  if (slug === "paid-kundli" || slug === "fast-track-addon") return "Kundli checkout";
  if (slug === "consultation-15min" || slug === "consultation-45min") {
    return "Consultation checkout";
  }
  return "General";
}
