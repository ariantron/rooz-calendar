import type {
  CalendarEvent,
  CalendarSystemInput,
  DayCell,
  Numerals,
  ResolvedEvent,
  WeekdayIndex,
} from '@rooz-calendar/core';

/**
 * Props every view shares.
 *
 * Deliberately small and identical across Month/Week/Day/Agenda, so swapping
 * views in a consuming app is a one-word change.
 */
export interface CalendarViewBaseProps {
  /** The date the view is centred on. @default today */
  date?: Date;
  /**
   * Events to render. Instants are native `Date`s or ISO strings — never
   * calendar-system fields, so the same array works in every system.
   */
  events?: readonly CalendarEvent[];
  /** Active calendar system, or the id of a registered one. @default 'gregorian' */
  calendarSystem?: CalendarSystemInput;
  /** Locale for labels and direction. @default 'en', or 'fa' for Jalali */
  locale?: string;
  /** Digit shaping. @default the locale's convention */
  numerals?: Numerals;
  /** Override the system's own week start. */
  weekStartsOn?: WeekdayIndex;
  /** Override which weekdays are shaded as weekends. */
  weekends?: readonly WeekdayIndex[];
  /** Injectable "now", so views are deterministic in tests and stories. */
  today?: Date;
  /** Day to render as selected. */
  selectedDate?: Date | null;
  /**
   * Fired when an event is clicked, with the consumer's own event object and
   * the resolved occurrence (parsed instants, day span).
   */
  onEventClick?: (event: CalendarEvent, occurrence: ResolvedEvent) => void;
  /**
   * Fired when a day or time slot is chosen. `cell.key` is the ISO
   * `YYYY-MM-DD` string for the day, whichever calendar system is active.
   */
  onDateSelect?: (date: Date, cell: DayCell) => void;
  className?: string;
}

/** Props shared by the two time-grid views. */
export interface TimeViewBaseProps extends CalendarViewBaseProps {
  /** First hour shown. @default 7 */
  startHour?: number;
  /** Exclusive end hour. @default 21 */
  endHour?: number;
  /** Minutes per slot row. @default 60 */
  slotMinutes?: number;
  /** Height in pixels of one slot row. @default 48 */
  slotHeight?: number;
}
