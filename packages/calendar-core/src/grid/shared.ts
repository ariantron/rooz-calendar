import { civilFromDays } from '../civil';
import { defaultNumeralsForLocale, getLocaleDirection, padNumber, toNumerals } from '../numerals';
import { resolveCalendarSystem } from '../systems/registry';
import type { CalendarSystem, Direction, Numerals, WeekdayIndex } from '../types';
import type { DayCell, GridOptions, WeekdayLabel } from './types';

/** Everything a grid builder needs, with defaults already resolved. */
export interface ResolvedGridContext {
  system: CalendarSystem;
  locale: string;
  numerals: Numerals;
  direction: Direction;
  weekStartsOn: WeekdayIndex;
  weekends: ReadonlySet<WeekdayIndex>;
  todayDayNumber: number;
}

/** Default locale per system: Jalali grids read as Farsi unless told otherwise. */
function defaultLocaleFor(system: CalendarSystem): string {
  return system.id === 'jalali' ? 'fa' : 'en';
}

export function resolveGridContext(options: GridOptions): ResolvedGridContext {
  const system = resolveCalendarSystem(options.system);
  const locale = options.locale ?? defaultLocaleFor(system);
  const today = options.today ?? new Date();
  return {
    system,
    locale,
    numerals: options.numerals ?? defaultNumeralsForLocale(locale),
    direction: getLocaleDirection(locale),
    weekStartsOn: options.weekStartsOn ?? system.defaultWeekStartsOn,
    weekends: new Set(options.weekends ?? system.defaultWeekends),
    todayDayNumber: system.toDayNumber(system.fromDate(today)),
  };
}

/**
 * The seven weekdays in display order for a given week start.
 * With `weekStartsOn = 6` (Jalali) this yields Sat, Sun, Mon, …, Fri.
 */
export function weekdayOrder(weekStartsOn: WeekdayIndex): WeekdayIndex[] {
  return Array.from({ length: 7 }, (_, i) => (((weekStartsOn + i) % 7) as WeekdayIndex));
}

/** Column headers, already ordered for the active week start. */
export function buildWeekdayLabels(ctx: ResolvedGridContext): WeekdayLabel[] {
  const { system, locale, weekends } = ctx;
  const long = system.getWeekdayNames(locale, 'long');
  const short = system.getWeekdayNames(locale, 'short');
  const narrow = system.getWeekdayNames(locale, 'narrow');
  return weekdayOrder(ctx.weekStartsOn).map((weekday) => ({
    weekday,
    long: long[weekday] ?? '',
    short: short[weekday] ?? '',
    narrow: narrow[weekday] ?? '',
    isWeekend: weekends.has(weekday),
  }));
}

/** ISO `YYYY-MM-DD` for a day number — the system-independent cell key. */
export function isoKeyFromDayNumber(dayNumber: number): string {
  const { year, month, day } = civilFromDays(dayNumber);
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** ISO `YYYY-MM-DD` for a native `Date`, read in local time. */
export function isoKeyFromDate(date: Date): string {
  return `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * Build one day cell from its day number.
 *
 * `referenceMonth` is the month the grid is centred on; cells outside it are
 * the leading/trailing days a month grid shows in grey.
 */
export function buildDayCell(
  ctx: ResolvedGridContext,
  dayNumber: number,
  referenceMonth: { year: number; month: number } | null,
): DayCell {
  const { system } = ctx;
  const calendarDate = system.fromDayNumber(dayNumber);
  const weekday = system.getWeekday(calendarDate);
  return {
    key: isoKeyFromDayNumber(dayNumber),
    date: system.toDate(calendarDate),
    dayNumber,
    calendarDate,
    weekday,
    isCurrentMonth:
      referenceMonth === null ||
      (calendarDate.year === referenceMonth.year && calendarDate.month === referenceMonth.month),
    isToday: dayNumber === ctx.todayDayNumber,
    isWeekend: ctx.weekends.has(weekday),
    dayLabel: toNumerals(String(calendarDate.day), ctx.numerals),
  };
}

/** Localized `HH:mm`. */
export function formatClock(hour: number, minute: number, numerals: Numerals): string {
  return `${padNumber(hour, 2, numerals)}:${padNumber(minute, 2, numerals)}`;
}
