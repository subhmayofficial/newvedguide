import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { uploadPaidKundliReportToBunny } from "@/lib/services/bunny-storage-upload";

export type PaidKundliReportUploadResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

const ORDER_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validates order, reads file bytes, uploads to Bunny. Used by the admin API route
 * (preferred for large PDFs) and optionally by the server action.
 */
export async function processPaidKundliReportUpload(
  supabase: SupabaseClient<Database>,
  orderId: string,
  file: File
): Promise<PaidKundliReportUploadResult> {
  const id = orderId.trim();
  if (!ORDER_ID_RE.test(id)) {
    return { ok: false, error: "Invalid order" };
  }

  const { data: row, error } = await supabase
    .from("orders")
    .select("id,order_number,product_slug,payment_status")
    .eq("id", id)
    .maybeSingle();

  if (error || !row) {
    return { ok: false, error: "Order not found" };
  }

  type Ord = {
    id: string;
    order_number: string;
    product_slug: string;
    payment_status: string;
  };
  const ord = row as Ord;

  if (ord.product_slug !== "paid-kundli" || ord.payment_status !== "paid") {
    return { ok: false, error: "Only paid Kundli orders can upload reports here" };
  }

  let buf: Buffer;
  try {
    const ab = await file.arrayBuffer();
    buf = Buffer.from(ab);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg.slice(0, 400) || "Could not read file" };
  }

  const up = await uploadPaidKundliReportToBunny(supabase, {
    orderNumber: ord.order_number,
    fileName: file.name || "report.pdf",
    mimeType: file.type || "application/octet-stream",
    body: buf,
  });

  if (!up.ok) {
    return { ok: false, error: up.message };
  }
  return { ok: true, url: up.publicUrl };
}
