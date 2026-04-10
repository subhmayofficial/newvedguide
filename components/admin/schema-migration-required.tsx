export function SchemaMigrationRequired() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 rounded-2xl border border-amber-500/30 bg-amber-50/80 p-8 dark:bg-amber-950/30">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-200">
          Database setup required
        </p>
        <h1 className="font-heading mt-2 text-2xl font-bold text-foreground">
          Apply commerce migration
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          The admin app needs the <strong>v2 schema</strong> from{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
            supabase/migrations/002_commerce_admin.sql
          </code>
          . The error <code className="font-mono text-xs">column leads.status does not exist</code> means
          your project still has the older <code className="font-mono text-xs">leads</code> table, or{" "}
          <code className="font-mono text-xs">events</code> / other v2 tables are missing.
        </p>
      </div>
      <ol className="list-decimal space-y-2 pl-5 text-sm text-foreground">
        <li>Open Supabase → SQL Editor.</li>
        <li>Paste and run the full <code className="font-mono text-xs">002_commerce_admin.sql</code> file.</li>
        <li>Reload this page.</li>
      </ol>
      <p className="text-xs text-muted-foreground">
        This renames legacy tables to <code className="font-mono">legacy_leads</code> /{" "}
        <code className="font-mono">legacy_orders</code> and creates the CRM + commerce tables.
      </p>
    </div>
  );
}
