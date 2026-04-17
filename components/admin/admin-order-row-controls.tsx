"use client";

import { useTransition } from "react";
import {
  updateOrderAssigneeFromList,
  updateOrderFulfillmentFromList,
} from "@/app/(admin)/admin/actions";
import { ORDER_FULFILLMENT_ASSIGNEES } from "@/lib/constants/commerce";
import {
  AdminStatusDropdown,
  type DropdownOption,
} from "@/components/admin/admin-status-dropdown";

// ─── Fulfillment options ──────────────────────────────────────────────────

const FULFILLMENT_OPTIONS: DropdownOption[] = [
  { value: "unfulfilled", label: "Unfulfilled", dotClass: "bg-zinc-300 dark:bg-zinc-600" },
  { value: "queued",      label: "Queued",      dotClass: "bg-blue-400" },
  { value: "in_progress", label: "In Progress", dotClass: "bg-amber-400" },
  { value: "delivered",   label: "Delivered",   dotClass: "bg-emerald-500" },
];

// ─── Assignee options ─────────────────────────────────────────────────────

const AVATAR_COLORS: Record<string, string> = {
  Ashu:   "bg-violet-500",
  Roshan: "bg-blue-500",
};

const ASSIGNEE_OPTIONS: DropdownOption[] = [
  {
    value: "",
    label: "Unassigned",
    dotClass: "bg-zinc-300 dark:bg-zinc-600",
  },
  ...ORDER_FULFILLMENT_ASSIGNEES.map((name) => ({
    value: name,
    label: name,
    avatarClass: AVATAR_COLORS[name] ?? "bg-zinc-500",
  })),
];

// ─── Controls ─────────────────────────────────────────────────────────────

export function AdminOrderRowFulfillmentSelect({
  orderId,
  fulfillmentStatus,
}: {
  orderId: string;
  fulfillmentStatus: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <AdminStatusDropdown
      value={fulfillmentStatus}
      options={FULFILLMENT_OPTIONS}
      pending={pending}
      onSelect={(next) => {
        startTransition(async () => {
          await updateOrderFulfillmentFromList(orderId, next);
        });
      }}
    />
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
    <AdminStatusDropdown
      value={assignee ?? ""}
      options={ASSIGNEE_OPTIONS}
      pending={pending}
      onSelect={(next) => {
        startTransition(async () => {
          await updateOrderAssigneeFromList(orderId, next);
        });
      }}
    />
  );
}
