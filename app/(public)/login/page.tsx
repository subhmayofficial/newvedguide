"use client";

export const dynamic = "force-dynamic";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { safeAuthRedirect } from "@/lib/auth/safe-redirect";
import { cn } from "@/lib/utils";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

// ─── Google Icon ──────────────────────────────────────────────────────────────
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

// ─── OTP Box ──────────────────────────────────────────────────────────────────
function OtpBoxInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);

  function get(i: number) { return ref.current?.querySelectorAll("input")[i] ?? null; }

  function handleKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !value[i] && i > 0) get(i - 1)?.focus();
  }

  function handleChange(i: number, char: string) {
    const d = char.replace(/\D/g, "").slice(-1);
    const arr = value.padEnd(6, " ").split("");
    arr[i] = d || " ";
    const next = arr.join("").trimEnd().slice(0, 6);
    onChange(next);
    if (d && i < 5) setTimeout(() => get(i + 1)?.focus(), 0);
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const p = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(p);
    setTimeout(() => get(Math.min(p.length, 5))?.focus(), 0);
  }

  return (
    <div ref={ref} className="flex gap-2 justify-center" onPaste={handlePaste}>
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          type="text" inputMode="numeric" maxLength={1}
          value={(value[i] ?? "").trim()}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          className={cn(
            "size-12 rounded-xl border-2 text-center text-lg font-bold tabular-nums outline-none transition-all bg-gray-50 text-gray-900",
            "focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10",
            (value[i] ?? "").trim() ? "border-brand/60 bg-white" : "border-gray-200"
          )}
          aria-label={`OTP digit ${i + 1}`}
          autoComplete={i === 0 ? "one-time-code" : "off"}
        />
      ))}
    </div>
  );
}

