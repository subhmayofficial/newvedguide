import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { formatAdminDateTime } from "@/lib/admin/time";
import { checkLiveConsultSchema, astrologerLabel } from "@/lib/admin/live-consult";
import { LiveConsultSchemaMissing } from "@/components/admin/live-consult-schema-missing";
import { adminSetSessionStatus } from "../../actions";
import { LiveChatPanel } from "@/components/chat/live-chat-panel";
import {
  getAstrologerDisplay,
  resolveSessionRateInr,
} from "@/lib/chat/astrologer-display";
import { displayNameInitials } from "@/lib/chat/display-initials";
import { syncOpenChatSessionsIfWalletDepleted } from "@/lib/chat/sync-open-chat-for-wallet";
import { formatInrFromPaisePrecise } from "@/lib/format-money";
import {
  ArrowLeft,
  ArrowUpRight,
  Ban,
  CheckCircle2,
  Clock,
  IndianRupee,
  MessageCircle,
  RefreshCw,
  User,
} from "lucide-react";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ sessionId: string }> };

function StatusBadge({ status }: { status: string }) {
  if (status === "open")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
        <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
        Live
      </span>
    );
  if (status === "waiting_astrologer")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-800 dark:text-amber-200">
        <span className="size-2 rounded-full bg-amber-400 animate-pulse" />
        Waiting for astrologer
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1 text-xs font-semibold text-muted-foreground">
      <span className="size-2 rounded-full bg-muted-foreground/40" />
      Closed
    </span>
  );
}

export default async function LiveConsultSessionDetailPage({ params }: Props) {
  const { sessionId } = await params;
  const supabase = createServiceClient();
  const schema = await checkLiveConsultSchema(supabase);
  if (!schema.ok) return <LiveConsultSchemaMissing message={schema.message} />;

  const { data: session, error: sErr } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  if (sErr || !session) notFound();

  await syncOpenChatSessionsIfWalletDepleted(supabase, session.user_id);

  const { data: sessionFresh } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  const sess = sessionFresh ?? session;

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("display_name, avatar_url, wallet_balance_paise")
    .eq("id", sess.user_id)
    .maybeSingle();

  const astroName = astrologerLabel(sess.astrologer_id);
  const base = getAstrologerDisplay(sess.astrologer_id);
  const astrologer = {
    ...base,
    rateInrPerMin: resolveSessionRateInr(
      sess.rate_inr_per_min,
      sess.astrologer_id
    ),
  };
  const customerName =
    profile?.display_name?.trim() || `User ${sess.user_id.slice(0, 8)}…`;

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          {/* Left: astro + metadata */}
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand/10">
              <MessageCircle className="size-6 text-brand" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Live consult · Session
              </p>
              <h1 className="mt-0.5 font-heading text-2xl font-bold">{astroName}</h1>
              {sess.order_code && (
                <p className="mt-1 font-mono text-xs font-semibold text-foreground">
                  {sess.order_code}
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge status={sess.status} />
                {(sess.total_billed_paise ?? 0) > 0 && (
                  <span className="flex items-center gap-1 rounded-full bg-muted/60 px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                    <IndianRupee className="size-3" />
                    {formatInrFromPaisePrecise(sess.total_billed_paise)}
                  </span>
                )}
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock className="size-3" />
                  Updated {formatAdminDateTime(sess.updated_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Right: nav links */}
          <div className="flex flex-col items-end gap-2">
            <Link
              href="/astro-ops/sessions"
              className="flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
            >
              <ArrowLeft className="size-4" /> All sessions
            </Link>
            <Link
              href={`/astro-ops/users/${sess.user_id}`}
              className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground hover:underline"
            >
              <User className="size-3.5" />
              View user <ArrowUpRight className="size-3" />
            </Link>
            <Link
              href={`/astro-ops/inbox?sid=${encodeURIComponent(sessionId)}`}
              className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground hover:underline"
            >
              <MessageCircle className="size-3.5" />
              Open in inbox <ArrowUpRight className="size-3" />
            </Link>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex flex-wrap gap-2 border-t border-border/50 pt-4">
          {sess.status === "open" && (
            <form action={adminSetSessionStatus}>
              <input type="hidden" name="sessionId" value={sessionId} />
              <input type="hidden" name="status" value="closed" />
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-bold transition hover:bg-muted"
              >
                <CheckCircle2 className="size-3.5 text-muted-foreground" />
                Mark closed
              </button>
            </form>
          )}
          {sess.status === "waiting_astrologer" && (
            <form action={adminSetSessionStatus}>
              <input type="hidden" name="sessionId" value={sessionId} />
              <input type="hidden" name="status" value="closed" />
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-full border border-amber-500/50 bg-amber-500/10 px-4 py-1.5 text-xs font-bold text-amber-900 transition hover:bg-amber-500/20 dark:text-amber-100"
              >
                <Ban className="size-3.5" />
                Cancel waiting
              </button>
            </form>
          )}
          {sess.status === "closed" && (
            <form action={adminSetSessionStatus}>
              <input type="hidden" name="sessionId" value={sessionId} />
              <input type="hidden" name="status" value="open" />
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-bold transition hover:bg-muted"
              >
                <RefreshCw className="size-3.5 text-muted-foreground" />
                Reopen session
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Chat panel */}
      <section className="rounded-2xl border border-border/60 overflow-hidden shadow-sm">
        <LiveChatPanel
          key={sessionId}
          mode="admin"
          sessionId={sessionId}
          astrologer={astrologer}
          customerName={customerName}
          customerAvatarUrl={profile?.avatar_url}
          customerInitials={displayNameInitials(
            profile?.display_name,
            sess.user_id
          )}
          initialBalancePaise={profile?.wallet_balance_paise ?? 0}
          meterAnchorIso={sess.last_billed_at ?? sess.created_at}
          initialSessionStatus={sess.status}
        />
      </section>
    </div>
  );
}
