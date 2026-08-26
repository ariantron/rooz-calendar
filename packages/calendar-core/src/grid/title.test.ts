import { describe, expect, it } from 'vitest';
import { buildPeriodTitle, getPeriodRange, stepPeriod } from './title';

const TODAY = new Date(2026, 7, 26); // 2026-08-26 = 4 Shahrivar 1405

describe('buildPeriodTitle', () => {
  it('titles Gregorian periods in English', () => {
    expect(buildPeriodTitle('month', TODAY, { system: 'gregorian' })).toBe('August 2026');
    expect(buildPeriodTitle('week', TODAY, { system: 'gregorian' })).toBe('August 23 – 29, 2026');
    expect(buildPeriodTitle('day', TODAY, { system: 'gregorian' })).toBe('Wednesday, August 26, 2026');
  });

  it('titles Jalali periods in Farsi', () => {
    expect(buildPeriodTitle('month', TODAY, { system: 'jalali' })).toBe('شهریور ۱۴۰۵');
    expect(buildPeriodTitle('week', TODAY, { system: 'jalali' })).toBe('۳۱ مرداد – ۶ شهریور ۱۴۰۵');
    expect(buildPeriodTitle('day', TODAY, { system: 'jalali' })).toBe('چهارشنبه ۴ شهریور ۱۴۰۵');
  });

  it('elides the shared month, and keeps both when a period straddles two', () => {
    // A Gregorian week entirely inside one month.
    expect(buildPeriodTitle('week', new Date(2026, 7, 12), { system: 'gregorian' })).toBe('August 9 – 15, 2026');
    // A week straddling a year boundary.
    expect(buildPeriodTitle('week', new Date(2025, 11, 30), { system: 'gregorian' })).toBe(
      'December 28, 2025 – January 3, 2026',
    );
  });

  it('titles a Jalali week that crosses Nowruz with both years', () => {
    // Nowruz 1404 fell on a Friday, so its week starts back in Esfand 1403.
    expect(buildPeriodTitle('week', new Date(2025, 2, 18), { system: 'jalali' })).toBe(
      '۲۵ اسفند ۱۴۰۳ – ۱ فروردین ۱۴۰۴',
    );
  });

  it('needs no year straddle when Esfand ends exactly on a Friday', () => {
    // Esfand 1404 has 29 days and its last day is a Friday, so the final week
    // of 1404 closes the year off cleanly and Nowruz 1405 opens a fresh row.
    expect(buildPeriodTitle('week', new Date(2026, 2, 18), { system: 'jalali' })).toBe('۲۳ – ۲۹ اسفند ۱۴۰۴');
    expect(buildPeriodTitle('week', new Date(2026, 2, 21), { system: 'jalali' })).toBe('۱ – ۷ فروردین ۱۴۰۵');
  });

  it('titles an agenda period by its range', () => {
    expect(buildPeriodTitle('agenda', TODAY, { system: 'gregorian', agendaDays: 7 })).toBe('August 26 – September 1, 2026');
  });
});

describe('getPeriodRange', () => {
  it('spans a whole month in the active system', () => {
    expect(getPeriodRange('month', TODAY, { system: 'jalali' })).toEqual({
      first: { year: 1405, month: 6, day: 1 },
      last: { year: 1405, month: 6, day: 31 },
    });
    expect(getPeriodRange('month', TODAY, { system: 'gregorian' })).toEqual({
      first: { year: 2026, month: 8, day: 1 },
      last: { year: 2026, month: 8, day: 31 },
    });
  });

  it('spans a leap Esfand correctly', () => {
    expect(getPeriodRange('month', new Date(2025, 2, 15), { system: 'jalali' })).toEqual({
      first: { year: 1403, month: 12, day: 1 },
      last: { year: 1403, month: 12, day: 30 },
    });
  });

  it('aligns a week to the active system week start', () => {
    expect(getPeriodRange('week', TODAY, { system: 'jalali' }).first).toEqual({ year: 1405, month: 5, day: 31 });
    expect(getPeriodRange('week', TODAY, { system: 'gregorian' }).first).toEqual({ year: 2026, month: 8, day: 23 });
  });
});

describe('stepPeriod', () => {
  it('steps Jalali months, not 30-day chunks', () => {
    const next = stepPeriod('month', TODAY, 1, { system: 'jalali' });
    // Shahrivar (31 days) → Mehr, so the same day number lands 31 days later.
    expect(next.getTime()).toBe(new Date(2026, 8, 26).getTime());
    expect(buildPeriodTitle('month', next, { system: 'jalali' })).toBe('مهر ۱۴۰۵');
  });

  it('steps Gregorian months', () => {
    expect(buildPeriodTitle('month', stepPeriod('month', TODAY, 1, { system: 'gregorian' }), { system: 'gregorian' })).toBe(
      'September 2026',
    );
    expect(buildPeriodTitle('month', stepPeriod('month', TODAY, -8, { system: 'gregorian' }), { system: 'gregorian' })).toBe(
      'December 2025',
    );
  });

  it('crosses Nowruz when stepping out of Esfand', () => {
    const esfand = new Date(2026, 2, 10); // 19 Esfand 1404
    expect(buildPeriodTitle('month', esfand, { system: 'jalali' })).toBe('اسفند ۱۴۰۴');
    expect(buildPeriodTitle('month', stepPeriod('month', esfand, 1, { system: 'jalali' }), { system: 'jalali' })).toBe(
      'فروردین ۱۴۰۵',
    );
  });

  it('clamps the day when the target month is shorter', () => {
    // 31 Mordad 1405 stepped forward lands in a 30-day Mehr.
    const mordad31 = new Date(2026, 7, 22);
    const stepped = stepPeriod('month', mordad31, 2, { system: 'jalali' });
    expect(buildPeriodTitle('day', stepped, { system: 'jalali', locale: 'en' })).toBe('Thursday, Mehr 30, 1405');
  });

  it('steps weeks, days and agenda ranges', () => {
    expect(stepPeriod('week', TODAY, 1, { system: 'jalali' }).getTime()).toBe(new Date(2026, 8, 2).getTime());
    expect(stepPeriod('day', TODAY, -1, { system: 'gregorian' }).getTime()).toBe(new Date(2026, 7, 25).getTime());
    expect(stepPeriod('agenda', TODAY, 1, { system: 'gregorian', agendaDays: 7 }).getTime()).toBe(
      new Date(2026, 8, 2).getTime(),
    );
  });
});
