/**
 * Core, calendar-system-agnostic types.
 *
 * Everything in this package is expressed in terms of a {@link CalendarSystem}.
 * Nothing here assumes the Gregorian calendar: month lengths, week starts and
 * year boundaries are always asked of the active system.
 */

/**
 * Absolute weekday index, using the JavaScript convention
 * (`0` = Sunday … `6` = Saturday).
 *
 * This is deliberately *not* relative to a calendar system's week start — it is
 * a stable, system-independent identifier for "which day of the week is this".
 * Ordering a grid by a system's own week start is the job of the grid builders.
 */
export type WeekdayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * A date expressed in some calendar system's own numbering.
 *
 * `month` is **1-based** (1 = the system's first month — January for Gregorian,
 * Farvardin for Jalali). `day` is 1-based.
 */
export interface CalendarDate {
  year: number;
  /** 1-based month number in the owning calendar system. */
  month: number;
  /** 1-based day of month in the owning calendar system. */
  day: number;
}

/** Width of a localized month or weekday name. */
export type NameWidth = 'long' | 'short' | 'narrow';

/**
 * Numeral system used when rendering digits.
 *
 * - `latn` — Western digits (0123456789)
 * - `arabext` — Extended Arabic-Indic / Persian digits (۰۱۲۳۴۵۶۷۸۹)
 * - `arab` — Arabic-Indic digits (٠١٢٣٤٥٦٧٨٩)
 *
 * Digit shaping is always an explicit option: a consumer may want Jalali dates
 * rendered with Latin digits, and that must stay possible.
 */
export type Numerals = 'latn' | 'arabext' | 'arab';

/** Text direction for a locale. */
export type Direction = 'ltr' | 'rtl';

/** Options accepted by {@link CalendarSystem.format}. */
export interface FormatOptions {
  /** BCP-47-ish locale tag. Resolved by primary subtag, e.g. `fa-IR` → `fa`. */
  locale?: string;
  /** Digit shaping. Defaults to the locale's conventional numerals. */
  numerals?: Numerals;
}

/**
 * The one interface every calendar system implements.
 *
 * Adding a new calendar system (Hijri, for instance) means implementing this
 * interface and registering it — no consumer of `@rooz/calendar-core` and no
 * component in `@rooz/calendar-ui` needs to change.
 */
export interface CalendarSystem {
  /** Stable identifier, e.g. `gregorian`, `jalali`. */
  readonly id: string;

  /** Number of months in a year in this system. */
  readonly monthsInYear: number;

  /**
   * The weekday this system's week conventionally starts on.
   * Gregorian defaults to Sunday (`0`); Jalali starts on Saturday (`6`).
   * Callers may always override this per-grid.
   */
  readonly defaultWeekStartsOn: WeekdayIndex;

  /** Weekdays conventionally treated as non-working days in this system. */
  readonly defaultWeekends: readonly WeekdayIndex[];

  /** Smallest/largest year this system can represent reliably. */
  readonly minYear: number;
  readonly maxYear: number;

  /** Convert a native `Date` (read in local time) into this system's fields. */
  fromDate(date: Date): CalendarDate;

  /** Convert this system's fields into a native `Date` at **local midnight**. */
  toDate(date: CalendarDate): Date;

  /**
   * Convert to a proleptic day number — days elapsed since 1970-01-01.
   *
   * This is the system-independent linear axis every other operation is built
   * on. It is pure integer math and never touches `Date`, so it is immune to
   * timezone and DST effects.
   */
  toDayNumber(date: CalendarDate): number;

  /** Inverse of {@link CalendarSystem.toDayNumber}. */
  fromDayNumber(dayNumber: number): CalendarDate;

  /** Days in the given month of the given year, in this system. */
  daysInMonth(year: number, month: number): number;

  /** Whether the given year is a leap year in this system. */
  isLeapYear(year: number): boolean;

  /** Days in the given year, in this system. */
  daysInYear(year: number): number;

  /** Absolute weekday (`0` = Sunday) of a date in this system. */
  getWeekday(date: CalendarDate): WeekdayIndex;

  /** Add (or subtract) whole days, staying inside this system. */
  addDays(date: CalendarDate, amount: number): CalendarDate;

  /**
   * Add (or subtract) whole months, staying inside this system.
   * The day is clamped to the target month's length (Esfand 30 + 1 month
   * lands on Farvardin 30, and Farvardin 31 − 1 month clamps to Esfand 29/30).
   */
  addMonths(date: CalendarDate, amount: number): CalendarDate;

  /** Add (or subtract) whole years, clamping the day the same way. */
  addYears(date: CalendarDate, amount: number): CalendarDate;

  /** Whether the given fields form a real date in this system. */
  isValid(date: CalendarDate): boolean;

  /** Localized month names, index `0` = first month of the year. */
  getMonthNames(locale?: string, width?: NameWidth): readonly string[];

  /**
   * Localized weekday names, indexed by {@link WeekdayIndex}
   * (`0` = Sunday), regardless of where this system's week starts.
   */
  getWeekdayNames(locale?: string, width?: NameWidth): readonly string[];

  /**
   * Format a date using this system's own month/day names.
   *
   * Supported tokens: `yyyy` `yy` `MMMM` `MMM` `MM` `M` `dd` `d`
   * `EEEE` `EEE` `EEEEE` `HH` `H` `mm` `m` `a`.
   * Text inside single quotes is emitted literally.
   */
  format(date: Date | CalendarDate, pattern: string, options?: FormatOptions): string;
}

/** Comparison result helper. */
export type Ordering = -1 | 0 | 1;
