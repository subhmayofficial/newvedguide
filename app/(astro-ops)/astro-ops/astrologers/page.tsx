import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { LIVE_CHAT_ASTROLOGERS } from "@/lib/data/live-chat-astrologers";
import { ASTRO_OPS_BASE } from "@/lib/admin/astro-ops-paths";

export const dynamic = "force-dynamic";

// ─── Server action ────────────────────────────────────────────────────────────
async function saveAstrologerConfig(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  const rateRaw = Number(formData.get("rate_inr_per_min"));
  const isOnline = formData.get("is_online") === "on";

  if (!id || isNaN(rateRaw) || rateRaw < 1 || rateRaw > 9999) return;

  const supabase = createServiceClient();
  await supabase.from("astrologer_configs").upsert(
    { id, rate_inr_per_min: Math.round(rateRaw), is_online: isOnline, updated_at: new Date().toISOString() },
    { onConflict: "id" }
  );

  revalidatePath(`${ASTRO_OPS_BASE}/astrologers`);
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function AstrologersAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const supabase = createServiceClient();

  // Load DB overrides
  const { data: configs } = await supabase
    .from("astrologer_configs")
    .select("id, rate_inr_per_min, is_online, updated_at");

  const configMap = Object.fromEntries(
    (configs ?? []).map((c) => [c.id, c])
  );

  // Merge static data with DB
  const astrologers = LIVE_CHAT_ASTROLOGERS.map((a) => ({
    ...a,
    rate_inr_per_min: configMap[a.id]?.rate_inr_per_min ?? a.chatRateInrPerMin,
    is_online: configMap[a.id]?.is_online ?? a.isOnline,
    updated_at: configMap[a.id]?.updated_at ?? null,
    inDb: !!configMap[a.id],
  }));

  const saved = sp.saved;

  return (
    <div className="mx-auto max-w-3xl space-y-6 font-sans">
      <header>
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Live Astrology Ops
        </p>
        <h1 className="mt-1 text-[22px] font-semibold tracking-tight text-foreground">
          Astrologers
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Set per-minute rate and online status for each astrologer. Changes take effect on the
          next new chat session.
        </p>
      </header>

      {saved && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          ✓ Settings saved successfully.
        </div>
      )}

      <div className="space-y-3">
        {astrologers.map((a) => (
          <section
            key={a.id}
            className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden"
          >
            {/* Card header */}
            <div className="flex items-center gap-4 px-5 py-4 border-b border-border/40 bg-muted/20">
              {/* Avatar */}
              <div
                className={`flex size-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${a.avatarGradient} text-sm font-bold text-white overflow-hidden`}
              >
                {a.imageSrc ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={a.imageSrc}
                    alt={a.name}
                    className="size-full object-cover"
                    style={{ objectPosition: "center 15%" }}
                  />
                ) : (
                  a.initials
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[15px] font-semibold text-foreground">{a.name}</p>
                  {a.featured && (
                    <span className="rounded-full bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-bold text-amber-800 uppercase tracking-wide">
                      Featured
                    </span>
                  )}
                  {a.badge && (
                    <span className="rounded-full bg-muted border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {a.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{a.title}</p>
                <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                  {a.specialties.join(" · ")} &nbsp;·&nbsp; {a.experienceYears} yrs
                </p>
              </div>

              {/* Live status chip */}
              <div className="shrink-0 flex items-center gap-1.5">
                <span
                  className={`size-2 rounded-full ${
                    a.is_online ? "bg-emerald-500 animate-pulse" : "bg-gray-300"
                  }`}
                />
                <span className={`text-[11px] font-semibold ${a.is_online ? "text-emerald-600" : "text-muted-foreground"}`}>
                  {a.is_online ? "Online" : "Offline"}
                </span>
              </div>
            </div>

            {/* Edit form */}
            <form action={saveAstrologerConfig} className="flex flex-wrap items-end gap-4 px-5 py-4">
              <input type="hidden" name="id" value={a.id} />

              {/* Rate */}
              <label className="grid gap-1 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Rate (₹/min)</span>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-muted-foreground">₹</span>
                  <input
                    name="rate_inr_per_min"
                    type="number"
                    min={1}
                    max={9999}
                    step={1}
                    defaultValue={a.rate_inr_per_min}
                    className="h-9 w-24 rounded-lg border border-input bg-background px-3 text-sm font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-brand/40"
                  />
                  <span className="text-xs text-muted-foreground">/min</span>
                </div>
              </label>

              {/* Online toggle */}
              <label className="flex cursor-pointer items-center gap-2 pb-[2px]">
                <input
                  type="checkbox"
                  name="is_online"
                  value="on"
                  defaultChecked={a.is_online}
                  className="size-4 rounded border-input accent-emerald-500"
                />
                <span className="text-sm font-medium text-foreground">Online</span>
              </label>

              <button
                type="submit"
                className="h-9 rounded-lg bg-brand px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-hover active:scale-[0.98]"
              >
                Save
              </button>

              {a.updated_at && (
                <p className="ml-auto text-[10px] text-muted-foreground/60 self-center">
                  Updated {new Date(a.updated_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
            </form>
          </section>
        ))}
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] text-amber-800">
        <strong>Note:</strong> Rate changes apply to new chat sessions only. Active sessions keep the
        rate set at the time they started. Run migration{" "}
        <code className="rounded bg-amber-100 px-1 font-mono text-[10px]">
          038_astrologer_configs.sql
        </code>{" "}
        in Supabase if the table doesn&apos;t exist yet.
      </div>
    </div>
  );
}
