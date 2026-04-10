import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { commerceSchemaReady } from "@/lib/admin/schema-status";

/** Used by admin UI to detect if 002_commerce_admin.sql was applied */
export async function GET() {
  try {
    const supabase = createServiceClient();
    const ready = await commerceSchemaReady(supabase);
    return NextResponse.json({ ready });
  } catch {
    return NextResponse.json({ ready: false });
  }
}
