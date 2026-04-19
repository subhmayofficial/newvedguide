"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useFormStatus } from "react-dom";
import { CheckCircle2, Loader2, MessageCircle, Upload } from "lucide-react";
import { submitOrderInteraktDeliveryForm } from "@/app/(admin)/admin/actions";

type Props = {
  orderId: string;
  orderNumber: string;
  defaultCustomerName: string;
  phone: string | null;
  canDeliver: boolean;
  /** Bunny zone + CDN configured (upload disabled with hint if false). */
  bunnyReady: boolean;
};

function explainUploadError(raw: string): string {
  if (/unexpected end of form/i.test(raw)) {
    return [
      "The server received an incomplete file upload (multipart stream ended early).",
      "Common causes: PDF larger than the Server Action body limit—restart dev after setting experimental.serverActions.bodySizeLimit in next.config; unstable or slow network; tab closed during upload; proxy cutting large bodies.",
      "Try a smaller file or upload again on a stable connection.",
    ].join(" ");
  }
  return raw;
}

function PendingSync({ onChange }: { onChange: (pending: boolean) => void }) {
  const { pending } = useFormStatus();
  useEffect(() => {
    onChange(pending);
  }, [pending, onChange]);
  return null;
}

function DeliverFooter({
  onCancel,
  canSubmit,
}: {
  onCancel: () => void;
  canSubmit: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <div className="relative z-[2] flex justify-end gap-2 pt-1">
      <button
        type="button"
        onClick={() => {
          if (!pending) onCancel();
        }}
        disabled={pending}
        className="h-9 rounded-lg border border-border px-3 text-xs font-medium transition-opacity hover:bg-muted/50 disabled:pointer-events-none disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={pending || !canSubmit}
        className="inline-flex h-9 min-w-[8rem] items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:pointer-events-none disabled:opacity-80"
      >
        {pending ? (
          <>
            <Loader2 size={14} className="shrink-0 animate-spin" aria-hidden />
            Sending…
          </>
        ) : (
          "Send"
        )}
      </button>
    </div>
  );
}

