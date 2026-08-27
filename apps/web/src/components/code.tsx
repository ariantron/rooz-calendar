import { useState } from 'react';
import { cx } from '../lib/cx';

/** A code sample with a copy button. No syntax highlighter dependency. */
export function Code({ children, className, language = 'tsx' }: { children: string; className?: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className={cx('group relative overflow-hidden rounded-lg border border-border bg-muted/40', className)}>
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
        <span className="font-mono text-[0.6875rem] uppercase tracking-wide text-muted-foreground">{language}</span>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard?.writeText(children).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1600);
            });
          }}
          className="rounded px-2 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre dir="ltr" className="overflow-x-auto p-4 text-[0.8125rem] leading-relaxed">
        <code className="font-mono">{children}</code>
      </pre>
    </div>
  );
}
