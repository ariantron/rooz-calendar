import type { ReactNode } from 'react';
import { cx } from '../lib/cx';

export function Section({
  id,
  title,
  lead,
  children,
  className,
}: {
  id?: string;
  title?: ReactNode;
  lead?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cx('scroll-mt-20 py-10', className)}>
      {title ? <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2> : null}
      {lead ? <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">{lead}</p> : null}
      {children ? <div className={title || lead ? 'mt-6' : ''}>{children}</div> : null}
    </section>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('rounded-lg border border-border bg-card p-5 text-card-foreground', className)}>{children}</div>;
}

export function Badge({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'muted' | 'accent' }) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[0.6875rem] font-medium',
        tone === 'accent' && 'border-primary/30 bg-primary/10 text-foreground',
        tone === 'muted' && 'border-border bg-muted text-muted-foreground',
        tone === 'default' && 'border-border bg-background text-foreground',
      )}
    >
      {children}
    </span>
  );
}
