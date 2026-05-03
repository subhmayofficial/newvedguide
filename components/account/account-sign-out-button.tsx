"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type Props = {
  className?: string;
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive" | "link";
  redirectTo?: string;
  label?: string;
};

export function AccountSignOutButton({
  className,
  variant = "outline",
  redirectTo = "/",
  label = "Sign out",
}: Props) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant={variant}
      className={className}
      onClick={() => void handleSignOut()}
    >
      {label}
    </Button>
  );
}
