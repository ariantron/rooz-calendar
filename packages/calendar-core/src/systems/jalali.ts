import moment from 'jalali-moment';
import { civilFromDays, daysFromCivil } from '../civil';
import type { CalendarDate, WeekdayIndex } from '../types';
import { BaseCalendarSystem } from './base';
import { JALALI_LOCALES, type LocaleTable } from './locale-data';

/**
 * Conversion is driven entirely through `jalali-moment`'s **string** APIs.
 *
 * A `Date` is never handed to (or taken from) moment, so nothing in this file
 * can be perturbed by the host timezone or a DST transition — the same Jalali
 * date maps to the same day number in Tehran, Auckland and UTC.
 */
const CACHE_LIMIT = 4096;
const jalaliToDayNumberCache = new Map<string, number>();
const dayNumberToJalaliCache = new Map<number, CalendarDate>();

function remember<K, V>(cache: Map<K, V>, key: K, value: V): V {
  if (cache.size >= CACHE_LIMIT) cache.clear();
  cache.set(key, value);
  return value;
}

function parseCivil(formatted: string): { year: number; month: number; day: number } {
  const parts = formatted.split('-').map(Number);
  const [year, month, day] = parts;
  if (year === undefined || month === undefined || day === undefined || Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    throw new RangeError(`jalali: could not convert date (got "${formatted}")`);
  }
  return { year, month, day };
}

/** The Solar Hijri (Jalali / Shamsi) calendar. */
export class JalaliCalendarSystem extends BaseCalendarSystem {
  readonly id = 'jalali';
  readonly monthsInYear = 12;
  /** The Jalali week starts on Saturday — not Sunday, not Monday. */
  readonly defaultWeekStartsOn: WeekdayIndex = 6;
  /** In Iran the weekend is Friday. */
  readonly defaultWeekends: readonly WeekdayIndex[] = [5];
  readonly minYear = 1;
  readonly maxYear = 3000;
  protected readonly localeTable: LocaleTable = JALALI_LOCALES;

  toDayNumber(date: CalendarDate): number {
    const key = `${date.year}/${date.month}/${date.day}`;
    const cached = jalaliToDayNumberCache.get(key);
    if (cached !== undefined) return cached;
    const formatted = moment.from(key, 'fa', 'YYYY/M/D').format('YYYY-MM-DD');
    const civil = parseCivil(formatted);
    return remember(jalaliToDayNumberCache, key, daysFromCivil(civil.year, civil.month, civil.day));
  }

  fromDayNumber(dayNumber: number): CalendarDate {
    const cached = dayNumberToJalaliCache.get(dayNumber);
    if (cached !== undefined) return { ...cached };
    const civil = civilFromDays(dayNumber);
    const formatted = moment(`${civil.year}-${civil.month}-${civil.day}`, 'YYYY-M-D').format('jYYYY-jMM-jDD');
    const parts = parseCivil(formatted);
    const result: CalendarDate = { year: parts.year, month: parts.month, day: parts.day };
    remember(dayNumberToJalaliCache, dayNumber, result);
    return { ...result };
  }

  isLeapYear(year: number): boolean {
    return moment.jIsLeapYear(year);
  }

  daysInMonth(year: number, month: number): number {
    if (month < 1 || month > 12) {
      throw new RangeError(`jalali: month must be 1-12, received ${month}`);
    }
    // The first six months have 31 days, the next five have 30, and Esfand has
    // 29 — or 30 in a leap year. Asked of the library rather than hardcoded so
    // the leap rule stays in one place.
    return moment.jDaysInMonth(year, month - 1);
  }
}

/** Shared singleton instance. Calendar systems are stateless. */
export const jalali = new JalaliCalendarSystem();
