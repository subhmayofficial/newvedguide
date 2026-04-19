"use client";

export const dynamic = "force-dynamic";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { AuthError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DEFAULT_ADMIN_PATH = "/admindeoghar";

/** Only same-site admin paths — blocks open redirects via ?redirect= */
function safeAdminRedirect(raw: string | null): string {
  if (!raw) return DEFAULT_ADMIN_PATH;
  let path = raw.trim();
  try {
    path = decodeURIComponent(path);
  } catch {
    return DEFAULT_ADMIN_PATH;
  }
  if (!path.startsWith("/") || path.startsWith("//")) return DEFAULT_ADMIN_PATH;
  if (!path.startsWith("/admin") && !path.startsWith("/admindeoghar")) {
    return DEFAULT_ADMIN_PATH;
  }
  return path;
}

function signInErrorMessage(authError: AuthError): string {
  const msg = (authError.message ?? "").toLowerCase();
  if (
    msg.includes("invalid login credentials") ||
    msg.includes("invalid_credentials")
  ) {
    return "Wrong email or password for this Supabase project — or the user does not exist.";
  }
  if (msg.includes("email not confirmed")) {
    return "Email not confirmed. In Supabase Dashboard → Authentication → Providers, disable “Confirm email” for testing, or confirm the user’s email.";
  }
  if (
    authError.status === 0 ||
    msg.includes("fetch") ||
    msg.includes("network")
  ) {
    return "Network error — check internet, VPN, and that NEXT_PUBLIC_SUPABASE_URL is reachable.";
  }
  return authError.message || "Sign-in failed.";
}

export default function AdminLoginPage() {
  const searchParams = useSearchParams();
  const redirect = useMemo(
    () => safeAdminRedirect(searchParams.get("redirect")),
    [searchParams]
  );
  const configError = searchParams.get("error") === "config";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      setError(signInErrorMessage(authError));
      setLoading(false);
      return;
    }

    // Full navigation so the browser sends fresh auth cookies to the proxy.
    // Client-side router.push alone often fails with @supabase/ssr + middleware.
    window.location.assign(redirect);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sidebar px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-heading text-3xl font-bold text-sidebar-foreground">
            Vedगuide Admin
          </h1>
          <p className="mt-2 text-sm text-sidebar-foreground/60">
            Internal access only
          </p>
          {configError && (
            <p className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-left text-xs text-amber-200">
              Set{" "}
              <span className="font-mono">
                NEXT_PUBLIC_SUPABASE_URL
              </span>{" "}
              and{" "}
              <span className="font-mono">
                NEXT_PUBLIC_SUPABASE_ANON_KEY
              </span>{" "}
              in{" "}
              <span className="font-mono">.env.local</span>, then restart{" "}
              <span className="font-mono">next dev</span>.
            </p>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-sidebar-border bg-sidebar-accent p-6 shadow-xl"
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-sidebar-foreground"
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="border-sidebar-border bg-sidebar text-sidebar-foreground placeholder:text-sidebar-foreground/40"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="text-sidebar-foreground"
              >
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="border-sidebar-border bg-sidebar text-sidebar-foreground placeholder:text-sidebar-foreground/40"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-sidebar-primary text-sidebar-primary-foreground hover:opacity-90"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
