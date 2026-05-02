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
import { formatInrFromPaisePrecise } from "@/lib/format-money";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ sessionId: string }> };

export default async function LiveConsultSessionDetailPage({ params }: Props) {
  const { sessionId } = await params;
  const supabase = createServiceClient();
  const schema = await checkLiveConsultSchema(supabase);
  if (!schema.ok) {
    return <LiveConsultSchemaMissing message={schema.message} />;
  }

  const { data: session, error: sErr } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  if (sErr || !session) {
    notFound();
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("display_name, avatar_url, wallet_balance_paise")
    .eq("id", session.user_id)
    .maybeSingle();

  const astroName = astrologerLabel(session.astrologer_id);
  const base = getAstrologerDisplay(session.astrologer_id);
  const astrologer = {
    ...base,
    rateInrPerMin: resolveSessionRateInr(
      session.rate_inr_per_min,
      session.astrologer_id
    ),
  };
  const customerName =
    profile?.display_name?.trim() ||
    `User ${session.user_id.slice(0, 8)}…`;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Live consult · Session
          </p>
          <h1 className="font-heading text-3xl font-bold">{astroName}</h1>
          <p className="mt-1 font-mono text-xs text-muted-foreground">{sessionId}</p>
          {session.order_code ? (
            <p className="mt-2 font-mono text-sm font-semibold text-foreground">
              Order {session.order_code}
            </p>
          ) : null}
          <p className="mt-2 text-sm">
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold">
              {session.status}
            </span>
            <span className="ml-2 text-muted-foreground">
              Updated {formatAdminDateTime(session.updated_at)}
            </span>
            {session.total_billed_paise > 0 || session.status === "closed" ? (
              <span className="ml-2 text-muted-foreground">
                · Billed {formatInrFromPaisePrecise(session.total_billed_paise)}
              </span>
            ) : null}
            {session.closed_at ? (
              <span className="ml-2 text-muted-foreground">
                · Closed {formatAdminDateTime(session.closed_at)}
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Link
            href={`/admindeoghar/live-consult/inbox?sid=${encodeURIComponent(sessionId)}`}
            className="text-sm font-semibold text-brand hover:underline"
          >
            Open in inbox →
          </Link>
          <Link
            href="/admindeoghar/live-consult/sessions"
            className="text-sm font-medium text-brand hover:underline"
          >
            ← All sessions
          </Link>
          <Link
            href={`/admindeoghar/live-consult/users/${session.user_id}`}
            className="text-sm font-medium text-brand hover:underline"
          >
            View user →
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {session.status === "open" ? (
          <form action={adminSetSessionStatus}>
            <input type="hidden" name="sessionId" value={sessionId} />
            <input type="hidden" name="status" value="closed" />
            <button
              type="submit"
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted"
            >
              Mark closed
            </button>
          </form>
        ) : session.status === "waiting_astrologer" ? (
          <form action={adminSetSessionStatus}>
            <input type="hidden" name="sessionId" value={sessionId} />
            <input type="hidden" name="status" value="closed" />
            <button
              type="submit"
              className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-950 hover:bg-amber-500/20 dark:text-amber-100"
            >
              Cancel waiting user
            </button>
          </form>
        ) : (
          <form action={adminSetSessionStatus}>
            <input type="hidden" name="sessionId" value={sessionId} />
            <input type="hidden" name="status" value="open" />
            <button
              type="submit"
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted"
            >
              Reopen session
            </button>
          </form>
        )}
      </div>

      <section>
        <LiveChatPanel
          key={sessionId}
          mode="admin"
          sessionId={sessionId}
          astrologer={astrologer}
          customerName={customerName}
          customerAvatarUrl={profile?.avatar_url}
          customerInitials={displayNameInitials(
            profile?.display_name,
            session.user_id
          )}
          initialBalancePaise={profile?.wallet_balance_paise ?? 0}
          meterAnchorIso={session.last_billed_at ?? session.created_at}
          initialSessionStatus={session.status}
        />
      </section>
    </div>
  );
}
