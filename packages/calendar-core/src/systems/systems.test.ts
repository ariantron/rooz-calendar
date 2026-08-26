import { describe, expect, it } from 'vitest';
import { daysFromCivil } from '../civil';
import { buildMonthGrid } from '../grid/month';
import type { CalendarDate } from '../types';
import { BaseCalendarSystem } from './base';
import type { LocaleTable } from './locale-data';
import { gregorian } from './gregorian';
import { jalali } from './jalali';
import { listCalendarSystems, registerCalendarSystem, resolveCalendarSystem } from './registry';

/**
 * Independently-known Nowruz dates (Farvardin 1 → Gregorian).
 * These are published civil dates, not values read back out of the engine.
 */
const NOWRUZ: ReadonlyArray<[jalaliYear: number, iso: string]> = [
  [1395, '2016-03-20'],
  [1396, '2017-03-21'],
  [1397, '2018-03-21'],
  [1398, '2019-03-21'],
  [1399, '2020-03-20'],
  [1400, '2021-03-21'],
  [1401, '2022-03-21'],
  [1402, '2023-03-21'],
  [1403, '2024-03-20'],
  [1404, '2025-03-21'],
  [1405, '2026-03-21'],
  [1406, '2027-03-21'],
  [1407, '2028-03-20'],
  [1408, '2029-03-20'],
  [1409, '2030-03-21'],
  [1410, '2031-03-21'],
];

/** Jalali years that contain an Esfand 30. */
const LEAP_YEARS = new Set([1395, 1399, 1403, 1408, 1412, 1416, 1420]);

function isoToDayNumber(iso: string): number {
  const [year, month, day] = iso.split('-').map(Number);
  return daysFromCivil(year!, month!, day!);
}

describe('gregorian system', () => {
  it('reports correct month lengths, including February in leap years', () => {
    expect(gregorian.daysInMonth(2026, 1)).toBe(31);
    expect(gregorian.daysInMonth(2026, 2)).toBe(28);
    expect(gregorian.daysInMonth(2024, 2)).toBe(29);
    expect(gregorian.daysInMonth(1900, 2)).toBe(28); // century, not divisible by 400
    expect(gregorian.daysInMonth(2000, 2)).toBe(29); // divisible by 400
    expect(gregorian.daysInMonth(2026, 4)).toBe(30);
  });

  it('rejects out-of-range months', () => {
    expect(() => gregorian.daysInMonth(2026, 0)).toThrow(RangeError);
    expect(() => gregorian.daysInMonth(2026, 13)).toThrow(RangeError);
  });

  it('starts its week on Sunday', () => {
    expect(gregorian.defaultWeekStartsOn).toBe(0);
  });

  it('computes weekdays correctly', () => {
    // 2026-08-26 is a Wednesday.
    expect(gregorian.getWeekday({ year: 2026, month: 8, day: 26 })).toBe(3);
    // 2000-01-01 was a Saturday.
    expect(gregorian.getWeekday({ year: 2000, month: 1, day: 1 })).toBe(6);
    // 1970-01-01 was a Thursday.
    expect(gregorian.getWeekday({ year: 1970, month: 1, day: 1 })).toBe(4);
  });

  it('round-trips Date ↔ CalendarDate', () => {
    const date = new Date(2026, 7, 26, 15, 30);
    expect(gregorian.fromDate(date)).toEqual({ year: 2026, month: 8, day: 26 });
    const back = gregorian.toDate({ year: 2026, month: 8, day: 26 });
    expect(back.getFullYear()).toBe(2026);
    expect(back.getMonth()).toBe(7);
    expect(back.getDate()).toBe(26);
    expect(back.getHours()).toBe(0);
  });
});

