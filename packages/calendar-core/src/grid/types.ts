import type { CalendarSystemInput } from '../systems/registry';
import type { CalendarDate, Direction, Numerals, WeekdayIndex } from '../types';

/** Options shared by every grid builder. */
export interface GridOptions {
  /** Calendar system instance, or the id of a registered one. */
  system: CalendarSystemInput;
  /** Locale used for labels. Defaults to `en`, or `fa` for the Jalali system. */
  locale?: string;
  /** Digit shaping for numeric labels. Defaults to the locale's convention. */
  numerals?: Numerals;
  /** Override the system's own week start (Jalali defaults to Saturday). */
  weekStartsOn?: WeekdayIndex;
  /** Override which weekdays are shaded as weekends. */
  weekends?: readonly WeekdayIndex[];
  /** Injectable "now", so grids are deterministic in tests and under SSR. */
  today?: Date;
}

/** One day in a grid. */
export interface DayCell {
  /**
   * Stable identity for this day: the ISO Gregorian date (`YYYY-MM-DD`).
   *
   * Deliberately system-independent, so the same physical day has the same key
   * whether the grid is rendered in Gregorian or Jalali — which is what makes
   * event lookup work without knowing the active system.
   */
  key: string;
  /** Native `Date` at local midnight. */
  date: Date;
  /** Days since 1970-01-01. */
  dayNumber: number;
  /** This day in the active system's own year/month/day numbering. */
  calendarDate: CalendarDate;
  /** Absolute weekday, `0` = Sunday. */
  weekday: WeekdayIndex;
  /** Whether this day belongs to the month the grid is centred on. */
  isCurrentMonth: boolean;
  /** Whether this day is "today" in the active system. */
  isToday: boolean;
  /** Whether this weekday is configured as a weekend. */
  isWeekend: boolean;
  /** Localized day-of-month number, e.g. `12` or `۱۲`. */
  dayLabel: string;
}

/** A row of seven days, ordered from the active week start. */
export interface WeekRow {
  /** Zero-based row index within the grid. */
  index: number;
  days: DayCell[];
}

/** A column header for a grid. */
export interface WeekdayLabel {
  weekday: WeekdayIndex;
  long: string;
  short: string;
  narrow: string;
  isWeekend: boolean;
}

/** Fields every grid exposes, whatever its shape. */
export interface GridBase {
  systemId: string;
  locale: string;
  numerals: Numerals;
  direction: Direction;
  weekStartsOn: WeekdayIndex;
  weekdayLabels: WeekdayLabel[];
  /** Header text, formatted in the active system and locale. */
  title: string;
  /** First and last day covered by the grid, inclusive. */
  range: { start: Date; end: Date };
}

/** A month laid out as weeks of days, in the active calendar system. */
export interface MonthGrid extends GridBase {
  kind: 'month';
  /** Year and month **in the active system** (Jalali 1405 / month 1, say). */
  year: number;
  month: number;
  monthLabel: string;
  yearLabel: string;
  weeks: WeekRow[];
  /** Every cell in reading order, flattened. */
  days: DayCell[];
}

/** One row of a time grid — a slot boundary shared across all its days. */
export interface TimeSlot {
  index: number;
  hour: number;
  minute: number;
  /** Minutes from the grid's first slot, useful for positioning. */
  minutesFromStart: number;
  /** Localized `HH:mm` label. */
  label: string;
  /** True when the slot sits exactly on the hour. */
  isMajor: boolean;
}

/** A week or a single day, laid out as days × time slots. */
export interface TimeGrid extends GridBase {
  kind: 'week' | 'day';
  days: DayCell[];
  slots: TimeSlot[];
  /** First hour shown, 0–23. */
  startHour: number;
  /** Exclusive end hour, 1–24. */
  endHour: number;
  /** Minutes per slot row. */
  slotMinutes: number;
  /** Total minutes spanned by the grid, for percentage positioning. */
  totalMinutes: number;
}

/** Options for {@link buildMonthGrid}. */
export interface MonthGridOptions extends GridOptions {
  /** Always emit six week rows, so the grid height never jumps. */
  fixedWeeks?: boolean;
}

/** Options for {@link buildWeekGrid} and {@link buildDayGrid}. */
export interface TimeGridOptions extends GridOptions {
  /** First hour shown. Default `0`. */
  startHour?: number;
  /** Exclusive end hour. Default `24`. */
  endHour?: number;
  /** Minutes per slot row. Default `60`. */
  slotMinutes?: number;
}
