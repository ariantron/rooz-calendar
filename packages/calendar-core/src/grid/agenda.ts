import { buildAgenda } from '../events/layout';
import type { AgendaDay, CalendarEvent, ResolvedEvent } from '../events/types';
import { buildWeekdayLabels, resolveGridContext } from './shared';
import type { GridBase, GridOptions } from './types';

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
 * Reuses the same day axis as every other grid, so a Jalali agenda groups and
 * labels days by Jalali dates without any separate code path.
 */
export function buildAgendaGrid(
  events: readonly CalendarEvent[] | readonly ResolvedEvent[],
  options: AgendaGridOptions,
): AgendaGrid {
  const ctx = resolveGridContext(options);
  const { system } = ctx;
  const pattern = options.dayLabelPattern ?? (ctx.direction === 'rtl' ? 'EEEE d MMMM' : 'EEEE, MMMM d');

  const fromDayNumber = system.toDayNumber(system.fromDate(options.from));
  const toDayNumber = system.toDayNumber(system.fromDate(options.to));
  if (toDayNumber < fromDayNumber) {
    throw new RangeError('buildAgendaGrid: `to` must not be earlier than `from`');
  }

  const days = buildAgenda(events, {
    from: { dayNumber: fromDayNumber },
    to: { dayNumber: toDayNumber },
    todayDayNumber: ctx.todayDayNumber,
    includeEmptyDays: options.includeEmptyDays,
    dateForDayNumber: (dayNumber) => system.toDate(system.fromDayNumber(dayNumber)),
    formatDayLabel: (dayNumber) =>
      system.format(system.fromDayNumber(dayNumber), pattern, { locale: ctx.locale, numerals: ctx.numerals }),
  });

  const start = system.toDate(system.fromDayNumber(fromDayNumber));
  const end = system.toDate(system.fromDayNumber(toDayNumber));
  const title = `${system.format(start, pattern, { locale: ctx.locale, numerals: ctx.numerals })} – ${system.format(end, pattern, { locale: ctx.locale, numerals: ctx.numerals })}`;

  return {
    kind: 'agenda',
    systemId: system.id,
    locale: ctx.locale,
    numerals: ctx.numerals,
    direction: ctx.direction,
    weekStartsOn: ctx.weekStartsOn,
    weekdayLabels: buildWeekdayLabels(ctx),
    title,
    range: { start, end },
    days,
  };
}
