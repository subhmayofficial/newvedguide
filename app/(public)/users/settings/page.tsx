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

// ─── Password field with show/hide toggle ────────────────────────────────────
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
      <label
        htmlFor={id}
        className="block text-[11px] font-bold uppercase tracking-widest text-gray-400"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "••••••••"}
          autoComplete={autoComplete}
          className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 pr-10 text-[14px] text-gray-900 placeholder:text-gray-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
          tabIndex={-1}
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────
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
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3.5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gray-100">
          <Icon className="size-[18px] text-gray-500" />
        </div>
        <div>
          <p className="text-[14px] font-semibold text-gray-900">{title}</p>
          {subtitle && (
            <p className="text-[12px] text-gray-400">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// ─── Text input ───────────────────────────────────────────────────────────────
function TextInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  disabled,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-[11px] font-bold uppercase tracking-widest text-gray-400"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        placeholder={placeholder}
        disabled={disabled}
        className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 text-[14px] text-gray-900 placeholder:text-gray-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}

// ─── Alert banners ────────────────────────────────────────────────────────────
function SuccessBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-[13px] font-medium text-emerald-700">
      <CheckCircle2 className="size-4 shrink-0" />
      {children}
    </div>
  );
}

function ErrorBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-600">
      {children}
    </div>
  );
}

