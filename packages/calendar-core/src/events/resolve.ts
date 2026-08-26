import { daysFromCivil } from '../civil';
import type { CalendarEvent, ResolvedEvent } from './types';

const DEFAULT_DURATION_MINUTES = 60;
const MS_PER_MINUTE = 60_000;

function toDate(value: Date | string, field: string, id: string): Date {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new RangeError(`Event "${id}" has an unparseable ${field}: ${String(value)}`);
  }
  return date;
}

/** Day number of a `Date`, read in local time. */
export function dayNumberOf(date: Date): number {
  return daysFromCivil(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

/**
 * Parse one event's instants and work out which days it touches.
 *
 * `end` is treated as exclusive, so a meeting 09:00–10:00 occupies only the
 * 09:00 slot, and an all-day event ending at the next midnight covers one day.
 */
export function resolveEvent(event: CalendarEvent): ResolvedEvent {
  const start = toDate(event.start, 'start', event.id);
  const allDay = event.allDay ?? false;
  let end = event.end === undefined ? undefined : toDate(event.end, 'end', event.id);

  if (end === undefined || end.getTime() <= start.getTime()) {
    if (allDay) {
      end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
    } else {
      end = new Date(start.getTime() + DEFAULT_DURATION_MINUTES * MS_PER_MINUTE);
    }
  }

  const startDayNumber = dayNumberOf(start);
  // The exclusive end lands on the next day at midnight for a full day; step
  // back a millisecond so the event does not claim a day it never occupies.
  const endDayNumber = Math.max(startDayNumber, dayNumberOf(new Date(end.getTime() - 1)));

  return {
    id: event.id,
    title: event.title,
    start,
    end,
    allDay,
    variant: event.variant ?? 'default',
    color: event.color,
    meta: event.meta,
    startDayNumber,
    endDayNumber,
    isMultiDay: endDayNumber > startDayNumber,
    source: event,
  };
}

/** Chronological ordering: all-day first, then by start, then by title. */
export function compareEvents(a: ResolvedEvent, b: ResolvedEvent): number {
  if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
  if (a.isMultiDay !== b.isMultiDay) return a.isMultiDay ? -1 : 1;
  const byStart = a.start.getTime() - b.start.getTime();
  if (byStart !== 0) return byStart;
  const byLength = b.end.getTime() - b.start.getTime() - (a.end.getTime() - a.start.getTime());
  if (byLength !== 0) return byLength;
  return a.title.localeCompare(b.title);
}

/** Resolve and sort a list of events. Invalid events throw, loudly and early. */
export function resolveEvents(events: readonly CalendarEvent[]): ResolvedEvent[] {
  return events.map(resolveEvent).sort(compareEvents);
}
