import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { submitWalletCashbackSettingsForm } from "@/app/(admin)/admin/actions";
import { getWalletCashbackSettings } from "@/lib/admin/wallet-cashback-settings";
import { ASTRO_OPS_BASE } from "@/lib/admin/astro-ops-paths";
import { adminPath, ADMIN_PANEL_BASE } from "@/lib/admin/admin-paths";

export const dynamic = "force-dynamic";

export default async function AstroOpsSettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const supabase = createServiceClient();
  const walletCashback = await getWalletCashbackSettings(supabase);

  return (
    <div className="mx-auto max-w-2xl space-y-8 font-sans">
      <header>
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Live Astrology Ops
        </p>
        <h1 className="mt-1 text-[22px] font-semibold tracking-tight text-foreground">Wallet promo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cashback on in-app wallet top-ups (test / preview flows). Commerce and delivery settings stay in{" "}
          <Link href={adminPath("/settings")} className="font-medium text-brand hover:underline">
            main admin → Settings
          </Link>
          .
        </p>
      </header>

      {sp.wallet_saved === "1" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/25 dark:text-emerald-300">
          Wallet cashback settings saved.
        </div>
      )}

      {sp.wallet_err && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/25 dark:text-red-300">
          {decodeURIComponent(sp.wallet_err)}
        </div>
      )}

      <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">Top-up cashback</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          When enabled, users get extra wallet credit as a percentage of each qualifying top-up. Minimum
          top-up in the app is ₹49. If save fails, run{" "}
          <code className="rounded bg-muted px-1 font-mono text-[10px]">036_admin_wallet_cashback_settings.sql</code>{" "}
          and push migrations.
        </p>

        <form action={submitWalletCashbackSettingsForm} className="mt-5 grid gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              name="cashback_enabled"
              value="on"
              defaultChecked={walletCashback.cashback_enabled}
              className="size-4 rounded border-input"
            />
            <span className="font-medium">Enable cashback on wallet top-ups</span>
          </label>
          <label className="grid gap-1.5 text-xs text-muted-foreground">
            <span className="font-medium">Cashback percent (0–100)</span>
            <input
              name="cashback_percent"
              type="number"
              min={0}
              max={100}
              step={1}
              defaultValue={walletCashback.cashback_percent}
              className="h-10 w-32 rounded-lg border border-input bg-background px-3 text-sm"
            />
            <span className="text-[10px]">
              Example: 10 means a ₹100 top-up adds ₹100 principal + ₹10 bonus (floored, in paise).
            </span>
          </label>
          <div>
            <button
              type="submit"
              className="inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-primary-foreground transition hover:bg-brand-hover"
            >
              Save cashback
            </button>
          </div>
        </form>
      </section>

      <p className="text-center text-xs text-muted-foreground">
        <Link href={ASTRO_OPS_BASE} className="font-medium text-brand hover:underline">
          ← Back to Live Astrology dashboard
        </Link>
      </p>
    </div>
  );
}
