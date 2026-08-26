import { groupEventsByDay } from '../events/layout';
import type { CalendarEvent, ResolvedEvent } from '../events/types';
import { buildDayCell, buildWeekdayLabels, isoKeyFromDayNumber, resolveGridContext } from './shared';
import { formatDayRangeTitle } from './title';
import type { DayCell, GridBase, GridOptions } from './types';

/** One day of an agenda: a full day cell, its heading, and its events. */
export interface AgendaDay extends DayCell {
  /** Heading formatted in the active calendar system, e.g. `شنبه ۱ فروردین`. */
  label: string;
  events: ResolvedEvent[];
}

/** Options for {@link buildAgendaGrid}. */
export interface AgendaGridOptions extends GridOptions {
  /** First day of the range, inclusive. */
  from: Date;
  /** Last day of the range, inclusive. */
  to: Date;
  /** Emit days with no events too. Default `false`. */
  includeEmptyDays?: boolean;
  /**
   * Pattern for each day heading, formatted in the active system.
   * Defaults to `EEEE d MMMM` for RTL locales and `EEEE, MMMM d` otherwise.
   */
  dayLabelPattern?: string;
}

/** A flat, chronological list of days with events. */
export interface AgendaGrid extends GridBase {
  kind: 'agenda';
  days: AgendaDay[];
}

/**
 * Build an agenda over an arbitrary date range.
 *
 * Reuses the same day axis and the same day cells as every other grid, so a
 * Jalali agenda groups and labels days by Jalali dates with no separate code
 * path — and hands consumers back the same `DayCell` shape a month grid does.
 */
export function buildAgendaGrid(
  events: readonly CalendarEvent[] | readonly ResolvedEvent[],
  options: AgendaGridOptions,
): AgendaGrid {
  const ctx = resolveGridContext(options);
  const { system } = ctx;
  const pattern = options.dayLabelPattern ?? (ctx.direction === 'rtl' ? 'EEEE d MMMM' : 'EEEE, MMMM d');
  const format = (date: DayCell['calendarDate']) =>
    system.format(date, pattern, { locale: ctx.locale, numerals: ctx.numerals });

  const fromDayNumber = system.toDayNumber(system.fromDate(options.from));
  const toDayNumber = system.toDayNumber(system.fromDate(options.to));
  if (toDayNumber < fromDayNumber) {
    throw new RangeError('buildAgendaGrid: `to` must not be earlier than `from`');
  }

  const buckets = groupEventsByDay(events, { from: fromDayNumber, to: toDayNumber });
  const anchor = system.fromDayNumber(fromDayNumber);
  const reference = { year: anchor.year, month: anchor.month };

  const days: AgendaDay[] = [];
  for (let dayNumber = fromDayNumber; dayNumber <= toDayNumber; dayNumber += 1) {
    const dayEvents = buckets.get(isoKeyFromDayNumber(dayNumber)) ?? [];
    if (dayEvents.length === 0 && !options.includeEmptyDays) continue;
    const cell = buildDayCell(ctx, dayNumber, reference);
    days.push({ ...cell, label: format(cell.calendarDate), events: dayEvents });
  }

  const start = buildDayCell(ctx, fromDayNumber, reference);
  const end = buildDayCell(ctx, toDayNumber, reference);

  return {
    kind: 'agenda',
    systemId: system.id,
    locale: ctx.locale,
    numerals: ctx.numerals,
    direction: ctx.direction,
    weekStartsOn: ctx.weekStartsOn,
    weekdayLabels: buildWeekdayLabels(ctx),
    title: formatDayRangeTitle(system, ctx, start.calendarDate, end.calendarDate),
    range: { start: start.date, end: end.date },
    days,
  };
}