// ─── Resend ───────────────────────────────────────────────────────────────────
function ResendButton({ onResend }: { onResend: () => Promise<void> }) {
  const [sec, setSec] = useState(30);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (sec <= 0) return;
    const id = setTimeout(() => setSec((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [sec]);

  async function handle() {
    setBusy(true);
    await onResend();
    setBusy(false);
    setSec(30);
  }

  if (sec > 0) return (
    <p className="text-center text-sm text-gray-400">
      Resend in <span className="font-semibold tabular-nums text-gray-700">{sec}s</span>
    </p>
  );
  return (
    <button type="button" disabled={busy} onClick={handle}
      className="w-full text-center text-sm font-semibold text-brand underline-offset-2 hover:underline disabled:opacity-50">
      {busy ? "Sending…" : "Resend code"}
    </button>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────
type PhoneStep = "send" | "code";

function LoginForm() {
  const searchParams = useSearchParams();
  const redirect = useMemo(
    () => safeAuthRedirect(searchParams.get("redirect")),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParams.get("redirect")]
  );
  const oauthError = searchParams.get("error") === "oauth";

  // ── Auth guard ────────────────────────────────────────────
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!cancelled && session) { window.location.assign(redirect); return; }
      } catch { /* keep page usable */ }
      finally { if (!cancelled) setChecking(false); }
    })();
    return () => { cancelled = true; };
  }, [redirect]);

  // ── State ─────────────────────────────────────────────────
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [phoneStep, setPhoneStep] = useState<PhoneStep>("send");
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [whatsappConsent, setWhatsappConsent] = useState(false);
  const [error, setError] = useState(oauthError ? "Google sign-in failed. Please try again." : "");

  const phoneDigits = phone.replace(/\D/g, "").slice(-10);
  const phoneValid  = phoneDigits.length === 10;

  // ── Google OAuth ──────────────────────────────────────────
  async function handleGoogleLogin() {
    setGoogleLoading(true);
    setError("");
    const supabase = createClient();
    const { error: e } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirect)}`,
      },
    });
    if (e) { setError("Could not start Google sign-in. Please try again."); setGoogleLoading(false); }
    // On success browser navigates away — loading stays true intentionally
  }

  // ── WhatsApp OTP: send ────────────────────────────────────
  const sendOtp = useCallback(async () => {
    setError("");
    setPhoneLoading(true);
    try {
      const res = await fetch("/api/auth/phone-otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneDigits, consent: true }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; hint?: string };
      if (!res.ok) {
        setError(data.error || "Could not send code. Try again.");
        return;
      }
      setPhoneStep("code");
      setOtp("");
    } finally {
      setPhoneLoading(false);
    }
  }, [phoneDigits]);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!whatsappConsent) { setError("Please agree to receive your login code on WhatsApp."); return; }
    await sendOtp();
  }

  // ── WhatsApp OTP: verify ──────────────────────────────────
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPhoneLoading(true);
    try {
      const res = await fetch("/api/auth/phone-otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          phone: phoneDigits,
          code: otp.replace(/\D/g, ""),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) { setError(data.error || "Incorrect code. Try again."); return; }
      window.location.assign(redirect);
    } finally {
      setPhoneLoading(false);
    }
  }

  // ── Session check guard ───────────────────────────────────
  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="size-10 rounded-full border-2 border-gray-100 border-t-brand animate-spin" />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // OTP Verify screen
  // ═══════════════════════════════════════════════════════════
  if (phoneStep === "code") {
    return (
      <div className="min-h-screen bg-white flex flex-col px-6 pt-6 pb-10">
        <button type="button"
          className="mb-8 flex w-fit items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
          onClick={() => { setPhoneStep("send"); setError(""); setOtp(""); }}>
          <ArrowLeft className="size-4" /> Back
        </button>

        <div className="flex flex-1 flex-col justify-center max-w-sm mx-auto w-full">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 size-16 rounded-full bg-green-50 flex items-center justify-center">
              <span className="text-3xl">💬</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Check WhatsApp</h2>
            <p className="mt-1.5 text-sm text-gray-400">
              Enter the 6-digit code sent to{" "}
              <span className="font-semibold text-gray-700">
                +91 {phoneDigits.replace(/(\d{5})(\d{5})/, "$1 $2")}
              </span>
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <OtpBoxInput value={otp} onChange={setOtp} />
            <button type="submit"
              disabled={phoneLoading || otp.length !== 6}
              className={cn(
                "w-full h-14 rounded-2xl text-sm font-semibold transition-all",
                otp.length === 6
                  ? "bg-brand text-white shadow-md shadow-brand/20 hover:bg-brand-hover active:scale-[0.98]"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              )}>
              {phoneLoading ? "Verifying…" : "Verify & Continue"}
            </button>
          </form>

          <div className="mt-5"><ResendButton onResend={sendOtp} /></div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // Main login screen
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-white flex flex-col px-6 pt-6 pb-10">
      <div className="flex flex-1 flex-col justify-center max-w-sm mx-auto w-full">

        {/* ── Logo ─────────────────────────────────────────── */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 size-24 rounded-full overflow-hidden flex items-center justify-center">
            <Image
              src="/assets/logo.webp"
              alt="VedGuide"
              width={96}
              height={96}
              className="size-full object-cover"
              priority
            />
          </div>
          <h1 className="text-[2rem] font-bold tracking-tight text-gray-900 leading-none">
            VedGuide
          </h1>
        </div>

        {/* ── Divider ───────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-gray-200"/>
          <span className="text-sm text-gray-500 whitespace-nowrap select-none">Login or sign up</span>
          <div className="flex-1 h-px bg-gray-200"/>
        </div>

        {/* ── Error ─────────────────────────────────────────── */}
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* ── Phone form ────────────────────────────────────── */}
        <form onSubmit={handleSendOtp} className="space-y-3 mb-3">
          {/* Phone input */}
          <div className={cn(
            "flex h-14 rounded-2xl border bg-white overflow-hidden transition-all",
            "border-gray-200 focus-within:border-gray-400 focus-within:ring-4 focus-within:ring-gray-100"
          )}>
            <button type="button"
              className="flex shrink-0 items-center gap-1 border-r border-gray-200 px-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              aria-label="Country code">
              🇮🇳
              <svg className="size-3 text-gray-400 mt-0.5" viewBox="0 0 12 12" fill="currentColor">
                <path d="M6 8L1 3h10L6 8z"/>
              </svg>
            </button>
            <div className="flex flex-1 items-center gap-2 px-3.5">
              <span className="text-sm font-medium text-gray-500 shrink-0">+91</span>
              <input
                type="tel" inputMode="numeric" autoComplete="tel"
                placeholder="Enter Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none"
              />
            </div>
          </div>

          {/* WhatsApp consent — appears when 10 digits entered */}
          {phoneValid && (
            <label className="flex cursor-pointer items-start gap-2.5 px-0.5">
              <div className="relative mt-0.5 shrink-0">
                <input type="checkbox" className="sr-only"
                  checked={whatsappConsent}
                  onChange={(e) => setWhatsappConsent(e.target.checked)}/>
                <div className={cn(
                  "flex size-5 items-center justify-center rounded-md border-2 transition-all",
                  whatsappConsent ? "border-brand bg-brand" : "border-gray-300 bg-white"
                )}>
                  {whatsappConsent && <CheckCircle2 className="size-3.5 text-white"/>}
                </div>
              </div>
              <span className="text-xs leading-relaxed text-gray-400">
                I agree to receive my login code on{" "}
                <span className="font-medium text-gray-600">WhatsApp</span>.
              </span>
            </label>
          )}

          {/* Continue */}
          <button type="submit"
            disabled={phoneLoading || !phoneValid}
            className={cn(
              "w-full h-14 rounded-2xl text-sm font-semibold transition-all",
              phoneValid
                ? "bg-brand text-white shadow-md shadow-brand/20 hover:bg-brand-hover active:scale-[0.98]"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            )}>
            {phoneLoading ? "Sending on WhatsApp…" : "Continue"}
          </button>
        </form>

        {/* ── or ────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 my-3">
          <div className="flex-1 h-px bg-gray-200"/>
          <span className="text-xs text-gray-400 select-none">or</span>
          <div className="flex-1 h-px bg-gray-200"/>
        </div>

        {/* ── Google ────────────────────────────────────────── */}
        <button type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="w-full h-14 flex items-center justify-center gap-3 rounded-2xl border-2 border-gray-200 bg-white text-sm font-semibold text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98] disabled:opacity-60">
          {googleLoading
            ? <div className="size-5 rounded-full border-2 border-gray-200 border-t-gray-500 animate-spin"/>
            : <GoogleIcon className="size-5 shrink-0"/>}
          {googleLoading ? "Redirecting to Google…" : "Continue with Google"}
        </button>

        {/* ── Terms ─────────────────────────────────────────── */}
        <p className="mt-8 text-center text-xs leading-relaxed text-gray-400">
          By signing up, you agree to our{" "}
          <Link href="/terms"
            className="text-gray-500 underline underline-offset-2 hover:text-gray-800 transition-colors">
            Terms of Use
          </Link>
          {" "}&amp;{" "}
          <Link href="/privacy"
            className="text-gray-500 underline underline-offset-2 hover:text-gray-800 transition-colors">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="size-10 rounded-full border-2 border-gray-100 border-t-brand animate-spin"/>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
