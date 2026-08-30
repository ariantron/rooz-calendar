import type { EventVariant } from '@rooz-calendar/core';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '../lib/utils';

const eventBlockVariants = cva(
  'group/event relative flex w-full min-w-0 cursor-pointer select-none items-baseline overflow-hidden border text-start outline-none transition-colors focus-visible:ring-[2px] focus-visible:ring-ring/60',
  {
    variants: {
      variant: {
        default: 'border-sky-500/25 bg-sky-500/12 text-sky-900 hover:bg-sky-500/20 dark:text-sky-100',
        primary: 'border-primary/30 bg-primary/12 text-foreground hover:bg-primary/20',
        success: 'border-emerald-500/25 bg-emerald-500/12 text-emerald-900 hover:bg-emerald-500/20 dark:text-emerald-100',
        warning: 'border-amber-500/30 bg-amber-500/15 text-amber-900 hover:bg-amber-500/25 dark:text-amber-100',
        danger: 'border-destructive/30 bg-destructive/12 text-destructive hover:bg-destructive/20',
        muted: 'border-border bg-muted text-muted-foreground hover:bg-muted/70',
      },
      layout: {
        /**
         * A one-line pill, as used inside a month cell. Centred rather than
         * baseline-aligned: the height is fixed, so a baseline would pin the
         * text to the top of the pill instead of the middle of it.
         */
        chip: 'h-[1.375rem] items-center gap-1.5 rounded-sm px-1.5 text-[0.6875rem] leading-none',
        /** A filled block sized by the caller, as used in a week or day column. */
        block: 'h-full flex-col items-stretch gap-0.5 rounded-md px-1.5 py-1 text-xs leading-tight',
        /** A full-width row, as used in an agenda list. */
        row: 'gap-2 rounded-md border-s-[3px] px-2.5 py-2 text-sm',
      },
      selected: {
        true: 'ring-[2px] ring-ring/70',
        false: '',
      },
      /**
       * Collapse onto one line — for blocks too short to fit two. Centred for
       * the same reason as `chip`: the block's height comes from its caller,
       * so the single line has to be centred in whatever space it is given.
       */
      dense: {
        true: 'flex-row items-center gap-1.5 py-0.5',
        false: '',
      },
    },
    defaultVariants: { variant: 'default', layout: 'chip', selected: false, dense: false },
  },
);

export interface EventBlockProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color' | 'title'>,
    Omit<VariantProps<typeof eventBlockVariants>, 'selected' | 'dense'> {
  /** Event title. Truncated rather than wrapped in `chip` layout. */
  title: string;
  /** Start instant, used to render the time label. */
  start?: Date;
  /** End instant, used to render the time label. */
  end?: Date;
  /** Render as an all-day event: no time label, however `showTime` is set. */
  allDay?: boolean;
  /**
   * Formats an instant for the time label. Views pass a formatter bound to the
   * active calendar system and locale, so times render with Persian digits when
   * the calendar is Jalali.
   * @default 24-hour `HH:mm` with Latin digits
   */
  formatTime?: (date: Date) => string;
  /** Show the time label. Defaults to `true` whenever `start` is given. */
  showTime?: boolean;
  /** Override the variant colour with an explicit CSS colour. */
  color?: string;
  /** Draw as selected. */
  selected?: boolean;
  /**
   * Lay the time and title out on a single line. Time-grid views set this for
   * blocks too short to show two lines without clipping a glyph in half.
   */
  dense?: boolean;
  /** The event continues before the visible window — flatten the leading edge. */
  clippedStart?: boolean;
  /** The event continues after the visible window — flatten the trailing edge. */
  clippedEnd?: boolean;
}

function defaultFormatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/**
 * A single event, rendered inside a month cell (`chip`), a week/day time slot
 * (`block`), or an agenda list (`row`).
 *
 * Purely presentational: it does no date maths and knows nothing about calendar
 * systems — the time label arrives already formatted by whichever view owns it.
 */
export const EventBlock = React.forwardRef<HTMLButtonElement, EventBlockProps>(function EventBlock(
  {
    title,
    start,
    end,
    allDay = false,
    formatTime = defaultFormatTime,
    showTime,
    variant,
    layout = 'chip',
    color,
    selected = false,
    dense = false,
    clippedStart = false,
    clippedEnd = false,
    className,
    style,
    type = 'button',
    ...props
  },
  ref,
) {
  const withTime = (showTime ?? start !== undefined) && !allDay && start !== undefined;
  const timeLabel = withTime
    ? end !== undefined && layout !== 'chip' && !dense
      ? `${formatTime(start)} – ${formatTime(end)}`
      : formatTime(start)
    : undefined;

  const colorStyle: React.CSSProperties | undefined = color
    ? { borderColor: color, backgroundColor: `color-mix(in oklab, ${color} 15%, transparent)`, color }
    : undefined;

  return (
    <button
      ref={ref}
      type={type}
      title={timeLabel ? `${timeLabel} — ${title}` : title}
      className={cn(
        eventBlockVariants({ variant, layout, selected, dense }),
        clippedStart && 'rounded-t-none border-t-0',
        clippedEnd && 'rounded-b-none border-b-0',
        className,
      )}
      style={{ ...colorStyle, ...style }}
      {...props}
    >
      {timeLabel ? (
        <span className={cn('shrink-0 font-medium tabular-nums opacity-80', layout === 'chip' && 'text-[0.625rem]')}>
          {timeLabel}
        </span>
      ) : null}
      <span className={cn('min-w-0 font-medium', layout === 'chip' || dense ? 'truncate' : 'line-clamp-2')}>
        {title}
      </span>
    </button>
  );
});

export { eventBlockVariants };
export type { EventVariant };
