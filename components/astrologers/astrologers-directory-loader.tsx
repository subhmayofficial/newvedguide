import { EngagingRouteProgress } from "@/components/ui/engaging-route-progress";

/** Shown while the directory client bundle loads (code-split). */
export function AstrologersDirectoryLoader() {
  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <EngagingRouteProgress
        className="mx-auto mb-6 max-w-2xl"
        ariaLabel="Loading astrologers"
      />
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="h-10 w-full animate-pulse rounded-xl bg-muted/70" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 w-20 animate-pulse rounded-full bg-muted/60" />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex gap-3 rounded-2xl border border-border/50 bg-card/50 p-4 animate-pulse"
          >
            <div className="size-16 shrink-0 rounded-full bg-muted" />
            <div className="min-w-0 flex-1 space-y-2 pt-1">
              <div className="h-4 w-2/3 max-w-[12rem] rounded bg-muted" />
              <div className="h-3 w-full max-w-[16rem] rounded bg-muted/80" />
              <div className="h-3 w-1/2 max-w-[8rem] rounded bg-muted/70" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
