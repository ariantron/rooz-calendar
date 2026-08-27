/**
 * `@rooz-calendar/core` — a calendar-system-agnostic date engine and grid
 * generator, with the Jalali (Shamsi) calendar as a first-class citizen.
 *
 * Nothing in this package computes a grid in Gregorian and relabels it: month
 * lengths, week starts and month boundaries are always asked of the active
 * {@link CalendarSystem}.
 */

export type {
  CalendarDate,
  CalendarSystem,
  Direction,
  FormatOptions,
  NameWidth,
  Numerals,
  Ordering,
  WeekdayIndex,
} from './types';

export {
  defaultNumeralsForLocale,
  getLocaleDirection,
  padNumber,
  primarySubtag,
  toLatinNumerals,
  toNumerals,
} from './numerals';

export { civilFromDays, daysFromCivil, weekdayFromDayNumber } from './civil';
export { formatCalendarDate } from './format';

export { BaseCalendarSystem } from './systems/base';
export { GregorianCalendarSystem, gregorian } from './systems/gregorian';
export { JalaliCalendarSystem, jalali } from './systems/jalali';
export {
  listCalendarSystems,
  registerCalendarSystem,
  resolveCalendarSystem,
  type CalendarSystemInput,
} from './systems/registry';
export type { LocaleNames, LocaleTable } from './systems/locale-data';

export { buildMonthGrid, buildMonthGridForDate } from './grid/month';
export { buildDayGrid, buildWeekGrid, slotStart } from './grid/time';
export { buildAgendaGrid, type AgendaDay, type AgendaGrid, type AgendaGridOptions } from './grid/agenda';
export { isoKeyFromDate, isoKeyFromDayNumber, weekdayOrder } from './grid/shared';
export {
  buildPeriodTitle,
  formatDayRangeTitle,
  getPeriodRange,
  stepPeriod,
  type PeriodKind,
  type PeriodOptions,
} from './grid/title';
export type {
  DayCell,
  GridBase,
  GridOptions,
  MonthGrid,
  MonthGridOptions,
  TimeGrid,
  TimeGridOptions,
  TimeSlot,
  WeekRow,
  WeekdayLabel,
} from './grid/types';

export {
  compareEvents,
  dayNumberOf,
  resolveEvent,
  resolveEvents,
} from './events/resolve';
export {
  allDayEventsForDay,
  eventsForDay,
  groupEventsByDay,
  layoutDayEvents,
} from './events/layout';
export type {
  CalendarEvent,
  EventVariant,
  PositionedEvent,
  ResolvedEvent,
} from './events/types';
