import { Fragment, type ReactNode } from 'react';

/**
 * Render a JSDoc comment's inline `code` spans.
 *
 * The reference page shows doc comments verbatim from the source, and those
 * comments use Markdown backticks — rendering them raw leaves stray backticks
 * all over the tables.
 */
export function Prose({ text, className }: { text: string; className?: string }): ReactNode {
  if (!text) return null;
  const parts = text.split(/`([^`]+)`/g);
  return (
    <span className={className}>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <code key={index} className="rounded bg-muted px-1 py-px font-mono text-[0.8125em]">
            {part}
          </code>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </span>
  );
}
