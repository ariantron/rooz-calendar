import { describe, expect, it } from 'vitest';
import { gregorian } from '../systems/gregorian';
import { jalali } from '../systems/jalali';
import { buildAgendaGrid } from './agenda';
import { buildMonthGrid, buildMonthGridForDate } from './month';
import { weekdayOrder } from './shared';
import { buildDayGrid, buildWeekGrid, slotStart } from './time';

/** A fixed "now" so every grid in this file is deterministic. */
const TODAY = new Date(2026, 7, 26); // 2026-08-26 = 4 Shahrivar 1405

describe('weekdayOrder', () => {
  it('orders a Sunday-first week', () => {
    expect(weekdayOrder(0)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('orders a Saturday-first (Jalali) week', () => {
    expect(weekdayOrder(6)).toEqual([6, 0, 1, 2, 3, 4, 5]);
  });

  it('orders a Monday-first (ISO) week', () => {
    expect(weekdayOrder(1)).toEqual([1, 2, 3, 4, 5, 6, 0]);
  });
});

describe('buildMonthGrid — Gregorian', () => {
  it('lays out August 2026 from Sunday', () => {
    const grid = buildMonthGrid(2026, 8, { system: 'gregorian', today: TODAY });
    expect(grid.weekStartsOn).toBe(0);
    expect(grid.weekdayLabels.map((label) => label.short)).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
    // 2026-08-01 is a Saturday, so six blank cells lead the grid in.
    expect(grid.weeks[0]!.days.filter((day) => day.isCurrentMonth)).toHaveLength(1);
    expect(grid.weeks[0]!.days[6]!.calendarDate).toEqual({ year: 2026, month: 8, day: 1 });
    expect(grid.weeks[0]!.days[0]!.calendarDate).toEqual({ year: 2026, month: 7, day: 26 });
    expect(grid.days.filter((day) => day.isCurrentMonth)).toHaveLength(31);
    expect(grid.title).toBe('August 2026');
  });

  it('marks today', () => {
    const grid = buildMonthGrid(2026, 8, { system: 'gregorian', today: TODAY });
    const today = grid.days.filter((day) => day.isToday);
    expect(today).toHaveLength(1);
    expect(today[0]!.calendarDate).toEqual({ year: 2026, month: 8, day: 26 });
    expect(today[0]!.key).toBe('2026-08-26');
  });

  it('marks no day as today when today falls outside the grid', () => {
    const grid = buildMonthGrid(2026, 1, { system: 'gregorian', today: TODAY });
    expect(grid.days.some((day) => day.isToday)).toBe(false);
  });

  it('honours a Monday week start', () => {
    const grid = buildMonthGrid(2026, 8, { system: 'gregorian', weekStartsOn: 1, today: TODAY });
    expect(grid.weeks[0]!.days[0]!.weekday).toBe(1);
    expect(grid.weekdayLabels[0]!.short).toBe('Mon');
  });

  it('emits six rows when fixedWeeks is set', () => {
    // February 2026 starts on a Sunday and has 28 days — a natural 4-row month.
    const natural = buildMonthGrid(2026, 2, { system: 'gregorian', today: TODAY });
    expect(natural.weeks).toHaveLength(4);
    const fixed = buildMonthGrid(2026, 2, { system: 'gregorian', fixedWeeks: true, today: TODAY });
    expect(fixed.weeks).toHaveLength(6);
    expect(fixed.days).toHaveLength(42);
  });
});

describe('buildMonthGrid — Jalali', () => {
  it('starts the week on Saturday', () => {
    const grid = buildMonthGrid(1405, 6, { system: 'jalali', today: TODAY });
    expect(grid.weekStartsOn).toBe(6);
    expect(grid.weeks[0]!.days[0]!.weekday).toBe(6);
    expect(grid.weekdayLabels.map((label) => label.narrow)).toEqual(['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']);
    expect(grid.weekdayLabels[0]!.long).toBe('شنبه');
    expect(grid.weekdayLabels[6]!.long).toBe('جمعه');
    expect(grid.weekdayLabels[6]!.isWeekend).toBe(true);
    expect(grid.weekdayLabels[0]!.isWeekend).toBe(false);
  });

  it('needs no leading days when Farvardin 1 falls on a Saturday', () => {
    // Nowruz 1405 = 2026-03-21, a Saturday: the month starts flush in column 0.
    const grid = buildMonthGrid(1405, 1, { system: 'jalali', today: TODAY });
    expect(grid.weeks[0]!.days[0]!.calendarDate).toEqual({ year: 1405, month: 1, day: 1 });
    expect(grid.weeks[0]!.days[0]!.isCurrentMonth).toBe(true);
    expect(grid.days[0]!.key).toBe('2026-03-21');
  });

  it('leads Farvardin 1404 in with the tail of a leap Esfand 1403', () => {
    // Nowruz 1404 = 2025-03-21, a Friday — the last column of a Saturday-first week.
    const grid = buildMonthGrid(1404, 1, { system: 'jalali', today: TODAY });
    const firstRow = grid.weeks[0]!.days;
    expect(firstRow[6]!.calendarDate).toEqual({ year: 1404, month: 1, day: 1 });
    expect(firstRow.filter((day) => day.isCurrentMonth)).toHaveLength(1);
    // 1403 was a leap year, so the leading days run to Esfand 30.
    expect(firstRow[5]!.calendarDate).toEqual({ year: 1403, month: 12, day: 30 });
    expect(firstRow[0]!.calendarDate).toEqual({ year: 1403, month: 12, day: 25 });
  });

  it('renders exactly the right number of in-month days per month', () => {
    for (let month = 1; month <= 12; month += 1) {
      const grid = buildMonthGrid(1403, month, { system: 'jalali', today: TODAY });
      expect(grid.days.filter((day) => day.isCurrentMonth)).toHaveLength(jalali.daysInMonth(1403, month));
    }
  });

  it('produces contiguous days with no gaps or repeats', () => {
    const grid = buildMonthGrid(1405, 12, { system: 'jalali', today: TODAY });
    for (let i = 1; i < grid.days.length; i += 1) {
      expect(grid.days[i]!.dayNumber).toBe(grid.days[i - 1]!.dayNumber + 1);
    }
    expect(new Set(grid.days.map((day) => day.key)).size).toBe(grid.days.length);
  });

  it('marks the Friday weekend, not Saturday/Sunday', () => {
    const grid = buildMonthGrid(1405, 6, { system: 'jalali', today: TODAY });
    for (const day of grid.days) {
      expect(day.isWeekend).toBe(day.weekday === 5);
    }
  });

  it('detects today in Jalali terms', () => {
    const grid = buildMonthGrid(1405, 6, { system: 'jalali', today: TODAY });
    const today = grid.days.filter((day) => day.isToday);
    expect(today).toHaveLength(1);
    expect(today[0]!.calendarDate).toEqual({ year: 1405, month: 6, day: 4 });
    // The same physical day is "today" in both systems.
    const gregorianGrid = buildMonthGrid(2026, 8, { system: 'gregorian', today: TODAY });
    expect(gregorianGrid.days.find((day) => day.isToday)!.key).toBe(today[0]!.key);
  });

  it('titles the month in Farsi with Persian digits by default', () => {
    const grid = buildMonthGrid(1405, 1, { system: 'jalali', today: TODAY });
    expect(grid.title).toBe('فروردین ۱۴۰۵');
    expect(grid.direction).toBe('rtl');
    expect(grid.days[0]!.dayLabel).toBe('۱');
  });

  it('can render Jalali dates with Latin digits and names', () => {
    const grid = buildMonthGrid(1405, 1, { system: 'jalali', locale: 'en', today: TODAY });
    expect(grid.title).toBe('Farvardin 1405');
    expect(grid.direction).toBe('ltr');
    expect(grid.days[0]!.dayLabel).toBe('1');
  });

  it('can keep Farsi names but Latin digits', () => {
    const grid = buildMonthGrid(1405, 1, { system: 'jalali', locale: 'fa', numerals: 'latn', today: TODAY });
    expect(grid.title).toBe('فروردین 1405');
  });

  it('rejects impossible months', () => {
    expect(() => buildMonthGrid(1405, 13, { system: 'jalali' })).toThrow(RangeError);
  });
});

describe('buildMonthGridForDate', () => {
  it('finds the Jalali month a native Date falls in', () => {
    const grid = buildMonthGridForDate(TODAY, { system: 'jalali', today: TODAY });
    expect(grid.year).toBe(1405);
    expect(grid.month).toBe(6);
    expect(grid.monthLabel).toBe('شهریور');
  });

  it('finds the Gregorian month for the same Date', () => {
    const grid = buildMonthGridForDate(TODAY, { system: 'gregorian', today: TODAY });
    expect(grid.year).toBe(2026);
    expect(grid.month).toBe(8);
  });
});

describe('buildWeekGrid', () => {
  it('aligns a Gregorian week to Sunday', () => {
    const grid = buildWeekGrid(TODAY, { system: 'gregorian', today: TODAY });
    expect(grid.days).toHaveLength(7);
    expect(grid.days[0]!.key).toBe('2026-08-23'); // the Sunday before
    expect(grid.days[6]!.key).toBe('2026-08-29');
    expect(grid.title).toBe('August 23 – 29, 2026');
  });

  it('aligns a Jalali week to Saturday — a different set of seven days', () => {
    const grid = buildWeekGrid(TODAY, { system: 'jalali', today: TODAY });
    expect(grid.days[0]!.key).toBe('2026-08-22'); // the Saturday before
    expect(grid.days[0]!.calendarDate).toEqual({ year: 1405, month: 5, day: 31 });
    expect(grid.days[6]!.key).toBe('2026-08-28');
    // The week straddles Mordad and Shahrivar, and the title says so.
    expect(grid.title).toBe('۳۱ مرداد – ۶ شهریور ۱۴۰۵');
  });

  it('builds hour slots across the requested window', () => {
    const grid = buildWeekGrid(TODAY, { system: 'gregorian', startHour: 8, endHour: 18, today: TODAY });
    expect(grid.slots).toHaveLength(10);
    expect(grid.slots[0]!.label).toBe('08:00');
    expect(grid.slots[9]!.label).toBe('17:00');
    expect(grid.totalMinutes).toBe(600);
  });

  it('supports sub-hour slots', () => {
    const grid = buildWeekGrid(TODAY, { system: 'gregorian', startHour: 9, endHour: 11, slotMinutes: 30, today: TODAY });
    expect(grid.slots.map((slot) => slot.label)).toEqual(['09:00', '09:30', '10:00', '10:30']);
    expect(grid.slots.map((slot) => slot.isMajor)).toEqual([true, false, true, false]);
  });

  it('labels slots with Persian digits for Farsi', () => {
    const grid = buildWeekGrid(TODAY, { system: 'jalali', startHour: 8, endHour: 10, today: TODAY });
    expect(grid.slots.map((slot) => slot.label)).toEqual(['۰۸:۰۰', '۰۹:۰۰']);
  });

  it('rejects nonsensical hour windows', () => {
    expect(() => buildWeekGrid(TODAY, { system: 'gregorian', startHour: 10, endHour: 10 })).toThrow(RangeError);
    expect(() => buildWeekGrid(TODAY, { system: 'gregorian', endHour: 25 })).toThrow(RangeError);
    expect(() => buildWeekGrid(TODAY, { system: 'gregorian', slotMinutes: 7 })).toThrow(RangeError);
  });

  it('resolves a slot back to a concrete Date', () => {
    const grid = buildWeekGrid(TODAY, { system: 'gregorian', startHour: 9, endHour: 12, slotMinutes: 30, today: TODAY });
    const start = slotStart(grid.days[0]!, grid.slots[1]!);
    expect(start.getHours()).toBe(9);
    expect(start.getMinutes()).toBe(30);
    expect(start.getDate()).toBe(23);
  });
});

describe('buildDayGrid', () => {
  it('holds exactly one day', () => {
    const grid = buildDayGrid(TODAY, { system: 'jalali', today: TODAY });
    expect(grid.days).toHaveLength(1);
    expect(grid.days[0]!.isToday).toBe(true);
    expect(grid.title).toBe('۴ شهریور ۱۴۰۵');
  });

  it('titles a Gregorian day in English', () => {
    const grid = buildDayGrid(TODAY, { system: 'gregorian', today: TODAY });
    expect(grid.title).toBe('August 26, 2026');
  });
});

describe('buildAgendaGrid', () => {
  const events = [
    { id: 'a', title: 'Standup', start: new Date(2026, 7, 26, 9, 0), end: new Date(2026, 7, 26, 9, 15) },
    { id: 'b', title: 'Review', start: new Date(2026, 7, 28, 14, 0), end: new Date(2026, 7, 28, 15, 0) },
  ];

  it('lists only days with events by default', () => {
    const grid = buildAgendaGrid(events, {
      system: 'gregorian',
      from: new Date(2026, 7, 24),
      to: new Date(2026, 7, 30),
      today: TODAY,
    });
    expect(grid.days.map((day) => day.key)).toEqual(['2026-08-26', '2026-08-28']);
    expect(grid.days[0]!.label).toBe('Wednesday, August 26');
    expect(grid.days[0]!.isToday).toBe(true);
  });

  it('can include empty days', () => {
    const grid = buildAgendaGrid(events, {
      system: 'gregorian',
      from: new Date(2026, 7, 24),
      to: new Date(2026, 7, 30),
      includeEmptyDays: true,
      today: TODAY,
    });
    expect(grid.days).toHaveLength(7);
  });

  it('labels days in Jalali when that system is active', () => {
    const grid = buildAgendaGrid(events, {
      system: 'jalali',
      from: new Date(2026, 7, 24),
      to: new Date(2026, 7, 30),
      today: TODAY,
    });
    expect(grid.days[0]!.label).toBe('چهارشنبه ۴ شهریور');
    expect(grid.direction).toBe('rtl');
  });

  it('rejects an inverted range', () => {
    expect(() =>
      buildAgendaGrid(events, { system: 'gregorian', from: new Date(2026, 7, 30), to: new Date(2026, 7, 24) }),
    ).toThrow(RangeError);
  });
});

describe('grid identity across systems', () => {
  it('gives the same physical day the same key in both systems', () => {
    const gregorianGrid = buildMonthGrid(2026, 8, { system: 'gregorian', today: TODAY });
    const jalaliGrid = buildMonthGrid(1405, 6, { system: 'jalali', today: TODAY });
    const shared = gregorianGrid.days.filter((day) => jalaliGrid.days.some((other) => other.key === day.key));
    // Shahrivar 1405 starts on 23 August, so the two grids overlap by a fortnight.
    expect(shared.length).toBe(15);
    for (const day of shared) {
      const other = jalaliGrid.days.find((candidate) => candidate.key === day.key)!;
      expect(other.dayNumber).toBe(day.dayNumber);
      expect(other.weekday).toBe(day.weekday);
      expect(gregorian.toDate(day.calendarDate).getTime()).toBe(jalali.toDate(other.calendarDate).getTime());
    }
  });
});
