import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import { commerceSchemaReady } from "@/lib/admin/schema-status";
import { SchemaMigrationRequired } from "@/components/admin/schema-migration-required";

export default async function AdminAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const h = await headers();
  const path = h.get("x-admin-pathname");

  if (path === "/admindeoghar/login" || path === "/admin/login") {
    return <>{children}</>;
  }

  const supabase = createServiceClient();
  const ok = await commerceSchemaReady(supabase);
  if (!ok) {
    return <SchemaMigrationRequired />;
  }

  return <>{children}</>;
}
