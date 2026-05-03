"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, User } from "lucide-react";
import { AccountSignOutButton } from "@/components/account/account-sign-out-button";
import { createClient } from "@/lib/supabase/client";
import { isPhoneOtpSyntheticEmail } from "@/lib/auth/phone-login-identity";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function UserSettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [showEmailField, setShowEmailField] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const raw = user.email ?? "";
      const synthetic = isPhoneOtpSyntheticEmail(raw);
      setShowEmailField(Boolean(raw && !synthetic));
      setEmail(synthetic ? "" : raw);
      const { data: profile } = await supabase
        .from("user_profiles").select("display_name").eq("id", user.id).maybeSingle();
      setDisplayName(profile?.display_name ?? "");
      setLoading(false);
    })();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error: err } = await supabase
      .from("user_profiles")
      .update({ display_name: displayName.trim() || null, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    if (err) {
      setError(err.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      router.refresh();
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="relative size-12">
          <div className="absolute inset-0 rounded-full border-2 border-brand/20 border-t-brand animate-spin" />
          <div className="absolute inset-3 rounded-full bg-brand/10 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link href="/user" className="flex items-center justify-center rounded-xl p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="font-heading text-lg font-bold">Settings</h1>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 py-6 space-y-4">
        {/* Profile section */}
        <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 border-b border-border/40 px-4 py-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand/10">
              <User className="size-5 text-brand" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Profile</p>
              <p className="text-xs text-muted-foreground">Your display information</p>
            </div>
          </div>

          <form onSubmit={save} className="p-4 space-y-4">
            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/8 px-3 py-2.5 text-sm text-destructive">
                {error}
              </div>
            )}
            {saved && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/8 px-3 py-2.5 text-sm text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="size-4" />
                Saved successfully
              </div>
            )}

            {showEmailField && (
              <div className="space-y-1.5">
                <Label htmlFor="settings-email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
              <Label htmlFor="settings-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
              disabled={saving}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-white shadow-sm shadow-brand/20 hover:bg-brand-hover disabled:opacity-60"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              {saving ? "Saving…" : "Save changes"}
            </button>
          </form>
        </div>

        {/* Account section */}
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
