import { defaultNumeralsForLocale, padNumber, toNumerals } from './numerals';
import type { CalendarDate, CalendarSystem, FormatOptions, Numerals } from './types';

/** Time-of-day parts, only available when formatting a native `Date`. */
interface TimeParts {
  hours: number;
  minutes: number;
  seconds: number;
}

const TOKEN_RE = /'([^']*)'|(y{1,4}|M{1,4}|d{1,2}|E{1,5}|H{1,2}|h{1,2}|m{1,2}|s{1,2}|a)/g;

/**
 * Shared token formatter used by every calendar system.
 *
 * The system supplies its own month and weekday names, so the exact same
 * pattern renders "March 2026" for Gregorian and "فروردین ۱۴۰۵" for Jalali.
 */
export function formatCalendarDate(
  system: CalendarSystem,
  date: CalendarDate,
  pattern: string,
  options: FormatOptions = {},
  time?: TimeParts,
): string {
  const locale = options.locale ?? 'en';
  const numerals: Numerals = options.numerals ?? defaultNumeralsForLocale(locale);
  const monthNamesLong = system.getMonthNames(locale, 'long');
  const monthNamesShort = system.getMonthNames(locale, 'short');
  const weekdayLong = system.getWeekdayNames(locale, 'long');
  const weekdayShort = system.getWeekdayNames(locale, 'short');
  const weekdayNarrow = system.getWeekdayNames(locale, 'narrow');
  const weekday = system.getWeekday(date);
  const t: TimeParts = time ?? { hours: 0, minutes: 0, seconds: 0 };

  return pattern.replace(TOKEN_RE, (_match, literal: string | undefined, token: string | undefined) => {
    if (literal !== undefined) return literal === '' ? "'" : literal;
    switch (token) {
      case 'yyyy':
        return padNumber(date.year, 4, numerals);
      case 'yyy':
      case 'yy':
        return padNumber(date.year % 100, 2, numerals);
      case 'y':
        return toNumerals(String(date.year), numerals);
      case 'MMMM':
        return monthNamesLong[date.month - 1] ?? '';
      case 'MMM':
        return monthNamesShort[date.month - 1] ?? '';
      case 'MM':
        return padNumber(date.month, 2, numerals);
      case 'M':
        return toNumerals(String(date.month), numerals);
      case 'dd':
        return padNumber(date.day, 2, numerals);
      case 'd':
        return toNumerals(String(date.day), numerals);
      case 'EEEEE':
        return weekdayNarrow[weekday] ?? '';
      case 'EEEE':
        return weekdayLong[weekday] ?? '';
      case 'EEE':
      case 'EE':
      case 'E':
        return weekdayShort[weekday] ?? '';
      case 'HH':
        return padNumber(t.hours, 2, numerals);
      case 'H':
        return toNumerals(String(t.hours), numerals);
      case 'hh':
        return padNumber(t.hours % 12 === 0 ? 12 : t.hours % 12, 2, numerals);
      case 'h':
        return toNumerals(String(t.hours % 12 === 0 ? 12 : t.hours % 12), numerals);
      case 'mm':
        return padNumber(t.minutes, 2, numerals);
      case 'm':
        return toNumerals(String(t.minutes), numerals);
      case 'ss':
        return padNumber(t.seconds, 2, numerals);
      case 's':
        return toNumerals(String(t.seconds), numerals);
      case 'a':
        return meridiem(t.hours, locale);
      default:
        return token ?? '';
    }
  });
}

function meridiem(hours: number, locale: string): string {
  const isPm = hours >= 12;
  if (locale.toLowerCase().startsWith('fa')) return isPm ? 'ب.ظ' : 'ق.ظ';
  return isPm ? 'PM' : 'AM';
}

/** Extract local time-of-day parts from a `Date`. */
export function timePartsOf(date: Date): TimeParts {
  return { hours: date.getHours(), minutes: date.getMinutes(), seconds: date.getSeconds() };
}