export function OrderDeliverButton({
  orderId,
  orderNumber,
  defaultCustomerName,
  phone,
  canDeliver,
  bunnyReady,
}: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [sendPending, setSendPending] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState(defaultCustomerName);
  const [reportUrl, setReportUrl] = useState("");
  const titleId = useId();
  const descId = useId();
  const fileInputId = useId();

  const onPendingChange = useCallback((pending: boolean) => {
    setSendPending(pending);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setCustomerName(defaultCustomerName.trim() ? defaultCustomerName : "Customer");
    setReportUrl("");
    setUploadErr(null);
  }, [open, defaultCustomerName]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !sendPending && !uploadBusy) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, sendPending, uploadBusy]);

  const onFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      setUploadBusy(true);
      setUploadErr(null);
      const fd = new FormData();
      fd.set("file", file);
      try {
        const res = await fetch(
          `/api/admin/orders/${encodeURIComponent(orderId)}/kundli-report-upload`,
          {
            method: "POST",
            body: fd,
            credentials: "include",
          }
        );
        let data: { ok?: boolean; url?: string; error?: string };
        try {
          data = (await res.json()) as { ok?: boolean; url?: string; error?: string };
        } catch {
          setReportUrl("");
          setUploadErr(`Upload failed (${res.status}). Response was not JSON.`);
          return;
        }
        if (!res.ok || !data.ok) {
          setReportUrl("");
          setUploadErr(explainUploadError(data.error ?? `HTTP ${res.status}`));
        } else if (data.url) {
          setReportUrl(data.url);
          setUploadErr(null);
          setCustomerName(defaultCustomerName.trim() ? defaultCustomerName.trim() : "Customer");
        } else {
          setReportUrl("");
          setUploadErr("Upload succeeded but no URL was returned.");
        }
      } catch (err) {
        setReportUrl("");
        const fromError = err instanceof Error ? err.message.trim() : "";
        if (/unexpected end of form/i.test(fromError)) {
          setUploadErr(explainUploadError(fromError));
        } else {
          setUploadErr(
            fromError && fromError.length < 400
              ? fromError
              : "Could not reach the server for upload. Check network, sign-in session, and Bunny settings (BUNNY_STORAGE_API_KEY + Admin → Settings)."
          );
        }
      } finally {
        setUploadBusy(false);
      }
    },
    [orderId, defaultCustomerName]
  );

  const backdropBlocked = sendPending || uploadBusy;
  const canSubmitSend =
    customerName.trim().length > 0 &&
    reportUrl.trim().length > 0 &&
    /^https?:\/\//i.test(reportUrl.trim());

  if (!canDeliver) {
    return (
      <span
        className="inline-block text-[10px] text-muted-foreground/40"
        title="Deliver: paid Kundli orders with a valid customer phone only"
      >
        —
      </span>
    );
  }

  const modal =
    open &&
    mounted &&
    createPortal(
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6">
        <button
          type="button"
          aria-label="Close delivery dialog"
          disabled={backdropBlocked}
          className="absolute inset-0 z-0 bg-black/55 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200 disabled:cursor-not-allowed"
          onClick={() => {
            if (!backdropBlocked) setOpen(false);
          }}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descId}
          className="relative z-[1] w-full max-w-[440px] origin-center overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-2xl shadow-black/25 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-200"
        >
          <div className="border-b border-border px-4 py-3">
            <h2 id={titleId} className="text-sm font-semibold tracking-tight">
              Deliver report
            </h2>
            <p id={descId} className="mt-0.5 text-[11px] text-muted-foreground">
              Order <span className="font-mono">{orderNumber}</span>
              {phone ? (
                <>
                  {" "}
                  · <span className="font-mono">{phone}</span>
                </>
              ) : null}
            </p>
          </div>

          <div className="grid gap-3 px-4 py-4">
            <div className="relative z-[2] rounded-xl border border-border/80 bg-muted/25 px-3 py-3">
              <p className="text-[11px] font-medium text-foreground">1. Upload report</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                PDF or image — link fills automatically below.
              </p>
              <input
                id={fileInputId}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
                className="sr-only"
                tabIndex={-1}
                disabled={!bunnyReady || uploadBusy || sendPending}
                onChange={onFileChange}
              />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <label
                  htmlFor={fileInputId}
                  className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-amber-600/45 bg-amber-500/10 px-3 text-[11px] font-semibold text-amber-950 transition hover:bg-amber-500/18 dark:border-amber-500/35 dark:bg-amber-950/35 dark:text-amber-100 ${
                    !bunnyReady || uploadBusy || sendPending ? "pointer-events-none opacity-45" : ""
                  }`}
                >
                  {uploadBusy ? (
                    <>
                      <Loader2 size={13} className="animate-spin" aria-hidden />
                      Uploading…
                    </>
                  ) : (
                    <>
                      <Upload size={13} aria-hidden />
                      Choose file
                    </>
                  )}
                </label>
                {reportUrl ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 size={12} aria-hidden />
                    Ready
                  </span>
                ) : null}
              </div>
              {!bunnyReady && (
                <p className="mt-2 text-[10px] text-amber-800 dark:text-amber-200">
                  Set Bunny storage zone + CDN URL in Settings (and{" "}
                  <span className="font-mono">BUNNY_STORAGE_API_KEY</span> in env) — or paste a report
                  URL manually.
                </p>
              )}
              {uploadErr ? (
                <p className="mt-2 text-[10px] leading-snug text-red-600 dark:text-red-400">{uploadErr}</p>
              ) : null}
            </div>

            <form action={submitOrderInteraktDeliveryForm} className="grid gap-3">
              <PendingSync onChange={onPendingChange} />
              <input type="hidden" name="orderId" value={orderId} />
              <label className="relative z-[2] grid gap-1 text-xs text-muted-foreground">
                <span className="font-medium">2. Name (WhatsApp template)</span>
                <input
                  name="customerName"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  disabled={sendPending}
                  className="h-10 rounded-lg border border-input bg-background px-3 text-sm transition-shadow disabled:opacity-60 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                />
              </label>
              <label className="relative z-[2] grid gap-1 text-xs text-muted-foreground">
                <span className="font-medium">3. Report URL</span>
                <input
                  name="reportUrl"
                  type="url"
                  required
                  value={reportUrl}
                  onChange={(e) => setReportUrl(e.target.value)}
                  disabled={sendPending}
                  placeholder="https://… (filled after upload or paste)"
                  className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-mono transition-shadow disabled:opacity-60 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                />
              </label>
              <p className="relative z-[2] text-[10px] text-muted-foreground">
                Interakt template is under <span className="font-medium text-foreground">Settings</span>.
                Send marks fulfillment <span className="font-medium text-foreground">Delivered</span>.
              </p>
              <DeliverFooter onCancel={() => setOpen(false)} canSubmit={canSubmitSend} />
            </form>
          </div>
        </div>
      </div>,
      document.body
    );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-8 origin-center items-center gap-1 rounded-md border border-emerald-600/40 bg-emerald-600/10 px-2.5 text-[11px] font-semibold text-emerald-800 transition-[transform,box-shadow,background-color] hover:bg-emerald-600/20 active:scale-[0.97] dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300"
        title="Upload report and send delivery WhatsApp"
      >
        <MessageCircle size={12} className="shrink-0" aria-hidden />
        Deliver
      </button>
      {modal}
    </>
  );
}
