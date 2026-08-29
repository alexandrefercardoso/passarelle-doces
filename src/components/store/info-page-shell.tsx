import type { ReactNode } from "react";

export function InfoPageShell({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-gold-dark">{eyebrow}</p>
      <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h1>
      {lead && (
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{lead}</p>
      )}
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </div>
  );
}
