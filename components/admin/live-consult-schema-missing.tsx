export function LiveConsultSchemaMissing({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-8 text-sm">
      <h1 className="font-heading text-xl font-semibold text-foreground">
        Live consult admin
      </h1>
      <p className="mt-3 leading-relaxed text-muted-foreground">{message}</p>
      <p className="mt-4 text-xs text-muted-foreground">
        File:{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
          supabase/migrations/026_user_wallet_chat.sql
        </code>
      </p>
    </div>
  );
}
