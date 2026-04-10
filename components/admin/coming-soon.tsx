import type { ReactNode } from "react";

export function ComingSoon({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-dashed border-border/80 bg-card/50 p-10 text-center shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Roadmap
      </p>
      <h1 className="font-heading mt-2 text-2xl font-bold text-foreground">{title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
      {children && <div className="mt-8 text-left">{children}</div>}
    </div>
  );
}
