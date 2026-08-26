import { civilFromDays, daysFromCivil } from '../civil';
import type { WeekdayIndex } from '../types';
import { BaseCalendarSystem } from './base';
import { GREGORIAN_LOCALES, type LocaleTable } from './locale-data';

const MONTH_LENGTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;

/** The proleptic Gregorian calendar. */
export class GregorianCalendarSystem extends BaseCalendarSystem {
  readonly id = 'gregorian';
  readonly monthsInYear = 12;
  /** Sunday, matching the JS/US convention. Override per-grid for ISO weeks. */
  readonly defaultWeekStartsOn: WeekdayIndex = 0;
  readonly defaultWeekends: readonly WeekdayIndex[] = [0, 6];
  readonly minYear = 1;
  readonly maxYear = 9999;
  protected readonly localeTable: LocaleTable = GREGORIAN_LOCALES;

  toDayNumber(date: { year: number; month: number; day: number }): number {
    return daysFromCivil(date.year, date.month, date.day);
  }

  fromDayNumber(dayNumber: number): { year: number; month: number; day: number } {
    return civilFromDays(dayNumber);
  }

  isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }

  daysInMonth(year: number, month: number): number {
    if (month < 1 || month > 12) {
      throw new RangeError(`gregorian: month must be 1-12, received ${month}`);
    }
    if (month === 2) return this.isLeapYear(year) ? 29 : 28;
    return MONTH_LENGTHS[month - 1]!;
  }
}

/** Shared singleton instance. Calendar systems are stateless. */
export const gregorian = new GregorianCalendarSystem();
