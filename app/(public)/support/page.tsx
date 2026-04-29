"use client";

import { useState } from "react";

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  subject: string;
  problem: string;
};

const initialState: FormState = {
  fullName: "",
  email: "",
  phone: "",
  subject: "",
  problem: "",
};

export default function SupportPage() {
  const [form, setForm] = useState<FormState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(payload.error ?? "Unable to submit request.");
        return;
      }
      setSuccess("Your request has been submitted. Our team will get back to you shortly.");
      setForm(initialState);
    } catch {
      setError("Network issue. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:py-20">
      <h1 className="font-heading text-3xl font-black text-foreground sm:text-4xl">Support</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Facing any issue? Share your problem and our team will help you quickly.
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-8 space-y-4 rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name *">
            <input
              value={form.fullName}
              onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
              required
              className={inputCls}
              placeholder="Your full name"
            />
          </Field>
          <Field label="Email *">
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              required
              className={inputCls}
              placeholder="you@example.com"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone (optional)">
            <input
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              className={inputCls}
              placeholder="+91..."
            />
          </Field>
          <Field label="Subject *">
            <input
              value={form.subject}
              onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
              required
              className={inputCls}
              placeholder="Payment issue, report delay..."
            />
          </Field>
        </div>

        <Field label="Describe your problem *">
          <textarea
            value={form.problem}
            onChange={(e) => setForm((p) => ({ ...p, problem: e.target.value }))}
            required
            rows={7}
            className={`${inputCls} min-h-[170px] py-2`}
            placeholder="Please explain what happened, and what you expected."
          />
        </Field>

        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {success}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-11 items-center justify-center rounded-lg bg-brand px-5 text-sm font-semibold text-primary-foreground transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Submitting..." : "Submit problem"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm text-muted-foreground">
      <span className="font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-ring/60 focus:ring-1 focus:ring-ring/30";
