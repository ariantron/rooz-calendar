import { buildDayCell, buildWeekdayLabels, formatClock, resolveGridContext, type ResolvedGridContext } from './shared';
import { formatDayRangeTitle } from './title';
import type { DayCell, TimeGrid, TimeGridOptions, TimeSlot } from './types';

function buildSlots(ctx: ResolvedGridContext, startHour: number, endHour: number, slotMinutes: number): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const totalMinutes = (endHour - startHour) * 60;
  let index = 0;
  for (let offset = 0; offset < totalMinutes; offset += slotMinutes) {
    const absolute = startHour * 60 + offset;
    const hour = Math.floor(absolute / 60);
    const minute = absolute % 60;
    slots.push({
      index,
      hour,
      minute,
      minutesFromStart: offset,
      label: formatClock(hour, minute, ctx.numerals),
      isMajor: minute === 0,
    });
    index += 1;
  }
  return slots;
}

function validateHours(startHour: number, endHour: number, slotMinutes: number): void {
  if (!Number.isInteger(startHour) || startHour < 0 || startHour > 23) {
    throw new RangeError(`startHour must be an integer 0-23, received ${startHour}`);
  }
  if (!Number.isInteger(endHour) || endHour <= startHour || endHour > 24) {
    throw new RangeError(`endHour must be an integer greater than startHour and at most 24, received ${endHour}`);
  }
  if (!Number.isInteger(slotMinutes) || slotMinutes <= 0 || 60 % slotMinutes !== 0) {
    throw new RangeError(`slotMinutes must divide 60 evenly, received ${slotMinutes}`);
  }
}

function buildTimeGrid(
  kind: 'week' | 'day',
  dayNumbers: number[],
  options: TimeGridOptions,
): TimeGrid {
  const ctx = resolveGridContext(options);
  const startHour = options.startHour ?? 0;
  const endHour = options.endHour ?? 24;
  const slotMinutes = options.slotMinutes ?? 60;
  validateHours(startHour, endHour, slotMinutes);

  const anchor = ctx.system.fromDayNumber(dayNumbers[0]!);
  const reference = { year: anchor.year, month: anchor.month };
  const days = dayNumbers.map((dayNumber) => buildDayCell(ctx, dayNumber, reference));

  return {
    kind,
    systemId: ctx.system.id,
    locale: ctx.locale,
    numerals: ctx.numerals,
    direction: ctx.direction,
    weekStartsOn: ctx.weekStartsOn,
    weekdayLabels: buildWeekdayLabels(ctx),
    days,
    slots: buildSlots(ctx, startHour, endHour, slotMinutes),
    startHour,
    endHour,
    slotMinutes,
    totalMinutes: (endHour - startHour) * 60,
    title: formatDayRangeTitle(ctx.system, ctx, days[0]!.calendarDate, days[days.length - 1]!.calendarDate),
    range: { start: days[0]!.date, end: days[days.length - 1]!.date },
  };
}

/**
 * Build the week grid containing `date`.
 *
 * Week alignment comes from the active system: a Jalali week runs
 * Saturday → Friday, so the same `date` produces a different set of seven days
 * than it would under Gregorian's Sunday-first week.
 */
export function buildWeekGrid(date: Date, options: TimeGridOptions): TimeGrid {
  const ctx = resolveGridContext(options);
  const dayNumber = ctx.system.toDayNumber(ctx.system.fromDate(date));
  const offset = (ctx.system.getWeekday(ctx.system.fromDayNumber(dayNumber)) - ctx.weekStartsOn + 7) % 7;
  const start = dayNumber - offset;
  return buildTimeGrid('week', Array.from({ length: 7 }, (_, i) => start + i), options);
}

/** Build a single-day time grid for `date`. */
export function buildDayGrid(date: Date, options: TimeGridOptions): TimeGrid {
  const ctx = resolveGridContext(options);
  const dayNumber = ctx.system.toDayNumber(ctx.system.fromDate(date));
  return buildTimeGrid('day', [dayNumber], options);
}

/** The exact `Date` a slot starts at on a given day. */
export function slotStart(day: DayCell, slot: TimeSlot): Date {
  const date = new Date(day.date);
  date.setHours(slot.hour, slot.minute, 0, 0);
  return date;
}
