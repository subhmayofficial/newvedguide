"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Send,
  User,
} from "lucide-react";
import { AccountSignOutButton } from "@/components/account/account-sign-out-button";
import { createClient } from "@/lib/supabase/client";
import { isPhoneOtpSyntheticEmail } from "@/lib/auth/phone-login-identity";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ─── helpers ─────────────────────────────────────────────────────────────────

function SectionCard({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 border-b border-border/40 px-4 py-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand/10">
          <Icon className="size-5 text-brand" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function PasswordInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={id}
        className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
      >
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "••••••••"}
          autoComplete={autoComplete}
          className="h-11 rounded-xl pr-10"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
          tabIndex={-1}
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────

export default function UserSettingsPage() {
  // ── profile state ──────────────────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [showEmailField, setShowEmailField] = useState(false);
  const [isPhoneUser, setIsPhoneUser] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);

  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState("");

  // ── change-password state ─────────────────────────────────────────────────
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState("");

  // ── forgot-password state ─────────────────────────────────────────────────
  const [resetSending, setResetSending] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState("");

  // ── password-recovery mode (user arrived from reset email link) ───────────
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [recoveryPw, setRecoveryPw] = useState("");
  const [recoveryConfirm, setRecoveryConfirm] = useState("");
  const [recoverySaving, setRecoverySaving] = useState(false);
  const [recoverySaved, setRecoverySaved] = useState(false);
  const [recoveryError, setRecoveryError] = useState("");

  const recoveryRef = useRef<HTMLDivElement>(null);

  // ── load user ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient();

    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const raw = user.email ?? "";
      const synthetic = isPhoneOtpSyntheticEmail(raw);
      setIsPhoneUser(synthetic);
      setShowEmailField(Boolean(raw && !synthetic));
      setEmail(synthetic ? "" : raw);

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle();
      setDisplayName(profile?.display_name ?? "");
      setLoading(false);
    })();

    // Listen for PASSWORD_RECOVERY event (user clicked reset-link from email)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setRecoveryMode(true);
        setTimeout(
          () => recoveryRef.current?.scrollIntoView({ behavior: "smooth" }),
          200
        );
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── profile save ────────────────────────────────────────────────────────────
  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSaved(false);
    setProfileError("");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error: err } = await supabase
      .from("user_profiles")
      .update({
        display_name: displayName.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    if (err) {
      setProfileError(err.message);
    } else {
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    }
    setProfileSaving(false);
  }

  // ── change password ─────────────────────────────────────────────────────────
  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    if (newPassword.length < 8) {
      setPwError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("Passwords don't match.");
      return;
    }
    setPwSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPwError(error.message);
    } else {
      setPwSaved(true);
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPwSaved(false), 4000);
    }
    setPwSaving(false);
  }

  // ── forgot password ────────────────────────────────────────────────────────
  async function sendResetEmail() {
    if (!email) return;
    setResetSending(true);
    setResetSent(false);
    setResetError("");
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/users/settings`,
    });
    if (error) {
      setResetError(error.message);
    } else {
      setResetSent(true);
    }
    setResetSending(false);
  }

  // ── recovery-mode save ─────────────────────────────────────────────────────
  async function saveRecoveryPassword(e: React.FormEvent) {
    e.preventDefault();
    setRecoveryError("");
    if (recoveryPw.length < 8) {
      setRecoveryError("Password must be at least 8 characters.");
      return;
    }
    if (recoveryPw !== recoveryConfirm) {
      setRecoveryError("Passwords don't match.");
      return;
    }
    setRecoverySaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: recoveryPw });
    if (error) {
      setRecoveryError(error.message);
    } else {
      setRecoverySaved(true);
      setRecoveryMode(false);
      setRecoveryPw("");
      setRecoveryConfirm("");
    }
    setRecoverySaving(false);
  }

  // ── loading skeleton ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="relative size-12">
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-brand/20 border-t-brand" />
          <div className="absolute inset-3 animate-pulse rounded-full bg-brand/10" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* ── Header ── */}
      <div className="sticky top-0 z-10 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link
            href="/profile"
            className="flex items-center justify-center rounded-xl p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="font-heading text-lg font-bold">Settings</h1>
        </div>
      </div>

      <div className="mx-auto max-w-lg space-y-4 px-4 py-6">

        {/* ══ 1. PASSWORD RECOVERY BANNER (shown only when user arrives via reset link) ══ */}
        {recoveryMode && (
          <div
            ref={recoveryRef}
            className="rounded-2xl border-2 border-brand/40 bg-brand/5 p-1 shadow-md"
          >
            <SectionCard
              icon={KeyRound}
              title="Set new password"
              subtitle="You arrived via a password reset link — set your new password below."
            >
              {recoverySaved ? (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/8 px-3 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="size-4 shrink-0" />
                  Password updated! You can now sign in with the new password.
                </div>
              ) : (
                <form onSubmit={saveRecoveryPassword} className="space-y-4">
                  {recoveryError && (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/8 px-3 py-2.5 text-sm text-destructive">
                      {recoveryError}
                    </div>
                  )}
                  <PasswordInput
                    id="recovery-pw"
                    label="New password"
                    value={recoveryPw}
                    onChange={setRecoveryPw}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                  />
                  <PasswordInput
                    id="recovery-confirm"
                    label="Confirm new password"
                    value={recoveryConfirm}
                    onChange={setRecoveryConfirm}
                    autoComplete="new-password"
                  />
                  <button
                    type="submit"
                    disabled={recoverySaving}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-white shadow-sm shadow-brand/20 hover:bg-brand-hover disabled:opacity-60"
                  >
                    {recoverySaving ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <KeyRound className="size-4" />
                    )}
                    {recoverySaving ? "Saving…" : "Save new password"}
                  </button>
                </form>
              )}
            </SectionCard>
          </div>
        )}

        {/* ══ 2. PROFILE ══ */}
        <SectionCard
          icon={User}
          title="Profile"
          subtitle="Your display information"
        >
          <form onSubmit={saveProfile} className="space-y-4">
            {profileError && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/8 px-3 py-2.5 text-sm text-destructive">
                {profileError}
              </div>
            )}
            {profileSaved && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/8 px-3 py-2.5 text-sm text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="size-4" />
                Saved successfully
              </div>
            )}
            {showEmailField && (
              <div className="space-y-1.5">
                <Label
                  htmlFor="settings-email"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Email address
                </Label>
                <Input
                  id="settings-email"
                  type="email"
                  value={email}
                  disabled
                  className="h-11 rounded-xl bg-muted/50 text-muted-foreground"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label
                htmlFor="settings-name"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Display name
              </Label>
              <Input
                id="settings-name"
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
            <button
              type="submit"
              disabled={profileSaving}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-white shadow-sm shadow-brand/20 hover:bg-brand-hover disabled:opacity-60"
            >
              {profileSaving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              {profileSaving ? "Saving…" : "Save changes"}
            </button>
          </form>
        </SectionCard>

        {/* ══ 3. CHANGE PASSWORD (email/Google users only) ══ */}
        {!isPhoneUser && (
          <SectionCard
            icon={Lock}
            title="Change password"
            subtitle="Set a new password for your account"
          >
            {pwSaved ? (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/8 px-3 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="size-4 shrink-0" />
                Password updated successfully!
              </div>
            ) : (
              <form onSubmit={changePassword} className="space-y-4">
                {pwError && (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/8 px-3 py-2.5 text-sm text-destructive">
                    {pwError}
                  </div>
                )}
                <PasswordInput
                  id="new-password"
                  label="New password"
                  value={newPassword}
                  onChange={setNewPassword}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                />
                <PasswordInput
                  id="confirm-password"
                  label="Confirm new password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  autoComplete="new-password"
                />
                <p className="text-xs text-muted-foreground">
                  Use at least 8 characters with a mix of letters and numbers.
                </p>
                <button
                  type="submit"
                  disabled={pwSaving || !newPassword || !confirmPassword}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-white shadow-sm shadow-brand/20 hover:bg-brand-hover disabled:opacity-60"
                >
                  {pwSaving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Lock className="size-4" />
                  )}
                  {pwSaving ? "Updating…" : "Update password"}
                </button>
              </form>
            )}
          </SectionCard>
        )}

        {/* ══ 4. FORGOT PASSWORD (email/Google users with a real email only) ══ */}
        {!isPhoneUser && email && (
          <SectionCard
            icon={Mail}
            title="Forgot password?"
            subtitle="We'll send a secure reset link to your email"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 px-3.5 py-3">
                <Mail className="size-4 shrink-0 text-muted-foreground" />
                <span className="text-sm text-foreground">{email}</span>
              </div>

              {resetSent ? (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/8 px-3 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="size-4 shrink-0" />
                  Reset link sent! Check your inbox (and spam folder).
                </div>
              ) : (
                <>
                  {resetError && (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/8 px-3 py-2.5 text-sm text-destructive">
                      {resetError}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={sendResetEmail}
                    disabled={resetSending}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-brand/40 bg-brand/8 text-sm font-semibold text-brand hover:bg-brand/15 disabled:opacity-60 transition"
                  >
                    {resetSending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Send className="size-4" />
                    )}
                    {resetSending ? "Sending…" : "Send password reset email"}
                  </button>
                  <p className="text-center text-xs text-muted-foreground">
                    You'll receive a link to reset your password. Click it to
                    be brought back here.
                  </p>
                </>
              )}
            </div>
          </SectionCard>
        )}

        {/* ══ Phone OTP note ══ */}
        {isPhoneUser && (
          <div className="rounded-2xl border border-border/40 bg-muted/30 px-4 py-3.5 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Signed in via WhatsApp</p>
            <p className="mt-0.5 text-xs">
              Your account uses WhatsApp OTP for authentication — no password
              required. To change your phone number, contact support.
            </p>
          </div>
        )}

        {/* ══ 5. SIGN OUT ══ */}
        <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
          <div className="border-b border-border/40 px-4 py-3">
            <p className="text-sm font-semibold text-foreground">Account</p>
          </div>
          <div className="p-4">
            <AccountSignOutButton
              className="w-full rounded-xl border border-destructive/30 bg-destructive/8 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/15"
              variant="outline"
              redirectTo="/login"
            />
          </div>
        </div>

      </div>
    </div>
  );
}
