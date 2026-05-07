import { AstroOpsLayoutClient } from "@/components/admin/astro-ops-layout-client";

export const dynamic = "force-dynamic";

export default function AstroOpsRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AstroOpsLayoutClient>{children}</AstroOpsLayoutClient>;
}
