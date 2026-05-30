import Link from "next/link";
import { adminPath } from "@/lib/admin/admin-paths";
import { submitAdminMetaCapiTestForm } from "@/app/(admin)/admin/actions";
import { getMetaCapiConfig } from "@/lib/meta/capi";

const inputCls =
  "h-9 w-full rounded-md border border-border bg-background px-3 text-[13px] text-foreground outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring";

type RecentLog = {
  id: string;
  status: string;
  response_status: number | null;
  error_message: string | null;
  created_at: string;
  response_body: string | null;
};

type Props = {
  defaultTestEventCode: string;
  configured: boolean;
  pixelId: string | null;
  recentLogs: RecentLog[];
  flash?: {
    kind: "success" | "failed";
    message: string;
    detail?: string;
  } | null;
};

export function AdminMetaCapiTestPanel({
  defaultTestEventCode,
  configured,
  pixelId,
  recentLogs,
  flash,
}: Props) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-5">
      <div>
        <h2 className="text-[15px] font-semibold text-foreground">Meta CAPI test & logs</h2>
        <p className="mt-1 text-[13px] text-muted-foreground leading-relaxed">
          Sends a server-side <strong className="font-medium text-foreground">Purchase</strong> to Meta
          Graph API. Every real ads order also logs here after payment — see{" "}
          <Link href={adminPath("/integrations")} className="font-medium underline underline-offset-2">
            Integrations → Delivery logs
          </Link>{" "}
          (provider <code className="rounded bg-muted px-1 text-xs">meta_capi</code>).
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-[12px] text-muted-foreground">
          <li>
            Config: {configured ? "ON" : "OFF"} · Pixel {pixelId ?? "—"}
          </li>
          <li>Meta Events Manager → Test events → enter your test code to see events live</li>
          <li>Server terminal / Vercel logs: search <code className="rounded bg-muted px-1">[meta-capi]</code></li>
        </ul>
      </div>

      {flash && (
        <div
          className={
            flash.kind === "success"
              ? "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/25 dark:text-emerald-200"
              : "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-950/25 dark:text-red-200"
          }
        >
          <p className="font-semibold">
            {flash.kind === "success" ? "CAPI test sent" : "CAPI test failed"}
          </p>
          <p className="mt-1 text-[13px] opacity-90">{flash.message}</p>
          {flash.detail ? (
            <pre className="mt-2 max-h-32 overflow-auto rounded bg-black/5 p-2 text-[11px] font-mono dark:bg-white/10">
              {flash.detail}
            </pre>
          ) : null}
        </div>
      )}

      <form action={submitAdminMetaCapiTestForm} className="space-y-4 border-t border-border pt-5">
        <label className="block space-y-1.5">
          <span className="text-[12px] font-medium text-muted-foreground">Test event code</span>
          <input
            name="testEventCode"
            defaultValue={defaultTestEventCode}
            placeholder="TEST88413"
            className={inputCls}
          />
        </label>
        <button
          type="submit"
          disabled={!configured}
          className="inline-flex h-10 items-center rounded-md bg-foreground px-4 text-[13px] font-semibold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Send test Purchase to Meta
        </button>
      </form>

      {recentLogs.length > 0 ? (
        <div className="border-t border-border pt-5 space-y-2">
          <p className="text-[12px] font-semibold text-foreground">Recent Meta CAPI requests</p>
          <ul className="space-y-2">
            {recentLogs.map((log) => (
              <li
                key={log.id}
                className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-[12px]"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={
                      log.status === "success"
                        ? "font-semibold text-emerald-700 dark:text-emerald-300"
                        : "font-semibold text-red-700 dark:text-red-300"
                    }
                  >
                    {log.status}
                  </span>
                  <span className="text-muted-foreground">HTTP {log.response_status ?? "—"}</span>
                  <span className="text-muted-foreground">{log.created_at}</span>
                </div>
                {log.error_message ? (
                  <p className="mt-1 text-red-700 dark:text-red-300">{log.error_message}</p>
                ) : null}
                {log.response_body ? (
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground truncate">
                    {log.response_body}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
