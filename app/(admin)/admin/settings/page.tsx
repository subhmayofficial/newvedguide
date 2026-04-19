import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { getBunnyCdnSettings } from "@/lib/admin/bunny-cdn-settings";
import { getOrderDeliverySettings } from "@/lib/admin/order-delivery-settings";
import {
  submitBunnyCdnSettingsForm,
  submitOrderDeliverySettingsForm,
} from "@/app/(admin)/admin/actions";

export const dynamic = "force-dynamic";

function bunnyErrMessage(code: string): string {
  if (code === "invalid_cdn_url") {
    return "CDN base URL must be empty or a valid https:// link (no trailing slash needed).";
  }
  try {
    return decodeURIComponent(code);
  } catch {
    return code;
  }
}

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const supabase = createServiceClient();
  const [deliverySettings, bunnySettings] = await Promise.all([
    getOrderDeliverySettings(supabase),
    getBunnyCdnSettings(supabase),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-8 font-sans">
      <header>
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Order delivery WhatsApp and Bunny CDN defaults for this project. Secrets (API keys) stay in{" "}
          <span className="font-mono text-xs">.env.local</span> only.
        </p>
      </header>

      {sp.settings_saved === "1" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/25 dark:text-emerald-300">
          Interakt delivery template saved. New sends use the updated values.
        </div>
      )}

      {sp.settings_err && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/25 dark:text-red-300">
          {sp.settings_err === "template_name_required"
            ? "Template name is required."
            : decodeURIComponent(sp.settings_err)}
        </div>
      )}

      {sp.bunny_saved === "1" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/25 dark:text-emerald-300">
          Bunny CDN settings saved.
        </div>
      )}

      {sp.bunny_err && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/25 dark:text-red-300">
          {bunnyErrMessage(sp.bunny_err)}
        </div>
      )}

      <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">Order delivery (Interakt)</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Must match a template saved in Interakt / Meta (same name and language code). Body should
          expect one variable (customer name); the URL button you configure here receives the report
          link from the Deliver dialog.
        </p>
        <p className="mt-2 text-[10px] text-muted-foreground">
          If the DB row is missing, defaults apply until you run{" "}
          <code className="rounded bg-muted px-1 font-mono">014_admin_order_delivery_settings.sql</code>{" "}
          and push.
        </p>

        <form action={submitOrderDeliverySettingsForm} className="mt-5 grid gap-4">
          <label className="grid gap-1.5 text-xs text-muted-foreground">
            <span className="font-medium">Template name</span>
            <input
              name="interakt_template_name"
              required
              defaultValue={deliverySettings.interakt_template_name}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-mono"
            />
          </label>
          <label className="grid gap-1.5 text-xs text-muted-foreground">
            <span className="font-medium">Language code</span>
            <input
              name="interakt_template_language"
              defaultValue={deliverySettings.interakt_template_language}
              placeholder="hi"
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-mono"
            />
          </label>
          <label className="grid gap-1.5 text-xs text-muted-foreground">
            <span className="font-medium">URL button index</span>
            <input
              name="interakt_button_index"
              defaultValue={deliverySettings.interakt_button_index}
              placeholder="0"
              className="h-10 w-24 rounded-lg border border-input bg-background px-3 text-sm font-mono"
            />
            <span className="text-[10px]">Usually 0 for the first dynamic-URL button.</span>
          </label>
          <div>
            <button
              type="submit"
              className="inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-primary-foreground transition hover:bg-brand-hover"
            >
              Save delivery template
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">Bunny.net (CDN + Storage)</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Public URLs and zone name live here so the app can build links after uploads. The{" "}
          <strong className="font-medium text-foreground">storage password</strong> never goes in the
          database—add it to <span className="font-mono text-[11px]">.env.local</span> as{" "}
          <span className="font-mono text-[11px]">BUNNY_STORAGE_API_KEY</span>.
        </p>

        <div className="mt-4 rounded-xl border border-border/80 bg-muted/30 px-4 py-3 text-[11px] leading-relaxed text-muted-foreground">
          <p className="font-semibold text-foreground">What to copy from Bunny (for you / your team)</p>
          <ol className="mt-2 list-decimal space-y-1.5 pl-4">
            <li>
              <strong className="text-foreground/90">Storage zone name</strong> — Dashboard →{" "}
              <em>Storage</em> → your zone → name shown in the list (also in the Storage API hostname
              path).
            </li>
            <li>
              <strong className="text-foreground/90">Region</strong> (optional) — If Bunny shows a region
              code for the zone (e.g. Falkenstein / DE), put the short code they document (often{" "}
              <span className="font-mono">de</span>, <span className="font-mono">ny</span>, etc.). Leave
              blank if you use the default global endpoint.
            </li>
            <li>
              <strong className="text-foreground/90">Pull zone / CDN URL</strong> — The public base where
              files appear, e.g. <span className="font-mono">https://your-pullzone.b-cdn.net</span> or
              your custom hostname. No trailing slash.
            </li>
            <li>
              <strong className="text-foreground/90">Password (API key)</strong> — Same storage zone →{" "}
              <em>FTP &amp; API</em> → <strong>Password</strong>. Put only in{" "}
              <span className="font-mono">BUNNY_STORAGE_API_KEY</span> on the server; we do not store it
              in admin settings.
            </li>
          </ol>
          <p className="mt-3 text-[10px] text-muted-foreground/90">
            After creating the table, run{" "}
            <code className="rounded bg-muted px-1 font-mono">015_admin_bunny_cdn_settings.sql</code> and{" "}
            <code className="rounded bg-muted px-1 font-mono">npx supabase db push</code>. Upload code
            can read these values via <span className="font-mono">getBunnyCdnSettings</span> + env key.
          </p>
        </div>

        <form action={submitBunnyCdnSettingsForm} className="mt-5 grid gap-4">
          <label className="grid gap-1.5 text-xs text-muted-foreground">
            <span className="font-medium">Storage zone name</span>
            <input
              name="storage_zone_name"
              defaultValue={bunnySettings.storage_zone_name}
              placeholder="my-vedguide-reports"
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-mono"
            />
          </label>
          <label className="grid gap-1.5 text-xs text-muted-foreground">
            <span className="font-medium">Storage region (optional)</span>
            <input
              name="storage_region"
              defaultValue={bunnySettings.storage_region}
              placeholder="e.g. de — or leave empty"
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-mono"
            />
          </label>
          <label className="grid gap-1.5 text-xs text-muted-foreground">
            <span className="font-medium">CDN public base URL</span>
            <input
              name="cdn_public_base_url"
              type="url"
              defaultValue={bunnySettings.cdn_public_base_url}
              placeholder="https://vedguide.b-cdn.net"
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-mono"
            />
            <span className="text-[10px]">
              Used to build public file links. Leave empty until the pull zone exists.
            </span>
          </label>
          <div>
            <button
              type="submit"
              className="inline-flex h-10 items-center rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground transition hover:bg-muted/60"
            >
              Save Bunny CDN settings
            </button>
          </div>
        </form>
      </section>

      <p className="text-center text-xs text-muted-foreground">
        <Link href="/admindeoghar/integrations" className="font-medium text-brand hover:underline">
          Integrations
        </Link>{" "}
        · API keys &amp; test sends
      </p>
    </div>
  );
}
