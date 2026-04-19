"use client";

import { useEffect, useMemo, useState } from "react";
import { FULFILLMENT_STATUS } from "@/lib/constants/commerce";
import { slaDeadlineMs, slaWindowHours } from "@/lib/admin/order-sla-helpers";

function formatHms(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function OrderSlaCountdown({
  createdAtIso,
  productSlug,
  fulfillmentStatus,
  paymentStatus,
  orderStatus,
  hasFastTrackAddon = false,
  compact = false,
}: {
  createdAtIso: string;
  productSlug: string;
  fulfillmentStatus: string;
  paymentStatus: string;
  orderStatus: string;
  /** Paid kundli + FastTrack add-on: main row is still product_slug=paid-kundli; set from order_items. */
  hasFastTrackAddon?: boolean;
  /** Single-line layout for tight lists (e.g. dashboard). */
  compact?: boolean;
}) {
  const hours = slaWindowHours(productSlug, hasFastTrackAddon);
  const endMs = useMemo(
    () => slaDeadlineMs(createdAtIso, productSlug, hasFastTrackAddon),
    [createdAtIso, productSlug, hasFastTrackAddon]
  );

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (endMs === null) {
    return <span className="text-[11px] text-muted-foreground">—</span>;
  }

  if (fulfillmentStatus === FULFILLMENT_STATUS.DELIVERED) {
    return (
      <div className="leading-tight">
        <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Delivered</span>
        {!compact ? (
          <span className="mt-0.5 block text-[10px] text-muted-foreground">{hours}h SLA</span>
        ) : null}
      </div>
    );
  }

  const remainingSec = Math.floor((endMs - now) / 1000);
  const inactive = orderStatus === "cancelled" || paymentStatus === "failed";

  if (remainingSec > 0) {
    return (
      <div
        className={`leading-tight tabular-nums ${inactive ? "opacity-45" : ""}`}
        title={`${hours}h delivery window from order time`}
      >
        <span className="font-mono text-[12px] font-semibold text-foreground">{formatHms(remainingSec)}</span>
        {compact ? (
          <span className="ml-1 text-[10px] text-muted-foreground">{hours}h</span>
        ) : (
          <span className="mt-0.5 block text-[10px] text-muted-foreground">left · {hours}h SLA</span>
        )}
      </div>
    );
  }

  const overdueSec = Math.floor((now - endMs) / 1000);
  return (
    <div
      className={`leading-tight tabular-nums ${inactive ? "opacity-45" : ""}`}
      title={`${hours}h window ended ${formatHms(overdueSec)} ago`}
    >
      <span className="font-mono text-[12px] font-semibold text-red-600 dark:text-red-400">
        +{formatHms(overdueSec)}
      </span>
      {compact ? (
        <span className="ml-1 text-[10px] text-muted-foreground">over</span>
      ) : (
        <span className="mt-0.5 block text-[10px] text-muted-foreground">overdue · {hours}h SLA</span>
      )}
    </div>
  );
}
