import { describe, expect, it } from 'vitest';
import { buildMonthGrid } from '../grid/month';
import { buildWeekGrid } from '../grid/time';
import { allDayEventsForDay, eventsForDay, groupEventsByDay, layoutDayEvents } from './layout';
import { compareEvents, resolveEvent, resolveEvents } from './resolve';
import type { CalendarEvent } from './types';

const TODAY = new Date(2026, 7, 26);

describe('resolveEvent', () => {
  it('accepts ISO strings and native Dates alike', () => {
    const fromIso = resolveEvent({ id: 'a', title: 'A', start: '2026-08-26T09:00:00' });
    const fromDate = resolveEvent({ id: 'a', title: 'A', start: new Date(2026, 7, 26, 9, 0) });
    expect(fromIso.start.getTime()).toBe(fromDate.start.getTime());
  });

  it('defaults a timed event to one hour', () => {
    const event = resolveEvent({ id: 'a', title: 'A', start: new Date(2026, 7, 26, 9, 0) });
    expect(event.end.getTime() - event.start.getTime()).toBe(60 * 60 * 1000);
    expect(event.isMultiDay).toBe(false);
  });

  it('defaults an all-day event to a single day', () => {
    const event = resolveEvent({ id: 'a', title: 'A', start: new Date(2026, 7, 26), allDay: true });
    expect(event.startDayNumber).toBe(event.endDayNumber);
    expect(event.isMultiDay).toBe(false);
  });

  it('treats end as exclusive, so a midnight end does not claim the next day', () => {
    const event = resolveEvent({
      id: 'a',
      title: 'A',
      start: new Date(2026, 7, 26),
      end: new Date(2026, 7, 27),
      allDay: true,
    });
    expect(event.endDayNumber).toBe(event.startDayNumber);
    expect(event.isMultiDay).toBe(false);
  });

  it('spans multiple days when it should', () => {
    const event = resolveEvent({
      id: 'a',
      title: 'A',
      start: new Date(2026, 7, 26, 9),
      end: new Date(2026, 7, 29, 17),
    });
    expect(event.endDayNumber - event.startDayNumber).toBe(3);
    expect(event.isMultiDay).toBe(true);
  });

  it('repairs an end that precedes its start', () => {
    const event = resolveEvent({
      id: 'a',
      title: 'A',
      start: new Date(2026, 7, 26, 9),
      end: new Date(2026, 7, 26, 8),
    });
    expect(event.end.getTime()).toBeGreaterThan(event.start.getTime());
  });

  it('throws on an unparseable instant, naming the event', () => {
    expect(() => resolveEvent({ id: 'bad-one', title: 'A', start: 'not a date' })).toThrow(/bad-one/);
  });

  it('keeps the original object reachable', () => {
    const source: CalendarEvent = { id: 'a', title: 'A', start: '2026-08-26T09:00:00', meta: { room: '204' } };
    expect(resolveEvent(source).source).toBe(source);
    expect(resolveEvent(source).meta).toEqual({ room: '204' });
  });
});

describe('ordering', () => {
  it('sorts all-day first, then by start, then longest first', () => {
    const sorted = resolveEvents([
      { id: 'later', title: 'Later', start: new Date(2026, 7, 26, 14) },
      { id: 'allday', title: 'All day', start: new Date(2026, 7, 26), allDay: true },
      { id: 'short', title: 'Short', start: new Date(2026, 7, 26, 9), end: new Date(2026, 7, 26, 9, 30) },
      { id: 'long', title: 'Long', start: new Date(2026, 7, 26, 9), end: new Date(2026, 7, 26, 12) },
    ]);
    expect(sorted.map((event) => event.id)).toEqual(['allday', 'long', 'short', 'later']);
  });

  it('is a stable comparator', () => {
    const [a, b] = resolveEvents([
      { id: 'a', title: 'A', start: new Date(2026, 7, 26, 9) },
      { id: 'b', title: 'B', start: new Date(2026, 7, 26, 9) },
    ]);
    expect(compareEvents(a!, b!)).toBeLessThan(0);
    expect(compareEvents(b!, a!)).toBeGreaterThan(0);
    expect(compareEvents(a!, a!)).toBe(0);
  });
});

