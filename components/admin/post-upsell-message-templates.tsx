"use client";

import { useMemo, useState, useTransition } from "react";
import { savePostUpsellMessageTemplates } from "@/app/(admin)/admin/actions";
import { useAdminToast } from "@/components/admin/admin-toast-provider";

type Props = {
  initialMessage1: string;
  initialMessage2: string;
};

function fillTemplate(template: string, samplePoints: string): string {
  return template
    .replaceAll("{{name}}", "Customer")
    .replaceAll("{{points}}", samplePoints || "Mangal dosh, Shani effect");
}

export function PostUpsellMessageTemplates({
  initialMessage1,
  initialMessage2,
}: Props) {
  const [message1, setMessage1] = useState(initialMessage1);
  const [message2, setMessage2] = useState(initialMessage2);
  const [samplePoints, setSamplePoints] = useState("Mangal dosh, Shani effect");
  const [copied, setCopied] = useState<"" | "m1" | "m2">("");
  const [pending, startTransition] = useTransition();
  const toast = useAdminToast();

  const preview1 = useMemo(() => fillTemplate(message1, samplePoints), [message1, samplePoints]);
  const preview2 = useMemo(() => fillTemplate(message2, samplePoints), [message2, samplePoints]);

  async function copy(which: "m1" | "m2", value: string) {
    if (!value.trim()) return;
    await navigator.clipboard.writeText(value);
    setCopied(which);
    toast.success(which === "m1" ? "Message 1 copied." : "Message 2 copied.");
    window.setTimeout(() => setCopied(""), 1200);
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Upsell message templates</h2>
          <p className="text-xs text-muted-foreground">
            Same message for all rows. Use variables: {`{{name}}`} and {`{{points}}`}.
          </p>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const toastId = toast.showLoading("Saving templates...");
              try {
                await savePostUpsellMessageTemplates(message1, message2);
                toast.success("Templates saved.", toastId);
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed to save templates.", toastId);
              }
            })
          }
          className="h-8 rounded-md border border-blue-600/35 bg-blue-600/10 px-3 text-[11px] font-semibold text-blue-900 disabled:opacity-50 dark:text-blue-200"
        >
          {pending ? "Saving..." : "Save templates"}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className="text-[11px] text-muted-foreground">Preview points</label>
        <input
          value={samplePoints}
          onChange={(e) => setSamplePoints(e.target.value)}
          className="h-8 w-72 rounded-md border border-border bg-background px-2.5 text-[11px] outline-none focus:ring-1 focus:ring-ring/50"
        />
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-foreground">Message 1 template</p>
          <textarea
            rows={4}
            value={message1}
            onChange={(e) => setMessage1(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-2.5 py-2 text-[11px] outline-none focus:ring-1 focus:ring-ring/50"
          />
          <div className="rounded-md border border-border bg-muted/20 p-2 text-[11px] text-foreground">
            {preview1 || "Template preview appears here"}
          </div>
          <button
            type="button"
            onClick={() => copy("m1", preview1)}
            className="h-8 rounded-md border border-emerald-600/35 bg-emerald-600/10 px-2.5 text-[11px] font-semibold text-emerald-900 dark:text-emerald-200"
          >
            {copied === "m1" ? "Copied" : "Copy message 1"}
          </button>
        </div>

        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-foreground">Message 2 template</p>
          <textarea
            rows={4}
            value={message2}
            onChange={(e) => setMessage2(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-2.5 py-2 text-[11px] outline-none focus:ring-1 focus:ring-ring/50"
          />
          <div className="rounded-md border border-border bg-muted/20 p-2 text-[11px] text-foreground">
            {preview2 || "Template preview appears here"}
          </div>
          <button
            type="button"
            onClick={() => copy("m2", preview2)}
            className="h-8 rounded-md border border-emerald-600/35 bg-emerald-600/10 px-2.5 text-[11px] font-semibold text-emerald-900 dark:text-emerald-200"
          >
            {copied === "m2" ? "Copied" : "Copy message 2"}
          </button>
        </div>
      </div>
    </section>
  );
}
