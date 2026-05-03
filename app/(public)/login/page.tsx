"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useMemo, useCallback, useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { safeAuthRedirect } from "@/lib/auth/safe-redirect";
import { signInErrorMessage } from "@/lib/auth/sign-in-errors";
import { isPhoneOtpSyntheticEmail } from "@/lib/auth/phone-login-identity";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, MessageSquare, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

type AuthMode = "email" | "phone";
type PhoneStep = "send" | "code";

// ─── OTP Box Input ─────────────────────────────────────────────────────────────

function OtpBoxInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  function getInput(i: number): HTMLInputElement | null {
    return containerRef.current?.querySelectorAll("input")[i] ?? null;
  }

  function handleKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !value[i] && i > 0) {
      getInput(i - 1)?.focus();
    }
  }

  function handleChange(i: number, char: string) {
    const digit = char.replace(/\D/g, "").slice(-1);
    const arr = value.padEnd(6, " ").split("");
    arr[i] = digit || " ";
    const next = arr.join("").trimEnd();
    onChange(next.slice(0, 6));
    if (digit && i < 5) setTimeout(() => getInput(i + 1)?.focus(), 0);
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    const lastIdx = Math.min(pasted.length, 5);
    setTimeout(() => getInput(lastIdx)?.focus(), 0);
  }

  return (
    <div ref={containerRef} className="flex gap-2 justify-center" onPaste={handlePaste}>
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={(value[i] ?? "").trim()}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          className={cn(
            "size-11 rounded-xl border text-center text-lg font-bold tabular-nums outline-none transition-all duration-150",
            "border-border bg-muted/40 text-foreground",
            "focus:border-brand focus:bg-background focus:ring-2 focus:ring-brand/20",
            (value[i] ?? "").trim() ? "border-brand/50 bg-brand/5" : ""
          )}
          aria-label={`OTP digit ${i + 1}`}
          autoComplete={i === 0 ? "one-time-code" : "off"}
        />
      ))}
    </div>
  );
}

// ─── Resend OTP Button ─────────────────────────────────────────────────────────

function ResendButton({ onResend }: { onResend: () => Promise<void> }) {
  const [countdown, setCountdown] = useState(30);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  async function handleResend() {
    setResending(true);
    await onResend();
    setResending(false);
    setCountdown(30);
  }

  if (countdown > 0) {
    return (
      <p className="text-center text-xs text-muted-foreground">
        Resend code in{" "}
        <span className="font-semibold tabular-nums text-foreground">{countdown}s</span>
      </p>
    );
  }

  return (
    <button
      type="button"
      disabled={resending}
      onClick={handleResend}
      className="w-full text-center text-sm font-medium text-brand underline-offset-2 hover:underline disabled:opacity-60"
    >
      {resending ? "Sending…" : "Resend code"}
    </button>
  );
}

// ─── Main Form ─────────────────────────────────────────────────────────────────

