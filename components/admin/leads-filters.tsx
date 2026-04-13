"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const CHIPS = [
  { label: "Today", key: "preset", value: "today" },
  { label: "Last 7 days", key: "preset", value: "7d" },
  { label: "Free Kundli", key: "lead_type", value: "free_kundli" },
  { label: "Payment initiated", key: "lead_type", value: "payment_initiated" },
  { label: "Converted", key: "status", value: "converted" },
  { label: "No order", key: "has_order", value: "false" },
] as const;

export function LeadsFilters() {
  const router = useRouter();
  const sp = useSearchParams();
  const [pending, start] = useTransition();

  const setParam = useCallback(
    (key: string, value: string | null) => {
      start(() => {
        const n = new URLSearchParams(sp.toString());
        if (value === null || value === "") n.delete(key);
        else n.set(key, value);
        router.push(`/admindeoghar/leads?${n.toString()}`);
      });
    },
    [router, sp]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {CHIPS.map((c) => {
          const active = sp.get(c.key) === c.value;
          return (
            <button
              key={`${c.key}-${c.value}`}
              type="button"
              onClick={() =>
                setParam(c.key, active ? "" : c.value)
              }
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                active
                  ? "border-brand bg-brand/10 text-brand"
                  : "border-border bg-card text-muted-foreground hover:border-brand/40"
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const q = String(fd.get("q") ?? "");
          setParam("q", q || null);
        }}
      >
        <Input
          name="q"
          placeholder="Search name, phone, email…"
          defaultValue={sp.get("q") ?? ""}
          className="max-w-md"
        />
        <Button type="submit" variant="secondary" disabled={pending}>
          Search
        </Button>
      </form>
    </div>
  );
}
