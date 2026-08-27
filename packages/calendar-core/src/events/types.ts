/**
 * Event shapes.
 *
 * Events are deliberately **calendar-system-agnostic**: a consumer passes
 * native `Date`s or ISO 8601 strings and gets ISO strings back, and never has
 * to know or care whether the view is currently rendering Gregorian or Jalali.
 */

/** Built-in colour variants understood by `@rooz-calendar/ui`'s `EventBlock`. */
export type EventVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'muted';

/** An event as supplied by a consumer. */
export interface CalendarEvent {
  /** Stable identity. Used as the React key and echoed back in callbacks. */
  id: string;
  title: string;
  /** Start instant: a `Date` or an ISO 8601 string. */
  start: Date | string;
  /**
   * End instant, **exclusive**. Optional — a timed event without an end is
   * treated as one hour long, an all-day event as a single day.
   */
  end?: Date | string;
  /** Render across the whole day rather than at a time slot. */
  allDay?: boolean;
  variant?: EventVariant;
  /** Explicit CSS colour, overriding `variant`. */
  color?: string;
  /** Opaque passenger data, handed back untouched in callbacks. */
  meta?: unknown;
}

/** An event with its instants parsed and its day span computed. */
export interface ResolvedEvent {
  id: string;
  title: string;
  start: Date;
  /** Exclusive end instant. */
  end: Date;
  allDay: boolean;
  variant: EventVariant;
  color?: string;
  meta?: unknown;
  /** Day number of the first day this event touches. */
  startDayNumber: number;
  /** Day number of the last day this event touches, **inclusive**. */
  endDayNumber: number;
  /** True when the event covers more than one day. */
  isMultiDay: boolean;
  /** The original object, untouched. */
  source: CalendarEvent;
}

/** An event positioned inside a time grid column. */
export interface PositionedEvent {
  event: ResolvedEvent;
  /** Fraction (0–1) of the grid height at which the block starts. */
  top: number;
  /** Fraction (0–1) of the grid height the block occupies. */
  height: number;
  /** Column index within its overlap cluster. */
  column: number;
  /** How many columns the cluster was split into. */
  columnCount: number;
  /** True when the event begins before the grid's first visible hour. */
  clippedStart: boolean;
  /** True when the event ends after the grid's last visible hour. */
  clippedEnd: boolean;
}
