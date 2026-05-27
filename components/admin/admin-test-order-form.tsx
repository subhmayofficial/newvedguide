import Link from "next/link";
import { adminPath } from "@/lib/admin/admin-paths";
import { submitAdminTestKundliOrderForm } from "@/app/(admin)/admin/actions";

const inputCls =
  "h-9 w-full rounded-md border border-border bg-background px-3 text-[13px] text-foreground outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring";

type Props = {
  defaultAmountRupees: number;
  flash?: {
    kind: "success" | "failed";
    message: string;
    orderId?: string;
  } | null;
};

export function AdminTestOrderForm({ defaultAmountRupees, flash }: Props) {
  return (
    <div className="space-y-6">
      {flash && (
        <div
          className={
            flash.kind === "success"
              ? "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/25 dark:text-emerald-200"
              : "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-950/25 dark:text-red-200"
          }
        >
          <p className="font-semibold">
            {flash.kind === "success" ? "Test order created" : "Could not create test order"}
          </p>
          <p className="mt-1 text-[13px] opacity-90">{flash.message}</p>
          {flash.orderId ? (
            <p className="mt-2">
              <Link
                href={adminPath(`/orders/${flash.orderId}`)}
                className="text-[13px] font-semibold underline underline-offset-2"
              >
                Open order →
              </Link>
            </p>
          ) : null}
        </div>
      )}

      <form action={submitAdminTestKundliOrderForm} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5 sm:col-span-2">
            <span className="text-[12px] font-medium text-muted-foreground">Full name *</span>
            <input name="fullName" required placeholder="Test User" className={inputCls} />
          </label>
          <label className="block space-y-1.5">
            <span className="text-[12px] font-medium text-muted-foreground">Phone *</span>
            <input
              name="phone"
              required
              placeholder="9876543210"
              inputMode="tel"
              className={inputCls}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-[12px] font-medium text-muted-foreground">Email</span>
            <input name="email" type="email" placeholder="test@example.com" className={inputCls} />
          </label>
          <label className="block space-y-1.5">
            <span className="text-[12px] font-medium text-muted-foreground">Gender *</span>
            <select name="gender" required defaultValue="male" className={inputCls}>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-[12px] font-medium text-muted-foreground">Report language *</span>
            <select name="reportLanguage" required defaultValue="hindi" className={inputCls}>
              <option value="hindi">Hindi</option>
              <option value="english">English</option>
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-[12px] font-medium text-muted-foreground">Date of birth</span>
            <input name="dob" type="date" className={inputCls} />
          </label>
          <label className="block space-y-1.5">
            <span className="text-[12px] font-medium text-muted-foreground">Time of birth</span>
            <input name="tob" type="time" className={inputCls} />
          </label>
          <label className="block space-y-1.5 sm:col-span-2">
            <span className="text-[12px] font-medium text-muted-foreground">Place of birth</span>
            <input name="pob" placeholder="Mumbai, India" className={inputCls} />
          </label>
        </div>

        <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-4">
          <p className="text-[13px] font-semibold text-foreground">Funnel & payment simulation</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-[12px] font-medium text-muted-foreground">Source page</span>
              <input
                name="sourcePage"
                defaultValue="/kundli/new-checkout"
                className={inputCls}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-[12px] font-medium text-muted-foreground">Source funnel</span>
              <input
                name="sourceFunnel"
                defaultValue="kundli_direct_lp"
                className={inputCls}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-[12px] font-medium text-muted-foreground">
                Amount (₹) — no Razorpay
              </span>
              <input
                name="amountRupees"
                type="number"
                min={1}
                step={1}
                defaultValue={defaultAmountRupees}
                className={inputCls}
              />
            </label>
          </div>
          <label className="flex items-start gap-2 text-[13px] text-foreground">
            <input
              type="checkbox"
              name="fireMetaCapi"
              defaultChecked
              className="mt-1 h-4 w-4 rounded border-border"
            />
            <span>
              Send Meta Purchase CAPI (same as real <code className="text-xs">/kundli/new-checkout</code>{" "}
              sale). Uncheck to skip ad reporting.
            </span>
          </label>
        </div>

        <button
          type="submit"
          className="inline-flex h-10 items-center rounded-md bg-foreground px-4 text-[13px] font-semibold text-background transition-opacity hover:opacity-90"
        >
          Create test order (mark paid)
        </button>
      </form>
    </div>
  );
}
