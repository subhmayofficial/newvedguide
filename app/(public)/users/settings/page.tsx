"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function UserSettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const supabase = createClient();
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? "");
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle();
      setDisplayName(profile?.display_name ?? "");
      setLoading(false);
    })();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from("user_profiles")
      .update({
        display_name: displayName.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Saved.");
      router.refresh();
    }
    setSaving(false);
  }

  if (loading) {
    return <div className="mx-auto max-w-sm px-4 py-16 text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <Link
        href="/user"
        className="text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        ← Account
      </Link>
      <h1 className="mt-4 font-heading text-3xl font-semibold">Settings</h1>

      <form
        onSubmit={save}
        className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm"
      >
        {message && (
          <p className="text-sm text-muted-foreground">{message}</p>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="settings-email">Email</Label>
          <Input id="settings-email" type="email" value={email} disabled />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="settings-name">Display name</Label>
          <Input
            id="settings-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
        <Button
          type="submit"
          className="w-full rounded-xl bg-brand font-semibold"
          disabled={saving}
        >
          {saving ? "Saving…" : "Save"}
        </Button>
      </form>
    </div>
  );
}
