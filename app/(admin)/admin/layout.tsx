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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!supabaseUrl || !serviceRoleKey) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <p className="max-w-md text-center text-sm text-muted-foreground">
          Add{" "}
          <code className="rounded bg-muted px-1 font-mono text-xs">
            NEXT_PUBLIC_SUPABASE_URL
          </code>{" "}
          and{" "}
          <code className="rounded bg-muted px-1 font-mono text-xs">
            SUPABASE_SERVICE_ROLE_KEY
          </code>{" "}
          to <code className="rounded bg-muted px-1 font-mono text-xs">.env.local</code>{" "}
          for admin dashboards.
        </p>
      </div>
    );
  }

  const supabase = createServiceClient();
  const ok = await commerceSchemaReady(supabase);
  if (!ok) {
    return <SchemaMigrationRequired />;
  }

  return <>{children}</>;
}
