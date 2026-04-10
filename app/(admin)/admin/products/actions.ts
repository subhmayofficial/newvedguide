"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";

export async function upsertProduct(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();
  const pricePaise = Number(formData.get("price_paise") ?? 0);
  const currency = String(formData.get("currency") ?? "INR");
  const isActive = formData.get("is_active") === "on";
  const deliveryType = String(formData.get("delivery_type") ?? "").trim() || null;
  const eta = formData.get("delivery_eta_hours");
  const deliveryEtaHours = eta ? Number(eta) : null;

  if (!name || !slug || !type || !pricePaise) return;

  const supabase = createServiceClient();
  const row = {
    name,
    slug,
    type,
    price: pricePaise,
    currency,
    is_active: isActive,
    delivery_type: deliveryType,
    delivery_eta_hours: deliveryEtaHours,
  };

  if (id) {
    await supabase.from("products").update(row).eq("id", id);
  } else {
    await supabase.from("products").insert(row);
  }
  revalidatePath("/admin/products");
}