function LoginForm() {
  const searchParams = useSearchParams();
  const redirect = useMemo(
    () => safeAuthRedirect(searchParams.get("redirect")),
    [searchParams]
  );

  const [mode, setMode] = useState<AuthMode>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [errorHint, setErrorHint] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestPhone, setSuggestPhone] = useState(false);

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [phoneDisplayName, setPhoneDisplayName] = useState("");
  const [phoneStep, setPhoneStep] = useState<PhoneStep>("send");
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [whatsappConsent, setWhatsappConsent] = useState(false);

  function switchMode(m: AuthMode) {
    setMode(m);
    setError("");
    setErrorHint("");
    setSuggestPhone(false);
    if (m === "phone") {
      setPhoneStep("send");
      setWhatsappConsent(false);
      setOtp("");
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setErrorHint("");
    setSuggestPhone(false);
    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (authError) {
      const msg = signInErrorMessage(authError);
      setError(msg);
      // Hint if user may have registered via phone OTP
      if (
        (authError.message ?? "").toLowerCase().includes("invalid") &&
        !isPhoneOtpSyntheticEmail(email)
      ) {
        setSuggestPhone(true);
      }
      setLoading(false);
      return;
    }
    window.location.assign(redirect);
  }

  const sendOtp = useCallback(async () => {
    setError("");
    setErrorHint("");
    setPhoneLoading(true);
    try {
      const res = await fetch("/api/auth/phone-otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, consent: true }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        hint?: string;
      };
      if (!res.ok) {
        setError(data.error || "Could not send WhatsApp code.");
        setErrorHint(data.hint ?? "");
        return;
      }
      setPhoneStep("code");
      setOtp("");
    } finally {
      setPhoneLoading(false);
    }
  }, [phone]);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!whatsappConsent) {
      setError("Please agree to receive your login code on WhatsApp.");
      return;
    }
    await sendOtp();
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setErrorHint("");
    setPhoneLoading(true);
    try {
      const res = await fetch("/api/auth/phone-otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          phone,
          code: otp.replace(/\D/g, ""),
          displayName: phoneDisplayName.trim() || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Could not sign you in.");
        return;
      }
      window.location.assign(redirect);
    } finally {
      setPhoneLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Subtle astrology background */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="pointer-events-none absolute -top-32 right-[-10%] size-72 rounded-full bg-brand/8 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-[-5%] size-64 rounded-full bg-gold/6 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-5 py-12">
        {/* Brand mark */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-hover shadow-lg shadow-brand/20">
            <span className="text-2xl" aria-hidden>🔮</span>
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to continue your journey
          </p>
        </div>

        {/* Mode toggle */}
        <div className="mb-5 flex gap-1 rounded-2xl border border-border bg-muted/40 p-1">
          <button
            type="button"
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all duration-200",
              mode === "email"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => switchMode("email")}
          >
            <Mail className="size-3.5" />
            Email
          </button>
          <button
            type="button"
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all duration-200",
              mode === "phone"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => switchMode("phone")}
          >
            <MessageSquare className="size-3.5" />
            Mobile OTP
          </button>
        </div>

        {/* ── Email form ── */}
        {mode === "email" && (
          <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/8 px-3.5 py-3 text-sm text-destructive">
                <p>{error}</p>
                {suggestPhone && (
                  <p className="mt-2 text-xs text-destructive/80">
                    Registered with your mobile?{" "}
                    <button
                      type="button"
                      className="font-semibold underline underline-offset-2"
                      onClick={() => switchMode("phone")}
                    >
                      Use Mobile OTP instead
                    </button>
                  </p>
                )}
              </div>
            )}
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="login-email" className="text-sm font-medium">Email address</Label>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password" className="text-sm font-medium">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-brand underline-offset-2 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 rounded-xl pr-10"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword((p) => !p)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="h-11 w-full rounded-xl bg-brand text-sm font-semibold shadow-sm shadow-brand/20 hover:bg-brand-hover"
                disabled={loading}
              >
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </div>
        )}

        {/* ── Phone: send OTP ── */}
        {mode === "phone" && phoneStep === "send" && (
          <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/8 px-3.5 py-3 text-sm text-destructive">
                <p>{error}</p>
                {errorHint && (
                  <p className="mt-1.5 border-t border-destructive/20 pt-1.5 text-xs text-destructive/80">
                    {errorHint}
                  </p>
                )}
              </div>
            )}
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="login-phone" className="text-sm font-medium">
                  Mobile number
                </Label>
                <div className="relative flex">
                  <div className="flex h-11 shrink-0 items-center justify-center rounded-l-xl border border-r-0 border-border bg-muted px-3 text-sm font-medium text-foreground">
                    🇮🇳 +91
                  </div>
                  <Input
                    id="login-phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="98765 43210"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-11 flex-1 rounded-l-none rounded-r-xl"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  We&apos;ll send a 6-digit code via WhatsApp
                </p>
              </div>

              {/* Compact consent */}
              <label className="flex cursor-pointer items-start gap-2.5">
                <div className="relative mt-0.5 shrink-0">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={whatsappConsent}
                    onChange={(e) => setWhatsappConsent(e.target.checked)}
                  />
                  <div className={cn(
                    "flex size-5 items-center justify-center rounded-md border-2 transition-all duration-150",
                    whatsappConsent
                      ? "border-brand bg-brand"
                      : "border-muted-foreground/40 bg-background"
                  )}>
                    {whatsappConsent && <CheckCircle2 className="size-3.5 text-white" />}
                  </div>
                </div>
                <span className="text-[12px] leading-relaxed text-muted-foreground">
                  I agree to receive my VedGuide login code on WhatsApp.{" "}
                  <span className="text-foreground/70">Message rates may apply.</span>
                </span>
              </label>

              <Button
                type="submit"
                className="h-11 w-full rounded-xl bg-brand text-sm font-semibold shadow-sm shadow-brand/20 hover:bg-brand-hover disabled:opacity-60"
                disabled={phoneLoading || !whatsappConsent}
              >
                {phoneLoading ? "Sending…" : "Send code on WhatsApp"}
              </Button>
            </form>
          </div>
        )}

        {/* ── Phone: verify OTP ── */}
        {mode === "phone" && phoneStep === "code" && (
          <div className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="text-center">
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-emerald-500/10">
                <MessageSquare className="size-5 text-emerald-600" />
              </div>
              <p className="font-medium text-foreground text-sm">Code sent to WhatsApp</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Enter the 6-digit code sent to +91 {phone.replace(/\D/g, "").slice(-10)}
              </p>
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/8 px-3.5 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <OtpBoxInput value={otp} onChange={setOtp} />

              {/* New account display name */}
              <div className="space-y-1.5">
                <Label htmlFor="login-phone-name" className="text-xs font-medium text-muted-foreground">
                  Your name (optional — for new accounts)
                </Label>
                <Input
                  id="login-phone-name"
                  type="text"
                  autoComplete="name"
                  placeholder="e.g. Rahul"
                  value={phoneDisplayName}
                  onChange={(e) => setPhoneDisplayName(e.target.value)}
                  className="h-10 rounded-xl text-sm"
                />
              </div>

              <Button
                type="submit"
                className="h-11 w-full rounded-xl bg-brand text-sm font-semibold shadow-sm shadow-brand/20 hover:bg-brand-hover disabled:opacity-60"
                disabled={phoneLoading || otp.length !== 6}
              >
                {phoneLoading ? "Verifying…" : "Verify & sign in"}
              </Button>
            </form>

            <ResendButton onResend={sendOtp} />

            <button
              type="button"
              className="flex w-full items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                setPhoneStep("send");
                setError("");
                setOtp("");
              }}
            >
              <ArrowLeft className="size-3" />
              Use a different number
            </button>
          </div>
        )}

        {/* ── Footer links ── */}
        <div className="mt-6 space-y-3 text-center">
          <p className="text-sm text-muted-foreground">
            No account?{" "}
            <Link
              href={`/signup?redirect=${encodeURIComponent(redirect)}`}
              className="font-semibold text-brand underline-offset-2 hover:underline"
            >
              Create one free
            </Link>
          </p>
          {mode === "email" && (
            <p className="text-xs text-muted-foreground">
              Signed up with mobile?{" "}
              <button
                type="button"
                className="font-medium text-brand underline-offset-2 hover:underline"
                onClick={() => switchMode("phone")}
              >
                Use OTP login
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="relative size-14">
          <div className="absolute inset-0 rounded-full border-2 border-brand/20 border-t-brand animate-spin" />
          <div className="absolute inset-3 rounded-full bg-brand/10 animate-pulse" />
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
