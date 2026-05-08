"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  markOrderPostUpsellMessageSent,
  updateOrderPostUpsellPoints,
} from "@/app/(admin)/admin/actions";
import { ORDER_POST_UPSELL_STATUS } from "@/lib/constants/commerce";
import { useAdminToast } from "@/components/admin/admin-toast-provider";

type Props = {
  orderId: string;
  fulfillmentStatus: string;
  initialPoints: string;
  initialStatus: string;
  initialFlowStartedAt: string | null;
  initialMessage1SentAt: string | null;
  initialMessage2SentAt: string | null;
};

function formatRemaining(ms: number): string {
  const clamped = Math.max(0, ms);
  const totalSeconds = Math.floor(clamped / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

function formatShortTs(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OrderPostUpsellControls({
  orderId,
  fulfillmentStatus,
  initialPoints,
  initialStatus,
  initialFlowStartedAt,
  initialMessage1SentAt,
  initialMessage2SentAt,
}: Props) {
  const [points, setPoints] = useState(initialPoints);
  const [status, setStatus] = useState(initialStatus || ORDER_POST_UPSELL_STATUS.PENDING);
  const [flowStartedAt, setFlowStartedAt] = useState(initialFlowStartedAt);
  const [message1SentAt, setMessage1SentAt] = useState(initialMessage1SentAt);
  const [message2SentAt, setMessage2SentAt] = useState(initialMessage2SentAt);
  const [nowTs, setNowTs] = useState(Date.now());
  const [errorMsg, setErrorMsg] = useState("");
  const [pending, startTransition] = useTransition();
  const toast = useAdminToast();

  useEffect(() => {
    const id = window.setInterval(() => setNowTs(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  function runTask(fn: () => Promise<void>) {
    const toastId = toast.showLoading("Processing...");
    startTransition(async () => {
      try {
        setErrorMsg("");
        await fn();
        toast.success("Saved successfully.", toastId);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Could not save.";
        setErrorMsg(msg);
        toast.error(msg, toastId);
      }
    });
  }

  const deliveryDone = fulfillmentStatus === "delivered";

  // Step completion states
  const pointsSaved = points.trim().length > 0;
  const step1Done = status !== ORDER_POST_UPSELL_STATUS.PENDING && pointsSaved;
  const step2Done =
    status === ORDER_POST_UPSELL_STATUS.MESSAGE_1_SENT ||
    status === ORDER_POST_UPSELL_STATUS.MESSAGE_2_SENT;
  const step3Done = status === ORDER_POST_UPSELL_STATUS.MESSAGE_2_SENT;

  // Message 1 timer: 6h after flow_started_at (set when Step 1 saved)
  const message1AllowedAt = useMemo(() => {
    if (!flowStartedAt) return null;
    const t = new Date(flowStartedAt).getTime();
    return Number.isNaN(t) ? null : t + 6 * 60 * 60 * 1000;
  }, [flowStartedAt]);
  const remainingForMessage1Ms =
    message1AllowedAt == null ? null : Math.max(0, message1AllowedAt - nowTs);
  const canTagMessage1 = remainingForMessage1Ms != null && remainingForMessage1Ms <= 0;

  // Message 2 timer: 24h after message_1_sent_at
  const message2AllowedAt = useMemo(() => {
    if (!message1SentAt) return null;
    const t = new Date(message1SentAt).getTime();
    return Number.isNaN(t) ? null : t + 24 * 60 * 60 * 1000;
  }, [message1SentAt]);
  const remainingForMessage2Ms =
    message2AllowedAt == null ? null : Math.max(0, message2AllowedAt - nowTs);
  const canTagMessage2 = remainingForMessage2Ms != null && remainingForMessage2Ms <= 0;

  return (
    <div className="space-y-1.5">
      {/* ── Step 1: Add kundli points ─────────────────────────────── */}
      <div
        className={`rounded-lg border px-3 py-2.5 ${
          step1Done
            ? "border-emerald-500/30 bg-emerald-500/5"
            : "border-blue-500/30 bg-blue-500/5"
        }`}
      >
        <div className="flex items-start gap-2">
          <span
            className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
              step1Done
                ? "bg-emerald-500 text-white"
                : "bg-blue-500 text-white"
            }`}
          >
            {step1Done ? "✓" : "1"}
          </span>
          <div className="flex-1 space-y-1.5">
            <p className={`text-[11px] font-semibold ${step1Done ? "text-emerald-700 dark:text-emerald-300" : "text-blue-800 dark:text-blue-200"}`}>
              Add kundli negative points
              {step1Done && flowStartedAt && (
                <span className="ml-1.5 font-normal text-muted-foreground">
                  · timer started {formatShortTs(flowStartedAt)}
                </span>
              )}
            </p>
            <input
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              disabled={pending}
              placeholder="e.g. Mangal dosh, Shani effect"
              className="h-7 w-full max-w-xs rounded-md border border-border bg-background px-2 text-[11px] outline-none focus:ring-1 focus:ring-ring/50 disabled:opacity-50"
            />
            {!step1Done && (
              <div className="flex items-center gap-2">
                {!deliveryDone && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400">
                    ⚠ Waiting for delivery confirmation
                  </span>
                )}
                <button
                  type="button"
                  disabled={pending || !pointsSaved || !deliveryDone}
                  onClick={() =>
                    runTask(async () => {
                      const result = await updateOrderPostUpsellPoints(orderId, points);
                      setStatus(ORDER_POST_UPSELL_STATUS.STEP_1_DONE);
                      if (result.flowStartedAt) setFlowStartedAt(result.flowStartedAt);
                    })
                  }
                  className="h-7 rounded-md border border-blue-600/40 bg-blue-600 px-3 text-[11px] font-semibold text-white disabled:opacity-40"
                >
                  {pending ? "Saving…" : "Save Step 1"}
                </button>
              </div>
            )}
            {step1Done && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  Points: {points || "—"}
                </span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    runTask(async () => {
                      const result = await updateOrderPostUpsellPoints(orderId, points);
                      if (result.flowStartedAt) setFlowStartedAt(result.flowStartedAt);
                    })
                  }
                  className="h-6 rounded border border-border px-2 text-[10px] text-muted-foreground hover:bg-muted/50 disabled:opacity-40"
                >
                  Update points
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Step 2: Message 1 ─────────────────────────────────────── */}
      <div
        className={`rounded-lg border px-3 py-2.5 ${
          step2Done
            ? "border-emerald-500/30 bg-emerald-500/5"
            : step1Done
              ? "border-amber-500/30 bg-amber-500/5"
              : "border-border/50 bg-muted/10"
        }`}
      >
        <div className="flex items-start gap-2">
          <span
            className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
              step2Done
                ? "bg-emerald-500 text-white"
                : step1Done
                  ? "bg-amber-500 text-white"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {step2Done ? "✓" : "2"}
          </span>
          <div className="flex-1 space-y-1">
            <p className={`text-[11px] font-semibold ${
              step2Done
                ? "text-emerald-700 dark:text-emerald-300"
                : step1Done
                  ? "text-amber-800 dark:text-amber-200"
                  : "text-muted-foreground"
            }`}>
              Send Message 1
              {step2Done && message1SentAt && (
                <span className="ml-1.5 font-normal text-muted-foreground">
                  · sent {formatShortTs(message1SentAt)}
                </span>
              )}
            </p>

            {step1Done && !step2Done && (
              <>
                {remainingForMessage1Ms != null && remainingForMessage1Ms > 0 ? (
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex size-2 shrink-0">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-70" />
                      <span className="relative inline-flex size-2 rounded-full bg-amber-500" />
                    </span>
                    <p className="text-[12px] font-bold tabular-nums text-amber-700 dark:text-amber-300">
                      {formatRemaining(remainingForMessage1Ms)} remaining
                    </p>
                    <span className="text-[10px] text-muted-foreground">(6h from delivery)</span>
                  </div>
                ) : remainingForMessage1Ms === null ? (
                  <span className="text-[10px] text-muted-foreground">Waiting for Step 1…</span>
                ) : (
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    ✓ 6 hours completed — ready to send
                  </span>
                )}
                <button
                  type="button"
                  disabled={pending || !canTagMessage1}
                  onClick={() =>
                    runTask(async () => {
                      await markOrderPostUpsellMessageSent(orderId, "message_1");
                      setStatus(ORDER_POST_UPSELL_STATUS.MESSAGE_1_SENT);
                      const now = new Date().toISOString();
                      setMessage1SentAt(now);
                    })
                  }
                  className="mt-1 h-7 rounded-md border border-emerald-600/40 bg-emerald-600 px-3 text-[11px] font-semibold text-white disabled:opacity-40"
                >
                  {pending ? "Saving…" : "Tag Message 1 Sent"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Step 3: Message 2 ─────────────────────────────────────── */}
      <div
        className={`rounded-lg border px-3 py-2.5 ${
          step3Done
            ? "border-emerald-500/30 bg-emerald-500/5"
            : step2Done
              ? "border-amber-500/30 bg-amber-500/5"
              : "border-border/50 bg-muted/10"
        }`}
      >
        <div className="flex items-start gap-2">
          <span
            className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
              step3Done
                ? "bg-emerald-500 text-white"
                : step2Done
                  ? "bg-amber-500 text-white"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {step3Done ? "✓" : "3"}
          </span>
          <div className="flex-1 space-y-1">
            <p className={`text-[11px] font-semibold ${
              step3Done
                ? "text-emerald-700 dark:text-emerald-300"
                : step2Done
                  ? "text-amber-800 dark:text-amber-200"
                  : "text-muted-foreground"
            }`}>
              Send Message 2
              {step3Done && message2SentAt && (
                <span className="ml-1.5 font-normal text-muted-foreground">
                  · sent {formatShortTs(message2SentAt)}
                </span>
              )}
            </p>

            {step2Done && !step3Done && (
              <>
                {remainingForMessage2Ms != null && remainingForMessage2Ms > 0 ? (
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex size-2 shrink-0">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-70" />
                      <span className="relative inline-flex size-2 rounded-full bg-amber-500" />
                    </span>
                    <p className="text-[12px] font-bold tabular-nums text-amber-700 dark:text-amber-300">
                      {formatRemaining(remainingForMessage2Ms)} remaining
                    </p>
                    <span className="text-[10px] text-muted-foreground">(24h from msg 1)</span>
                  </div>
                ) : (
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    ✓ 24 hours completed — ready to send
                  </span>
                )}
                <button
                  type="button"
                  disabled={pending || !canTagMessage2}
                  onClick={() =>
                    runTask(async () => {
                      await markOrderPostUpsellMessageSent(orderId, "message_2");
                      setStatus(ORDER_POST_UPSELL_STATUS.MESSAGE_2_SENT);
                      setMessage2SentAt(new Date().toISOString());
                    })
                  }
                  className="mt-1 h-7 rounded-md border border-emerald-600/40 bg-emerald-600 px-3 text-[11px] font-semibold text-white disabled:opacity-40"
                >
                  {pending ? "Saving…" : "Tag Message 2 Sent"}
                </button>
              </>
            )}

            {step3Done && (
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                Flow complete
              </span>
            )}
          </div>
        </div>
      </div>

      {errorMsg && (
        <p className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