describe('groupEventsByDay', () => {
  const events: CalendarEvent[] = [
    { id: 'standup', title: 'Standup', start: new Date(2026, 7, 26, 9), end: new Date(2026, 7, 26, 9, 15) },
    { id: 'trip', title: 'Field trip', start: new Date(2026, 7, 26), end: new Date(2026, 7, 29), allDay: true },
    { id: 'exam', title: 'Exam', start: new Date(2026, 7, 31, 10), end: new Date(2026, 7, 31, 12) },
  ];

  it('puts a multi-day event on every day it touches', () => {
    const buckets = groupEventsByDay(events);
    expect([...buckets.keys()].sort()).toEqual(['2026-08-26', '2026-08-27', '2026-08-28', '2026-08-31']);
    expect(buckets.get('2026-08-27')!.map((event) => event.id)).toEqual(['trip']);
    expect(buckets.get('2026-08-26')!.map((event) => event.id)).toEqual(['trip', 'standup']);
  });

  it('clips to a requested day-number window', () => {
    const buckets = groupEventsByDay(events, { from: 20_692, to: 20_692 }); // 2026-08-27 only
    expect([...buckets.keys()]).toEqual(['2026-08-27']);
  });

  it('accepts already-resolved events without re-resolving', () => {
    const resolved = resolveEvents(events);
    const buckets = groupEventsByDay(resolved);
    expect(buckets.get('2026-08-26')![0]).toBe(resolved.find((event) => event.id === 'trip'));
  });

  it('keys line up with grid cells in both calendar systems', () => {
    const buckets = groupEventsByDay(events);
    const gregorianGrid = buildMonthGrid(2026, 8, { system: 'gregorian', today: TODAY });
    const jalaliGrid = buildMonthGrid(1405, 6, { system: 'jalali', today: TODAY });
    const gregorianCell = gregorianGrid.days.find((day) => day.key === '2026-08-26')!;
    const jalaliCell = jalaliGrid.days.find((day) => day.key === '2026-08-26')!;
    expect(eventsForDay(buckets, gregorianCell).map((event) => event.id)).toEqual(['trip', 'standup']);
    // Same events, same day, without the consumer knowing which system is active.
    expect(eventsForDay(buckets, jalaliCell)).toEqual(eventsForDay(buckets, gregorianCell));
    expect(jalaliCell.calendarDate).toEqual({ year: 1405, month: 6, day: 4 });
  });

  it('returns an empty list for a day with nothing on it', () => {
    expect(eventsForDay(groupEventsByDay(events), { key: '2026-08-30' })).toEqual([]);
  });

  it('separates all-day and multi-day events from timed ones', () => {
    const dayEvents = groupEventsByDay(events).get('2026-08-26')!;
    expect(allDayEventsForDay(dayEvents).map((event) => event.id)).toEqual(['trip']);
  });
});

describe('layoutDayEvents', () => {
  const grid = buildWeekGrid(TODAY, { system: 'gregorian', startHour: 8, endHour: 18, today: TODAY });
  const day = grid.days.find((cell) => cell.key === '2026-08-26')!;

  const layout = (events: CalendarEvent[]) => layoutDayEvents(resolveEvents(events), day, grid);

  it('positions an event as a fraction of the visible window', () => {
    const [item] = layout([
      { id: 'a', title: 'A', start: new Date(2026, 7, 26, 9), end: new Date(2026, 7, 26, 10) },
    ]);
    expect(item!.top).toBeCloseTo(1 / 10);
    expect(item!.height).toBeCloseTo(1 / 10);
    expect(item!.column).toBe(0);
    expect(item!.columnCount).toBe(1);
  });

  it('splits overlapping events into columns', () => {
    const items = layout([
      { id: 'a', title: 'A', start: new Date(2026, 7, 26, 9), end: new Date(2026, 7, 26, 11) },
      { id: 'b', title: 'B', start: new Date(2026, 7, 26, 10), end: new Date(2026, 7, 26, 12) },
      { id: 'c', title: 'C', start: new Date(2026, 7, 26, 10, 30), end: new Date(2026, 7, 26, 11) },
    ]);
    expect(items.map((item) => item.column)).toEqual([0, 1, 2]);
    expect(items.every((item) => item.columnCount === 3)).toBe(true);
  });

  it('keeps non-overlapping events at full width', () => {
    const items = layout([
      { id: 'a', title: 'A', start: new Date(2026, 7, 26, 9), end: new Date(2026, 7, 26, 10) },
      { id: 'b', title: 'B', start: new Date(2026, 7, 26, 11), end: new Date(2026, 7, 26, 12) },
    ]);
    expect(items.every((item) => item.columnCount === 1 && item.column === 0)).toBe(true);
  });

  it('reuses a freed column once an event has ended', () => {
    const items = layout([
      { id: 'a', title: 'A', start: new Date(2026, 7, 26, 9), end: new Date(2026, 7, 26, 13) },
      { id: 'b', title: 'B', start: new Date(2026, 7, 26, 9, 30), end: new Date(2026, 7, 26, 10, 30) },
      { id: 'c', title: 'C', start: new Date(2026, 7, 26, 11), end: new Date(2026, 7, 26, 12) },
    ]);
    // B and C never overlap each other, so C takes B's column back.
    expect(items.map((item) => `${item.event.id}:${item.column}`)).toEqual(['a:0', 'b:1', 'c:1']);
    expect(items.every((item) => item.columnCount === 2)).toBe(true);
  });

  it('clips events that run past the visible window', () => {
    const [item] = layout([
      { id: 'a', title: 'A', start: new Date(2026, 7, 26, 6), end: new Date(2026, 7, 26, 20) },
    ]);
    expect(item!.top).toBe(0);
    expect(item!.height).toBe(1);
    expect(item!.clippedStart).toBe(true);
    expect(item!.clippedEnd).toBe(true);
  });

  it('drops events entirely outside the window, and all-day events', () => {
    const items = layout([
      { id: 'early', title: 'Early', start: new Date(2026, 7, 26, 5), end: new Date(2026, 7, 26, 6) },
      { id: 'allday', title: 'All day', start: new Date(2026, 7, 26), allDay: true },
    ]);
    expect(items).toEqual([]);
  });
});
