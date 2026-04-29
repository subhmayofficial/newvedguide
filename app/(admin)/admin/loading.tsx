export default function AdminLoading() {
  return (
    <div className="flex min-h-[65vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10">
            <div className="absolute inset-0 rounded-full border-2 border-muted border-t-foreground animate-spin" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Loading dashboard</p>
            <p className="text-xs text-muted-foreground">Fetching latest admin data...</p>
          </div>
        </div>

        <div className="mt-5 space-y-2">
          <div className="h-3 w-full rounded bg-muted/70 animate-pulse" />
          <div className="h-3 w-10/12 rounded bg-muted/70 animate-pulse [animation-delay:120ms]" />
          <div className="h-3 w-8/12 rounded bg-muted/70 animate-pulse [animation-delay:240ms]" />
        </div>
      </div>
    </div>
  );
}
