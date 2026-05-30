"use client";

import { useState } from "react";
import { submitDeleteOrderForm } from "@/app/(admin)/admin/actions";

type Props = {
  orderId: string;
  orderNumber: string;
  compact?: boolean;
};

export function AdminDeleteOrderForm({ orderId, orderNumber, compact = false }: Props) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");

  const ready = confirm.trim() === orderNumber;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          compact
            ? "inline-flex h-8 items-center rounded-md border border-red-500/35 bg-red-500/10 px-2.5 text-[11px] font-semibold text-red-800 transition-colors hover:bg-red-500/20 dark:text-red-300"
            : "inline-flex h-9 items-center rounded-md border border-red-500/40 bg-red-500/10 px-3 text-[13px] font-semibold text-red-800 transition-colors hover:bg-red-500/15 dark:text-red-300"
        }
      >
        Delete
      </button>
    );
  }

  return (
    <form
      action={submitDeleteOrderForm}
      className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 space-y-3"
    >
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="returnTo" value={compact ? "orders" : "order_detail"} />
      <p className="text-[13px] font-semibold text-red-900 dark:text-red-200">
        Delete order permanently?
      </p>
      <p className="text-[12px] text-muted-foreground leading-relaxed">
        Removes order, line items, payments, and linked admin data. Events stay in logs but lose
        the order link. Type <span className="font-mono font-semibold text-foreground">{orderNumber}</span> to confirm.
      </p>
      <input
        name="confirmOrderNumber"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder={orderNumber}
        className="h-9 w-full rounded-md border border-border bg-background px-3 text-[13px] font-mono"
        autoComplete="off"
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={!ready}
          className="inline-flex h-9 items-center rounded-md bg-red-600 px-3 text-[13px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Delete order
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setConfirm("");
          }}
          className="inline-flex h-9 items-center rounded-md border border-border px-3 text-[13px] font-medium text-foreground"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
