import type { EventVariant } from '@rooz-calendar/core';
import { useEffect, useRef } from 'react';

/** Everything the dialog shows, already formatted in the active system. */
export interface EventDetails {
  title: string;
  /** The day, formatted with the active calendar system and numerals. */
  day: string;
  /** A time range, or the localised "all day" label. */
  time: string;
  room?: string;
  variant: EventVariant;
  /** Present only for events covering more than one day. */
  span?: string;
  /** The instants exactly as the callback hands them back. */
  payload: string;
}

const LABELS = {
  en: { when: 'When', time: 'Time', room: 'Room', span: 'Spans', variant: 'Variant', payload: 'What onEventClick received', close: 'Close' },
  fa: { when: 'تاریخ', time: 'ساعت', room: 'مکان', span: 'مدت', variant: 'نوع', payload: 'آنچه onEventClick دریافت کرد', close: 'بستن' },
} as const;

/**
 * The clicked event, in a modal.
 *
 * Uses the platform `<dialog>` element rather than a component library: it
 * brings its own focus trap, Escape handling, top layer and backdrop, and the
 * demo has no business pulling in a dependency the calendar itself does not
 * need.
 */
export function EventDialog({
  details,
  locale,
  dir,
  onClose,
}: {
  /** `null` closes the dialog. */
  details: EventDetails | null;
  locale: 'en' | 'fa';
  dir: 'ltr' | 'rtl';
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const labels = LABELS[locale];

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (details && !dialog.open) dialog.showModal();
    if (!details && dialog.open) dialog.close();
  }, [details]);

  const rows: Array<[string, string]> = details
    ? [
        [labels.when, details.day],
        [labels.time, details.time],
        ...(details.span ? ([[labels.span, details.span]] as Array<[string, string]>) : []),
        ...(details.room ? ([[labels.room, details.room]] as Array<[string, string]>) : []),
        [labels.variant, details.variant],
      ]
    : [];

  return (
    <dialog
      ref={ref}
      dir={dir}
      aria-labelledby="event-dialog-title"
      // `onClose` fires for Escape too, so state stays in step however it closes.
      onClose={onClose}
      // A click that lands on the element itself, not its content, is the backdrop.
      onClick={(event) => {
        if (event.target === event.currentTarget) ref.current?.close();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-border bg-card p-0 text-card-foreground shadow-xl backdrop:bg-black/50"
    >
      {details ? (
        <>
          <div className="flex items-start gap-3 border-b border-border p-4">
            <h2 id="event-dialog-title" className="text-base font-semibold leading-snug">
              {details.title}
            </h2>
            <button
              type="button"
              onClick={() => ref.current?.close()}
              aria-label={labels.close}
              className="ms-auto -me-1 -mt-1 rounded-md px-2 py-1 text-lg leading-none text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              ×
            </button>
          </div>

          <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 p-4 text-sm">
            {rows.map(([label, value]) => (
              <div key={label} className="col-span-2 grid grid-cols-subgrid items-baseline">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
                <dd className="text-start">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="border-t border-border bg-muted/40 p-4">
            <p className="text-[0.6875rem] font-medium uppercase tracking-wide text-muted-foreground">
              {labels.payload}
            </p>
            <pre
              dir="ltr"
              className="mt-2 overflow-x-auto rounded-md bg-background p-2.5 font-mono text-[0.6875rem] leading-relaxed text-muted-foreground"
            >
              {details.payload}
            </pre>
          </div>
        </>
      ) : null}
    </dialog>
  );
}