// ─── Primary button ───────────────────────────────────────────────────────────
function PrimaryButton({
  type = "button",
  disabled,
  loading,
  icon: Icon,
  children,
  onClick,
  variant = "solid",
}: {
  type?: "button" | "submit";
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ElementType;
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "solid" | "outline";
}) {
  const base =
    "flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[14px] font-semibold transition disabled:opacity-50";
  const solid =
    "bg-amber-400 text-gray-900 shadow-sm hover:bg-amber-500 active:scale-[0.98]";
  const outline =
    "border border-amber-400/60 bg-amber-50 text-amber-700 hover:bg-amber-100 active:scale-[0.98]";

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${base} ${variant === "solid" ? solid : outline}`}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : Icon ? (
        <Icon className="size-4" />
      ) : null}
      {children}
    </button>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function UserSettingsPage() {
  // profile
  const [email, setEmail]                   = useState("");
  const [showEmail, setShowEmail]           = useState(false);
  const [isPhoneUser, setIsPhoneUser]       = useState(false);
  const [displayName, setDisplayName]       = useState("");
  const [loading, setLoading]               = useState(true);
  const [profileSaving, setProfileSaving]   = useState(false);
  const [profileSaved, setProfileSaved]     = useState(false);
  const [profileError, setProfileError]     = useState("");

  // change password
  const [newPw, setNewPw]           = useState("");
  const [confirmPw, setConfirmPw]   = useState("");
  const [pwSaving, setPwSaving]     = useState(false);
  const [pwSaved, setPwSaved]       = useState(false);
  const [pwError, setPwError]       = useState("");

  // forgot password
  const [resetSending, setResetSending] = useState(false);
  const [resetSent, setResetSent]       = useState(false);
  const [resetError, setResetError]     = useState("");

  // recovery mode (user clicked email link)
  const [recoveryMode, setRecoveryMode]       = useState(false);
  const [recoveryPw, setRecoveryPw]           = useState("");
  const [recoveryConfirm, setRecoveryConfirm] = useState("");
  const [recoverySaving, setRecoverySaving]   = useState(false);
  const [recoverySaved, setRecoverySaved]     = useState(false);
  const [recoveryError, setRecoveryError]     = useState("");
  const recoveryRef = useRef<HTMLDivElement>(null);

  // ── load user ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient();
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const raw = user.email ?? "";
      const synthetic = isPhoneOtpSyntheticEmail(raw);
      setIsPhoneUser(synthetic);
      setShowEmail(Boolean(raw && !synthetic));
      setEmail(synthetic ? "" : raw);
      const { data: profile } = await supabase
        .from("user_profiles").select("display_name").eq("id", user.id).maybeSingle();
      setDisplayName(profile?.display_name ?? "");
      setLoading(false);
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setRecoveryMode(true);
        setTimeout(() => recoveryRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
      }
    });
    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── profile save ───────────────────────────────────────────────────────────
  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true); setProfileSaved(false); setProfileError("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("user_profiles")
      .update({ display_name: displayName.trim() || null, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    if (error) { setProfileError(error.message); }
    else { setProfileSaved(true); setTimeout(() => setProfileSaved(false), 3000); }
    setProfileSaving(false);
  }

  // ── change password ────────────────────────────────────────────────────────
  async function changePassword(e: React.FormEvent) {
    e.preventDefault(); setPwError("");
    if (newPw.length < 8) { setPwError("Password must be at least 8 characters."); return; }
    if (newPw !== confirmPw) { setPwError("Passwords don't match."); return; }
    setPwSaving(true);
    const { error } = await createClient().auth.updateUser({ password: newPw });
    if (error) { setPwError(error.message); }
    else { setPwSaved(true); setNewPw(""); setConfirmPw(""); setTimeout(() => setPwSaved(false), 4000); }
    setPwSaving(false);
  }

  // ── forgot password ────────────────────────────────────────────────────────
  async function sendReset() {
    setResetSending(true); setResetSent(false); setResetError("");
    const { error } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/users/settings`,
    });
    if (error) { setResetError(error.message); }
    else { setResetSent(true); }
    setResetSending(false);
  }

  // ── recovery save ──────────────────────────────────────────────────────────
  async function saveRecovery(e: React.FormEvent) {
    e.preventDefault(); setRecoveryError("");
    if (recoveryPw.length < 8) { setRecoveryError("Password must be at least 8 characters."); return; }
    if (recoveryPw !== recoveryConfirm) { setRecoveryError("Passwords don't match."); return; }
    setRecoverySaving(true);
    const { error } = await createClient().auth.updateUser({ password: recoveryPw });
    if (error) { setRecoveryError(error.message); }
    else { setRecoverySaved(true); setRecoveryMode(false); setRecoveryPw(""); setRecoveryConfirm(""); }
    setRecoverySaving(false);
  }

  // ── loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5]">
        <div className="relative size-12">
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-amber-200 border-t-amber-400" />
          <div className="absolute inset-3 animate-pulse rounded-full bg-amber-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-12">

      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-100 bg-white px-4 py-3.5">
        <Link
          href="/profile"
          className="flex size-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="flex-1 text-center pr-9 text-[17px] font-semibold text-gray-900">
          Settings
        </h1>
      </div>

      <div className="mx-auto max-w-lg space-y-4 px-4 py-5">

        {/* ══ RECOVERY BANNER (user arrived via reset-email link) ══ */}
        {recoveryMode && (
          <div ref={recoveryRef} className="overflow-hidden rounded-2xl border-2 border-amber-300 bg-white shadow-md">
            <div className="flex items-center gap-3 border-b border-amber-100 bg-amber-50 px-4 py-3.5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-100">
                <KeyRound className="size-[18px] text-amber-600" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-gray-900">Set new password</p>
                <p className="text-[12px] text-gray-500">You arrived via a reset link — set your new password below</p>
              </div>
            </div>
            <div className="p-4">
              {recoverySaved ? (
                <SuccessBanner>Password updated! You can now sign in with your new password.</SuccessBanner>
              ) : (
                <form onSubmit={saveRecovery} className="space-y-4">
                  {recoveryError && <ErrorBanner>{recoveryError}</ErrorBanner>}
                  <PasswordInput id="rec-pw" label="New password" value={recoveryPw} onChange={setRecoveryPw}
                    placeholder="At least 8 characters" autoComplete="new-password" />
                  <PasswordInput id="rec-confirm" label="Confirm new password" value={recoveryConfirm}
                    onChange={setRecoveryConfirm} autoComplete="new-password" />
                  <PrimaryButton type="submit" loading={recoverySaving} icon={KeyRound}>
                    {recoverySaving ? "Saving…" : "Save new password"}
                  </PrimaryButton>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ══ PROFILE ══ */}
        <SectionCard icon={User} title="Profile" subtitle="Your display information">
          <form onSubmit={saveProfile} className="space-y-4">
            {profileError && <ErrorBanner>{profileError}</ErrorBanner>}
            {profileSaved && <SuccessBanner>Saved successfully</SuccessBanner>}
            {showEmail && (
              <TextInput id="s-email" label="Email address" value={email} disabled type="email" />
            )}
            <TextInput
              id="s-name" label="Display name" value={displayName}
              onChange={setDisplayName} placeholder="Your name"
            />
            <PrimaryButton type="submit" loading={profileSaving}>
              {profileSaving ? "Saving…" : "Save changes"}
            </PrimaryButton>
          </form>
        </SectionCard>

        {/* ══ CHANGE PASSWORD ══ */}
        {!isPhoneUser && (
          <SectionCard icon={Lock} title="Change password" subtitle="Set a new password for your account">
            {pwSaved ? (
              <SuccessBanner>Password updated successfully!</SuccessBanner>
            ) : (
              <form onSubmit={changePassword} className="space-y-4">
                {pwError && <ErrorBanner>{pwError}</ErrorBanner>}
                <PasswordInput id="new-pw" label="New password" value={newPw} onChange={setNewPw}
                  placeholder="At least 8 characters" autoComplete="new-password" />
                <PasswordInput id="confirm-pw" label="Confirm new password" value={confirmPw}
                  onChange={setConfirmPw} autoComplete="new-password" />
                <p className="text-[12px] text-gray-400">
                  Use at least 8 characters with a mix of letters and numbers.
                </p>
                <PrimaryButton type="submit" loading={pwSaving} disabled={!newPw || !confirmPw} icon={Lock}>
                  {pwSaving ? "Updating…" : "Update password"}
                </PrimaryButton>
              </form>
            )}
          </SectionCard>
        )}

        {/* ══ FORGOT PASSWORD ══ */}
        {!isPhoneUser && email && (
          <SectionCard icon={Mail} title="Forgot password?" subtitle="We'll send a secure reset link to your email">
            <div className="space-y-4">
              {/* Email display row */}
              <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3.5 py-3">
                <Mail className="size-4 shrink-0 text-gray-400" />
                <span className="text-[13px] text-gray-700">{email}</span>
              </div>

              {resetSent ? (
                <SuccessBanner>Reset link sent! Check your inbox (and spam folder).</SuccessBanner>
              ) : (
                <>
                  {resetError && <ErrorBanner>{resetError}</ErrorBanner>}
                  <PrimaryButton variant="outline" loading={resetSending} icon={Send} onClick={sendReset}>
                    {resetSending ? "Sending…" : "Send password reset email"}
                  </PrimaryButton>
                  <p className="text-center text-[12px] text-gray-400">
                    You'll receive a link to reset your password. Clicking it brings you back here automatically.
                  </p>
                </>
              )}
            </div>
          </SectionCard>
        )}

        {/* ══ PHONE-OTP NOTE ══ */}
        {isPhoneUser && (
          <div className="rounded-2xl border border-gray-100 bg-white px-4 py-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gray-100">
                <KeyRound className="size-[18px] text-gray-500" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-gray-900">Signed in via WhatsApp</p>
                <p className="mt-0.5 text-[12px] text-gray-400">
                  Your account uses WhatsApp OTP — no password needed. To change your phone number, contact support.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ══ SIGN OUT ══ */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-4 py-3.5">
            <p className="text-[14px] font-semibold text-gray-900">Account</p>
          </div>
          <div className="p-4">
            <AccountSignOutButton
              className="w-full rounded-xl border border-red-200 bg-red-50 py-2.5 text-[14px] font-semibold text-red-600 hover:bg-red-100 transition"
              variant="outline"
              redirectTo="/login"
            />
          </div>
        </div>

      </div>
    </div>
  );
}
