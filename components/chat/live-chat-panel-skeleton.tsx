import { EngagingRouteProgress } from "@/components/ui/engaging-route-progress";

/** Lightweight shell while the live chat bundle loads (code-split). */
export function LiveChatPanelSkeleton() {
  return (
    <div
      className="flex h-[calc(100dvh-56px)] flex-col bg-background"
      aria-busy
      aria-label="Loading chat"
    >
      <div className="shrink-0 border-b border-border/40 bg-background px-3 pb-2 pt-2">
        <EngagingRouteProgress
          showCaption={false}
          ariaLabel="Loading chat"
          className="w-full"
        />
      </div>
      <div className="h-[44px] shrink-0 animate-pulse border-b border-border/60 bg-muted/20" />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="ml-8 h-16 max-w-[85%] animate-pulse rounded-2xl bg-muted/50" />
        <div className="mr-8 h-14 max-w-[70%] animate-pulse rounded-2xl bg-muted/40" />
        <div className="ml-8 h-20 max-w-[80%] animate-pulse rounded-2xl bg-muted/50" />
      </div>
      <div className="h-20 shrink-0 animate-pulse border-t border-border/60 bg-muted/25" />
    </div>
  );
}
