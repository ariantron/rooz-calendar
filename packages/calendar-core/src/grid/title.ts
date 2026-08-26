import { toNumerals } from '../numerals';
import type { CalendarDate, CalendarSystem, Direction, Numerals } from '../types';
import { resolveGridContext } from './shared';
import type { GridOptions } from './types';

/** The period a title or a navigation step applies to. */
export type PeriodKind = 'month' | 'week' | 'day' | 'agenda';

interface TitleContext {
  locale: string;
  numerals: Numerals;
  direction: Direction;
}

/**
 * Format a run of days as a range title, e.g. `March 29 – April 4, 2026` or
 * `۳۱ مرداد – ۶ شهریور ۱۴۰۵`.
 *
 * Month and year are elided when both ends share them, and the whole thing is
 * reordered for RTL locales, where the day precedes the month.
 */
export function formatDayRangeTitle(
  system: CalendarSystem,
  ctx: TitleContext,
  first: CalendarDate,
  last: CalendarDate,
): string {
  const months = system.getMonthNames(ctx.locale, 'long');
  const firstMonth = months[first.month - 1] ?? '';
  const lastMonth = months[last.month - 1] ?? '';
  const num = (value: number) => toNumerals(String(value), ctx.numerals);
  const rtl = ctx.direction === 'rtl';

  const single = first.year === last.year && first.month === last.month && first.day === last.day;
  if (single) {
    return rtl
      ? `${num(first.day)} ${firstMonth} ${num(first.year)}`
      : `${firstMonth} ${num(first.day)}, ${num(first.year)}`;
  }

  const sameMonth = first.year === last.year && first.month === last.month;
  const sameYear = first.year === last.year;

  if (rtl) {
    if (sameMonth) return `${num(first.day)} – ${num(last.day)} ${firstMonth} ${num(first.year)}`;
    if (sameYear) return `${num(first.day)} ${firstMonth} – ${num(last.day)} ${lastMonth} ${num(first.year)}`;
    return `${num(first.day)} ${firstMonth} ${num(first.year)} – ${num(last.day)} ${lastMonth} ${num(last.year)}`;
  }
  if (sameMonth) return `${firstMonth} ${num(first.day)} – ${num(last.day)}, ${num(first.year)}`;
  if (sameYear) return `${firstMonth} ${num(first.day)} – ${lastMonth} ${num(last.day)}, ${num(first.year)}`;
  return `${firstMonth} ${num(first.day)}, ${num(first.year)} – ${lastMonth} ${num(last.day)}, ${num(last.year)}`;
}

/** Options for period titles and navigation. */
export interface PeriodOptions extends GridOptions {
  /** Days an agenda period covers. @default 30 */
  agendaDays?: number;
}

/** The inclusive first and last day a period covers, in the active system. */
export function getPeriodRange(
  kind: PeriodKind,
  date: Date,
  options: PeriodOptions,
): { first: CalendarDate; last: CalendarDate } {
  const ctx = resolveGridContext(options);
  const { system } = ctx;
  const calendarDate = system.fromDate(date);

  switch (kind) {
    case 'month': {
      return {
        first: { year: calendarDate.year, month: calendarDate.month, day: 1 },
        last: {
          year: calendarDate.year,
          month: calendarDate.month,
          day: system.daysInMonth(calendarDate.year, calendarDate.month),
        },
      };
    }
    case 'week': {
      const offset = (system.getWeekday(calendarDate) - ctx.weekStartsOn + 7) % 7;
      const start = system.addDays(calendarDate, -offset);
      return { first: start, last: system.addDays(start, 6) };
    }
    case 'day':
      return { first: calendarDate, last: calendarDate };
    case 'agenda':
      return { first: calendarDate, last: system.addDays(calendarDate, Math.max(0, (options.agendaDays ?? 30) - 1)) };
  }
}

/**
 * The header title for a period, formatted in the active calendar system.
 *
 * Keeps title formatting in one place, so a header rendered next to a view
 * always agrees with the grid that view built.
 */
export function buildPeriodTitle(kind: PeriodKind, date: Date, options: PeriodOptions): string {
  const ctx = resolveGridContext(options);
  const { system } = ctx;
  const { first, last } = getPeriodRange(kind, date, options);

  if (kind === 'month') {
    const monthName = system.getMonthNames(ctx.locale, 'long')[first.month - 1] ?? String(first.month);
    return `${monthName} ${toNumerals(String(first.year), ctx.numerals)}`;
  }
  if (kind === 'day') {
    return system.format(first, ctx.direction === 'rtl' ? 'EEEE d MMMM yyyy' : 'EEEE, MMMM d, yyyy', {
      locale: ctx.locale,
      numerals: ctx.numerals,
    });
  }
  return formatDayRangeTitle(system, ctx, first, last);
}

/**
 * Step forward or back by whole periods, **in the active calendar system**.
 *
 * Stepping a month in Jalali moves Jalali months, so Farvardin → Ordibehesht,
 * not "the same date plus 30-ish days".
 */
export function stepPeriod(kind: PeriodKind, date: Date, delta: number, options: PeriodOptions): Date {
  const system = resolveGridContext(options).system;
  const calendarDate = system.fromDate(date);

  switch (kind) {
    case 'month':
      return system.toDate(system.addMonths(calendarDate, delta));
    case 'week':
      return system.toDate(system.addDays(calendarDate, delta * 7));
    case 'day':
      return system.toDate(system.addDays(calendarDate, delta));
    case 'agenda':
      return system.toDate(system.addDays(calendarDate, delta * Math.max(1, options.agendaDays ?? 30)));
  }
}
