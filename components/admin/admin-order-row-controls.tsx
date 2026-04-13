"use client";

import { useTransition } from "react";
import {
  updateOrderAssigneeFromList,
  updateOrderFulfillmentFromList,
} from "@/app/(admin)/admin/actions";
import { FULFILLMENT_STATUS, ORDER_FULFILLMENT_ASSIGNEES } from "@/lib/constants/commerce";

const FULFILLMENT_OPTIONS = Object.values(FULFILLMENT_STATUS);

function formatFulfillmentLabel(value: string) {
  return value.replace(/_/g, " ");
}

export function AdminOrderRowFulfillmentSelect({
  orderId,
  fulfillmentStatus,
}: {
  orderId: string;
  fulfillmentStatus: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      aria-label="Fulfillment status"
      className="max-w-[9.5rem] rounded-md border border-border bg-background px-2 py-1.5 text-xs capitalize disabled:opacity-50"
      value={fulfillmentStatus}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value;
        startTransition(async () => {
          await updateOrderFulfillmentFromList(orderId, next);
        });
      }}
    >
      {FULFILLMENT_OPTIONS.map((s) => (
        <option key={s} value={s}>
          {formatFulfillmentLabel(s)}
        </option>
      ))}
    </select>
  );
}

export function AdminOrderRowAssigneeSelect({
  orderId,
  assignee,
}: {
  orderId: string;
  assignee: string | null;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      aria-label="Assigned to"
      className="max-w-[9.5rem] rounded-md border border-border bg-background px-2 py-1.5 text-xs disabled:opacity-50"
      value={assignee ?? ""}
      disabled={pending}
      onChange={(e) => {
        startTransition(async () => {
          await updateOrderAssigneeFromList(orderId, e.target.value);
        });
      }}
    >
      <option value="">— Unassigned —</option>
      {ORDER_FULFILLMENT_ASSIGNEES.map((name) => (
        <option key={name} value={name}>
          {name}
        </option>
      ))}
    </select>
  );
}