describe('jalali system', () => {
  it('starts its week on Saturday, not Sunday or Monday', () => {
    expect(jalali.defaultWeekStartsOn).toBe(6);
  });

  it('treats Friday as the weekend', () => {
    expect([...jalali.defaultWeekends]).toEqual([5]);
  });

  it('has 6 months of 31 days, 5 of 30, and a 29-day Esfand', () => {
    const lengths = Array.from({ length: 12 }, (_, i) => jalali.daysInMonth(1404, i + 1));
    expect(lengths).toEqual([31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29]);
  });

  it('gives Esfand 30 days in a leap year', () => {
    const lengths = Array.from({ length: 12 }, (_, i) => jalali.daysInMonth(1403, i + 1));
    expect(lengths).toEqual([31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 30]);
  });

  it.each([...LEAP_YEARS])('recognises %i as a leap year', (year) => {
    expect(jalali.isLeapYear(year)).toBe(true);
    expect(jalali.daysInMonth(year, 12)).toBe(30);
    expect(jalali.daysInYear(year)).toBe(366);
  });

  it.each([1400, 1401, 1402, 1404, 1405, 1406, 1407])('recognises %i as a common year', (year) => {
    expect(jalali.isLeapYear(year)).toBe(false);
    expect(jalali.daysInMonth(year, 12)).toBe(29);
    expect(jalali.daysInYear(year)).toBe(365);
  });

  it('rejects out-of-range months', () => {
    expect(() => jalali.daysInMonth(1405, 0)).toThrow(RangeError);
    expect(() => jalali.daysInMonth(1405, 13)).toThrow(RangeError);
  });

  it.each(NOWRUZ)('places Nowruz of %i on %s', (year, iso) => {
    expect(jalali.toDayNumber({ year, month: 1, day: 1 })).toBe(isoToDayNumber(iso));
  });

  it.each(NOWRUZ)('maps %s back to Farvardin 1, %i', (year, iso) => {
    expect(jalali.fromDayNumber(isoToDayNumber(iso))).toEqual({ year, month: 1, day: 1 });
  });

  it('puts the last day of the old year immediately before Nowruz', () => {
    for (const [year, iso] of NOWRUZ) {
      const previous = jalali.fromDayNumber(isoToDayNumber(iso) - 1);
      expect(previous.year).toBe(year - 1);
      expect(previous.month).toBe(12);
      expect(previous.day).toBe(jalali.isLeapYear(year - 1) ? 30 : 29);
    }
  });

  it('converts well-known historical dates', () => {
    // 22 Bahman 1357 — 11 February 1979.
    expect(jalali.fromDate(new Date(1979, 1, 11))).toEqual({ year: 1357, month: 11, day: 22 });
    expect(jalali.fromDate(new Date(2026, 7, 26))).toEqual({ year: 1405, month: 6, day: 4 });
    expect(jalali.fromDate(new Date(2024, 2, 19))).toEqual({ year: 1402, month: 12, day: 29 });
    expect(jalali.fromDate(new Date(2024, 2, 20))).toEqual({ year: 1403, month: 1, day: 1 });
  });

  it('computes weekdays natively', () => {
    // Nowruz 1405 (2026-03-21) is a Saturday — the first day of the Jalali week.
    expect(jalali.getWeekday({ year: 1405, month: 1, day: 1 })).toBe(6);
    // Nowruz 1404 (2025-03-21) is a Friday.
    expect(jalali.getWeekday({ year: 1404, month: 1, day: 1 })).toBe(5);
  });
});

describe('cross-system invariants', () => {
  it('round-trips every day across 40 Jalali years without drift', () => {
    const start = jalali.toDayNumber({ year: 1380, month: 1, day: 1 });
    const end = jalali.toDayNumber({ year: 1420, month: 1, day: 1 });
    expect(end - start).toBeGreaterThan(14_000);

    // Collect failures rather than asserting 14k times: one expect at the end
    // keeps this exhaustive sweep fast enough to run on every CI push.
    const failures: string[] = [];
    let expected = { year: 1380, month: 1, day: 1 };
    for (let dayNumber = start; dayNumber < end; dayNumber += 1) {
      const actual = jalali.fromDayNumber(dayNumber);
      if (actual.year !== expected.year || actual.month !== expected.month || actual.day !== expected.day) {
        failures.push(`day ${dayNumber}: got ${fmt(actual)}, expected ${fmt(expected)}`);
      }
      // The reverse direction must agree on the very same day.
      if (jalali.toDayNumber(actual) !== dayNumber) {
        failures.push(`day ${dayNumber}: ${fmt(actual)} did not round-trip`);
      }
      // Gregorian and Jalali must describe the same physical day.
      if (gregorian.toDayNumber(gregorian.fromDayNumber(dayNumber)) !== dayNumber) {
        failures.push(`day ${dayNumber}: gregorian did not round-trip`);
      }
      if (failures.length > 5) break;

      // Advance the expectation by hand, using this system's own month lengths.
      expected = nextJalaliDay(expected);
    }
    expect(failures).toEqual([]);
  });

  it('keeps addDays and addMonths inside the active system', () => {
    // Esfand 30 in leap year 1403, plus one day, is Nowruz 1404.
    expect(jalali.addDays({ year: 1403, month: 12, day: 30 }, 1)).toEqual({ year: 1404, month: 1, day: 1 });
    // Adding a month clamps onto Farvardin's 31 days.
    expect(jalali.addMonths({ year: 1403, month: 12, day: 30 }, 1)).toEqual({ year: 1404, month: 1, day: 30 });
    // Farvardin 31 minus a month clamps onto a 29-day Esfand.
    expect(jalali.addMonths({ year: 1405, month: 1, day: 31 }, -1)).toEqual({ year: 1404, month: 12, day: 29 });
    // A leap Esfand keeps its 30th day.
    expect(jalali.addYears({ year: 1403, month: 12, day: 30 }, 5)).toEqual({ year: 1408, month: 12, day: 30 });
    expect(jalali.addYears({ year: 1403, month: 12, day: 30 }, 1)).toEqual({ year: 1404, month: 12, day: 29 });
    expect(gregorian.addMonths({ year: 2024, month: 1, day: 31 }, 1)).toEqual({ year: 2024, month: 2, day: 29 });
    expect(gregorian.addMonths({ year: 2026, month: 1, day: 31 }, 1)).toEqual({ year: 2026, month: 2, day: 28 });
  });

  it('validates dates against the active system', () => {
    expect(jalali.isValid({ year: 1403, month: 12, day: 30 })).toBe(true);
    expect(jalali.isValid({ year: 1404, month: 12, day: 30 })).toBe(false);
    expect(jalali.isValid({ year: 1405, month: 13, day: 1 })).toBe(false);
    expect(gregorian.isValid({ year: 2026, month: 2, day: 29 })).toBe(false);
    expect(gregorian.isValid({ year: 2024, month: 2, day: 29 })).toBe(true);
  });

  it('agrees with itself on weekdays regardless of system', () => {
    for (let dayNumber = -1000; dayNumber < 1000; dayNumber += 37) {
      expect(jalali.getWeekday(jalali.fromDayNumber(dayNumber))).toBe(
        gregorian.getWeekday(gregorian.fromDayNumber(dayNumber)),
      );
    }
  });
});

