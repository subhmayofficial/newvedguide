import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { ENTITY_NOTE_TYPE } from "@/lib/constants/commerce";

export async function deleteOrderByAdmin(
  supabase: SupabaseClient<Database>,
  orderId: string
): Promise<{ orderNumber: string }> {
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("id,order_number")
    .eq("id", orderId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!order) throw new Error("Order not found");

  await supabase
    .from("notes")
    .delete()
    .eq("entity_type", ENTITY_NOTE_TYPE.ORDER)
    .eq("entity_id", orderId);

  await supabase
    .from("leads")
    .update({ has_order: false, linked_order_id: null })
    .eq("linked_order_id", orderId);

  const { error: deleteError } = await supabase.from("orders").delete().eq("id", orderId);
  if (deleteError) throw deleteError;

  return { orderNumber: order.order_number };
}
