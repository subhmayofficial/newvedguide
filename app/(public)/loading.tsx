export default function PublicLoading() {
  return (
    <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden px-4">
      <div className="absolute inset-0 spiritual-pattern opacity-60" />
      <div className="absolute h-56 w-56 rounded-full bg-brand/10 blur-3xl animate-consultation-orb-breathe" />

      <div className="relative rounded-3xl border border-brand/20 bg-card/80 px-8 py-7 shadow-lg backdrop-blur">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-brand/30">
          <div className="absolute h-20 w-20 rounded-full border-2 border-brand/30 border-t-brand animate-spin" />
          <div className="h-10 w-10 rounded-full bg-brand/15 animate-pulse" />
        </div>

        <p className="mt-5 text-center font-heading text-2xl font-semibold text-foreground">
          Preparing your page
        </p>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Loading accurate details for you...
        </p>

        <div className="mt-4 flex justify-center gap-2">
          <span className="h-2 w-2 rounded-full bg-brand/70 animate-bounce [animation-delay:0ms]" />
          <span className="h-2 w-2 rounded-full bg-brand/70 animate-bounce [animation-delay:140ms]" />
          <span className="h-2 w-2 rounded-full bg-brand/70 animate-bounce [animation-delay:280ms]" />
        </div>
      </div>
    </div>
  );
}