describe('registry', () => {
  it('resolves systems by id', () => {
    expect(resolveCalendarSystem('jalali')).toBe(jalali);
    expect(resolveCalendarSystem('gregorian')).toBe(gregorian);
    expect(resolveCalendarSystem(jalali)).toBe(jalali);
  });

  it('throws helpfully for unknown ids', () => {
    expect(() => resolveCalendarSystem('mayan')).toThrow(/Unknown calendar system/);
  });

  it('accepts a brand-new system built from the primitives alone', () => {
    /**
     * Stand-in for a future Hijri implementation. It supplies only the four
     * primitives plus a name table; week alignment, month arithmetic and
     * formatting all come from BaseCalendarSystem — which is exactly the
     * promise the abstraction makes.
     */
    class ThirteenMonthSystem extends BaseCalendarSystem {
      readonly id = 'test-system';
      readonly monthsInYear = 13;
      readonly defaultWeekStartsOn = 1 as const;
      readonly defaultWeekends = [0] as const;
      readonly minYear = 1;
      readonly maxYear = 9999;
      protected readonly localeTable: LocaleTable = {
        fallback: 'en',
        locales: {
          en: {
            months: {
              long: Array.from({ length: 13 }, (_, i) => `Month ${i + 1}`),
              short: Array.from({ length: 13 }, (_, i) => `M${i + 1}`),
              narrow: Array.from({ length: 13 }, (_, i) => String(i + 1)),
            },
            weekdays: {
              long: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
              short: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
              narrow: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
            },
          },
        },
      };

      toDayNumber(date: CalendarDate): number {
        return (date.year - 1) * 364 + (date.month - 1) * 28 + (date.day - 1);
      }

      fromDayNumber(dayNumber: number): CalendarDate {
        const year = Math.floor(dayNumber / 364) + 1;
        const dayOfYear = dayNumber - (year - 1) * 364;
        return { year, month: Math.floor(dayOfYear / 28) + 1, day: (dayOfYear % 28) + 1 };
      }

      daysInMonth(): number {
        return 28;
      }

      isLeapYear(): boolean {
        return false;
      }
    }

    const system = new ThirteenMonthSystem();
    registerCalendarSystem(system);
    expect(listCalendarSystems()).toContain('test-system');
    expect(resolveCalendarSystem('test-system')).toBe(system);

    // Derived behaviour works without the new system implementing any of it.
    expect(system.daysInYear(5)).toBe(364);
    expect(system.addMonths({ year: 3, month: 13, day: 28 }, 1)).toEqual({ year: 4, month: 1, day: 28 });
    expect(system.addDays({ year: 3, month: 13, day: 28 }, 1)).toEqual({ year: 4, month: 1, day: 1 });
    expect(system.format({ year: 3, month: 13, day: 5 }, 'MMMM d, yyyy')).toBe('Month 13 5, 0003');
    expect(system.isValid({ year: 3, month: 14, day: 1 })).toBe(false);

    // And the grid builders accept it untouched.
    const grid = buildMonthGrid(3, 13, { system: 'test-system', today: new Date(2026, 7, 26) });
    expect(grid.days.filter((day) => day.isCurrentMonth)).toHaveLength(28);
    expect(grid.weeks[0]!.days[0]!.weekday).toBe(1);
  });
});

function fmt(date: { year: number; month: number; day: number }): string {
  return `${date.year}/${date.month}/${date.day}`;
}

/** Advance a Jalali date by one day using nothing but its own month lengths. */
function nextJalaliDay(date: { year: number; month: number; day: number }) {
  if (date.day < jalali.daysInMonth(date.year, date.month)) {
    return { ...date, day: date.day + 1 };
  }
  if (date.month < 12) return { year: date.year, month: date.month + 1, day: 1 };
  return { year: date.year + 1, month: 1, day: 1 };
}
