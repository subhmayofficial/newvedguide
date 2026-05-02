"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { safeAuthRedirect } from "@/lib/auth/safe-redirect";
import { signUpErrorMessage } from "@/lib/auth/sign-in-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SignupForm() {
  const searchParams = useSearchParams();
  const redirect = useMemo(
    () => safeAuthRedirect(searchParams.get("redirect")),
    [searchParams]
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          display_name: displayName.trim() || undefined,
        },
        emailRedirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}${redirect}`
            : undefined,
      },
    });
    if (authError) {
      setError(signUpErrorMessage(authError));
      setLoading(false);
      return;
    }
    if (data.session) {
      window.location.assign(redirect);
      return;
    }
    setDone(true);
    setLoading(false);
  }

  if (done) {
    return (
      <div className="mx-auto w-full max-w-sm px-4 py-16">
        <h1 className="font-heading text-3xl font-semibold">Check your email</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We sent a confirmation link to <strong>{email}</strong>. After you
          confirm, you can{" "}
          <Link href="/login" className="font-medium text-brand underline-offset-2 hover:underline">
            sign in
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-sm px-4 py-16">
      <h1 className="font-heading text-3xl font-semibold">Create account</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Join VedGuide for astrologer chat and wallet top-ups.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm"
      >
        {error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="signup-name">Display name (optional)</Label>
          <Input
            id="signup-name"
            type="text"
            autoComplete="name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="signup-email">Email</Label>
          <Input
            id="signup-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="signup-password">Password</Label>
          <Input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button
          type="submit"
          className="w-full rounded-xl bg-brand font-semibold"
          disabled={loading}
        >
          {loading ? "Creating…" : "Sign up"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={`/login?redirect=${encodeURIComponent(redirect)}`}
          className="font-medium text-brand underline-offset-2 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh]" />}>
      <SignupForm />
    </Suspense>
  );
}
