import { isoKeyFromDayNumber } from '../grid/shared';
import type { DayCell, TimeGrid } from '../grid/types';
import { compareEvents, resolveEvents } from './resolve';
import type { CalendarEvent, PositionedEvent, ResolvedEvent } from './types';

/**
 * Bucket events by day key, expanding multi-day events into every day they
 * touch. Keys match {@link DayCell.key}, so lookup from a rendered cell is a
 * plain map read and stays identical across calendar systems.
 */
export function groupEventsByDay(
  events: readonly CalendarEvent[] | readonly ResolvedEvent[],
  options: { from?: number; to?: number } = {},
): Map<string, ResolvedEvent[]> {
  const resolved = normalize(events);
  const buckets = new Map<string, ResolvedEvent[]>();
  for (const event of resolved) {
    const first = options.from === undefined ? event.startDayNumber : Math.max(event.startDayNumber, options.from);
    const last = options.to === undefined ? event.endDayNumber : Math.min(event.endDayNumber, options.to);
    for (let dayNumber = first; dayNumber <= last; dayNumber += 1) {
      const key = isoKeyFromDayNumber(dayNumber);
      const bucket = buckets.get(key);
      if (bucket) bucket.push(event);
      else buckets.set(key, [event]);
    }
  }
  for (const bucket of buckets.values()) bucket.sort(compareEvents);
  return buckets;
}

/** Events touching a single day cell, already sorted. */
export function eventsForDay(
  buckets: Map<string, ResolvedEvent[]>,
  day: Pick<DayCell, 'key'>,
): ResolvedEvent[] {
  return buckets.get(day.key) ?? [];
}

/**
 * Position timed events inside one day column of a time grid.
 *
 * Overlapping events are split into equal columns: events are swept in start
 * order, and a cluster ends as soon as no event in it is still running, which
 * keeps unrelated parts of the day at full width.
 */
export function layoutDayEvents(
  events: readonly ResolvedEvent[],
  day: Pick<DayCell, 'date' | 'dayNumber'>,
  grid: Pick<TimeGrid, 'startHour' | 'endHour' | 'totalMinutes'>,
): PositionedEvent[] {
  const dayStart = new Date(day.date);
  dayStart.setHours(grid.startHour, 0, 0, 0);
  const dayEnd = new Date(day.date);
  // `endHour` may be 24, which `setHours` rolls into the next day — exactly right.
  dayEnd.setHours(grid.endHour, 0, 0, 0);
  const windowStart = dayStart.getTime();
  const windowEnd = dayEnd.getTime();
  const span = grid.totalMinutes * 60_000;

  const visible = events
    .filter((event) => !event.allDay && event.start.getTime() < windowEnd && event.end.getTime() > windowStart)
    .sort(compareEvents);

  const positioned: PositionedEvent[] = [];
  let cluster: PositionedEvent[] = [];
  let clusterEnd = -Infinity;
  const columnEnds: number[] = [];

  const flush = () => {
    const columnCount = Math.max(1, columnEnds.length);
    for (const item of cluster) item.columnCount = columnCount;
    cluster = [];
    columnEnds.length = 0;
    clusterEnd = -Infinity;
  };

  for (const event of visible) {
    const startMs = Math.max(event.start.getTime(), windowStart);
    const endMs = Math.min(event.end.getTime(), windowEnd);

    if (startMs >= clusterEnd) flush();

    let column = columnEnds.findIndex((end) => end <= startMs);
    if (column === -1) column = columnEnds.length;
    columnEnds[column] = endMs;
    clusterEnd = Math.max(clusterEnd, endMs);

    const item: PositionedEvent = {
      event,
      top: (startMs - windowStart) / span,
      height: Math.max((endMs - startMs) / span, 0),
      column,
      columnCount: 1,
      clippedStart: event.start.getTime() < windowStart,
      clippedEnd: event.end.getTime() > windowEnd,
    };
    cluster.push(item);
    positioned.push(item);
  }
  flush();

  return positioned;
}

/** All-day and multi-day events for a day, which time grids show in a top rail. */
export function allDayEventsForDay(events: readonly ResolvedEvent[]): ResolvedEvent[] {
  return events.filter((event) => event.allDay || event.isMultiDay);
}

function normalize(events: readonly CalendarEvent[] | readonly ResolvedEvent[]): ResolvedEvent[] {
  if (events.length === 0) return [];
  const first = events[0] as Partial<ResolvedEvent>;
  if (typeof first.startDayNumber === 'number' && first.source !== undefined) {
    return [...(events as readonly ResolvedEvent[])];
  }
  return resolveEvents(events as readonly CalendarEvent[]);
}
