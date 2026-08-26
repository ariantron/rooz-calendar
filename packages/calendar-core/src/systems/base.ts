import { civilFromDays, daysFromCivil, toLocalDate, weekdayFromDayNumber } from '../civil';
import { formatCalendarDate, timePartsOf } from '../format';
import type { CalendarDate, CalendarSystem, FormatOptions, NameWidth, WeekdayIndex } from '../types';
import { resolveNames, type LocaleTable } from './locale-data';

/**
 * Shared implementation of every operation that can be derived from a small set
 * of primitives.
 *
 * A new calendar system only has to supply:
 * `toDayNumber`, `fromDayNumber`, `daysInMonth`, `isLeapYear`, and its locale
 * name table. Everything else — week alignment, month arithmetic, formatting —
 * comes from here and therefore behaves identically across systems.
 */
export abstract class BaseCalendarSystem implements CalendarSystem {
  abstract readonly id: string;
  abstract readonly monthsInYear: number;
  abstract readonly defaultWeekStartsOn: WeekdayIndex;
  abstract readonly defaultWeekends: readonly WeekdayIndex[];
  abstract readonly minYear: number;
  abstract readonly maxYear: number;

  /** Locale name table used by {@link getMonthNames} / {@link getWeekdayNames}. */
  protected abstract readonly localeTable: LocaleTable;

  abstract toDayNumber(date: CalendarDate): number;
  abstract fromDayNumber(dayNumber: number): CalendarDate;
  abstract daysInMonth(year: number, month: number): number;
  abstract isLeapYear(year: number): boolean;

  fromDate(date: Date): CalendarDate {
    // Read the Date in *local* time, then hop onto the shared day-number axis.
    return this.fromDayNumber(daysFromCivil(date.getFullYear(), date.getMonth() + 1, date.getDate()));
  }

  toDate(date: CalendarDate): Date {
    const civil = civilFromDays(this.toDayNumber(date));
    return toLocalDate(civil.year, civil.month, civil.day);
  }

  daysInYear(year: number): number {
    let total = 0;
    for (let month = 1; month <= this.monthsInYear; month += 1) total += this.daysInMonth(year, month);
    return total;
  }

  getWeekday(date: CalendarDate): WeekdayIndex {
    return weekdayFromDayNumber(this.toDayNumber(date)) as WeekdayIndex;
  }

  addDays(date: CalendarDate, amount: number): CalendarDate {
    if (amount === 0) return { ...date };
    return this.fromDayNumber(this.toDayNumber(date) + amount);
  }

  addMonths(date: CalendarDate, amount: number): CalendarDate {
    if (amount === 0) return { ...date };
    const zeroBased = date.month - 1 + amount;
    const yearDelta = Math.floor(zeroBased / this.monthsInYear);
    const year = date.year + yearDelta;
    const month = zeroBased - yearDelta * this.monthsInYear + 1;
    return { year, month, day: Math.min(date.day, this.daysInMonth(year, month)) };
  }

  addYears(date: CalendarDate, amount: number): CalendarDate {
    if (amount === 0) return { ...date };
    const year = date.year + amount;
    return { year, month: date.month, day: Math.min(date.day, this.daysInMonth(year, date.month)) };
  }

  isValid(date: CalendarDate): boolean {
    if (!Number.isInteger(date.year) || !Number.isInteger(date.month) || !Number.isInteger(date.day)) return false;
    if (date.year < this.minYear || date.year > this.maxYear) return false;
    if (date.month < 1 || date.month > this.monthsInYear) return false;
    return date.day >= 1 && date.day <= this.daysInMonth(date.year, date.month);
  }

  getMonthNames(locale?: string, width: NameWidth = 'long'): readonly string[] {
    return resolveNames(this.localeTable, locale).months[width];
  }

  getWeekdayNames(locale?: string, width: NameWidth = 'short'): readonly string[] {
    return resolveNames(this.localeTable, locale).weekdays[width];
  }

  format(date: Date | CalendarDate, pattern: string, options: FormatOptions = {}): string {
    const isNative = date instanceof Date;
    const calendarDate = isNative ? this.fromDate(date) : date;
    const time = isNative ? timePartsOf(date) : undefined;
    return formatCalendarDate(this, calendarDate, pattern, options, time);
  }
}
