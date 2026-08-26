import { toNumerals } from '../numerals';
import { resolveCalendarSystem } from '../systems/registry';
import { buildDayCell, buildWeekdayLabels, resolveGridContext } from './shared';
import type { DayCell, MonthGrid, MonthGridOptions, WeekRow } from './types';

/**
 * Build a month grid **natively in the active calendar system**.
 *
 * The month's first day, its length and its weekday alignment are all asked of
 * the system itself — nothing here is computed in Gregorian and relabeled. For
 * Jalali that means Farvardin 1405 is laid out from its own Saturday-first
 * week, with Esfand 1404's tail days leading it in.
 *
 * @param year  Year **in the active system** (e.g. `1405`, not `2026`).
 * @param month 1-based month in the active system.
 */
export function buildMonthGrid(year: number, month: number, options: MonthGridOptions): MonthGrid {
  const ctx = resolveGridContext(options);
  const { system } = ctx;

  if (month < 1 || month > system.monthsInYear) {
    throw new RangeError(`${system.id}: month must be 1-${system.monthsInYear}, received ${month}`);
  }

  const firstOfMonth = { year, month, day: 1 };
  const firstDayNumber = system.toDayNumber(firstOfMonth);
  const totalDays = system.daysInMonth(year, month);

  // How many trailing days of the previous month lead this grid in.
  const leading = (system.getWeekday(firstOfMonth) - ctx.weekStartsOn + 7) % 7;
  const rowCount = options.fixedWeeks ? 6 : Math.ceil((leading + totalDays) / 7);
  const gridStart = firstDayNumber - leading;

  const reference = { year, month };
  const weeks: WeekRow[] = [];
  const days: DayCell[] = [];

  for (let row = 0; row < rowCount; row += 1) {
    const rowDays: DayCell[] = [];
    for (let col = 0; col < 7; col += 1) {
      const cell = buildDayCell(ctx, gridStart + row * 7 + col, reference);
      rowDays.push(cell);
      days.push(cell);
    }
    weeks.push({ index: row, days: rowDays });
  }

  const monthLabel = system.getMonthNames(ctx.locale, 'long')[month - 1] ?? String(month);
  const yearLabel = toNumerals(String(year), ctx.numerals);

  return {
    kind: 'month',
    systemId: system.id,
    locale: ctx.locale,
    numerals: ctx.numerals,
    direction: ctx.direction,
    weekStartsOn: ctx.weekStartsOn,
    weekdayLabels: buildWeekdayLabels(ctx),
    year,
    month,
    monthLabel,
    yearLabel,
    title: `${monthLabel} ${yearLabel}`,
    weeks,
    days,
    range: { start: days[0]!.date, end: days[days.length - 1]!.date },
  };
}

/**
 * The month grid containing `date`, resolved through the active system.
 * Handy when a consumer has a native `Date` and no idea what Jalali month it
 * falls in — which is exactly the position most consumers are in.
 */
export function buildMonthGridForDate(date: Date, options: MonthGridOptions): MonthGrid {
  const calendarDate = resolveCalendarSystem(options.system).fromDate(date);
  return buildMonthGrid(calendarDate.year, calendarDate.month, options);
}
