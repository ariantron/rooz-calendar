import { describe, expect, it } from 'vitest';
import { defaultNumeralsForLocale, getLocaleDirection, primarySubtag, toLatinNumerals, toNumerals } from './numerals';
import { gregorian } from './systems/gregorian';
import { jalali } from './systems/jalali';

describe('numerals', () => {
  it('shapes ASCII digits into Persian digits', () => {
    expect(toNumerals('1405/06/04', 'arabext')).toBe('۱۴۰۵/۰۶/۰۴');
  });

  it('shapes ASCII digits into Arabic-Indic digits', () => {
    expect(toNumerals('2026', 'arab')).toBe('٢٠٢٦');
  });

  it('leaves Latin digits alone', () => {
    expect(toNumerals('2026-08-26', 'latn')).toBe('2026-08-26');
  });

  it('leaves non-digits untouched', () => {
    expect(toNumerals('شهریور ۱۴۰۵ / 4', 'arabext')).toBe('شهریور ۱۴۰۵ / ۴');
  });

  it('converts back to Latin digits', () => {
    expect(toLatinNumerals('۱۴۰۵')).toBe('1405');
    expect(toLatinNumerals('٢٠٢٦')).toBe('2026');
    expect(toLatinNumerals('2026')).toBe('2026');
  });

  it('picks conventional numerals per locale, but never forces them', () => {
    expect(defaultNumeralsForLocale('fa')).toBe('arabext');
    expect(defaultNumeralsForLocale('fa-IR')).toBe('arabext');
    expect(defaultNumeralsForLocale('ar')).toBe('arab');
    expect(defaultNumeralsForLocale('en')).toBe('latn');
    expect(defaultNumeralsForLocale(undefined)).toBe('latn');
  });

  it('reduces locale tags to their primary subtag', () => {
    expect(primarySubtag('fa-IR')).toBe('fa');
    expect(primarySubtag('en_US')).toBe('en');
    expect(primarySubtag(undefined)).toBe('en');
  });

  it('knows which locales are RTL', () => {
    expect(getLocaleDirection('fa')).toBe('rtl');
    expect(getLocaleDirection('ar-EG')).toBe('rtl');
    expect(getLocaleDirection('en')).toBe('ltr');
  });
});

describe('formatting', () => {
  const date = new Date(2026, 7, 26, 14, 5, 9); // 2026-08-26 = 4 Shahrivar 1405

  it('formats Gregorian dates in English', () => {
    expect(gregorian.format(date, 'EEEE, MMMM d, yyyy')).toBe('Wednesday, August 26, 2026');
    expect(gregorian.format(date, 'yyyy-MM-dd')).toBe('2026-08-26');
    expect(gregorian.format(date, 'MMM d')).toBe('Aug 26');
  });

  it('formats Jalali dates in Farsi with Persian digits', () => {
    expect(jalali.format(date, 'EEEE d MMMM yyyy', { locale: 'fa' })).toBe('چهارشنبه ۴ شهریور ۱۴۰۵');
    expect(jalali.format(date, 'yyyy/MM/dd', { locale: 'fa' })).toBe('۱۴۰۵/۰۶/۰۴');
  });

  it('formats Jalali dates with Latin digits when asked', () => {
    expect(jalali.format(date, 'yyyy/MM/dd', { locale: 'fa', numerals: 'latn' })).toBe('1405/06/04');
    expect(jalali.format(date, 'EEEE, MMMM d, yyyy', { locale: 'en' })).toBe('Wednesday, Shahrivar 4, 1405');
  });

  it('formats times, including 12-hour and meridiem', () => {
    expect(gregorian.format(date, 'HH:mm')).toBe('14:05');
    expect(gregorian.format(date, 'h:mm a')).toBe('2:05 PM');
    expect(gregorian.format(date, 'HH:mm:ss')).toBe('14:05:09');
    expect(jalali.format(date, 'HH:mm', { locale: 'fa' })).toBe('۱۴:۰۵');
    expect(jalali.format(date, 'h:mm a', { locale: 'fa' })).toBe('۲:۰۵ ب.ظ');
  });

  it('zeroes the time when handed calendar fields rather than a Date', () => {
    expect(jalali.format({ year: 1405, month: 6, day: 4 }, 'HH:mm', { locale: 'fa', numerals: 'latn' })).toBe('00:00');
  });

  it('emits quoted text literally', () => {
    expect(gregorian.format(date, "'week of' MMMM d")).toBe('week of August 26');
  });

  it('renders narrow and short weekday names', () => {
    expect(gregorian.format(date, 'EEEEE')).toBe('W');
    expect(gregorian.format(date, 'EEE')).toBe('Wed');
    expect(jalali.format(date, 'EEEEE', { locale: 'fa' })).toBe('چ');
  });

  it('falls back to the system default locale for unknown tags', () => {
    expect(jalali.format(date, 'MMMM', { locale: 'xx' })).toBe('شهریور');
    expect(gregorian.format(date, 'MMMM', { locale: 'xx' })).toBe('August');
  });

  it('exposes weekday names indexed Sunday-first regardless of week start', () => {
    expect(jalali.getWeekdayNames('fa', 'long')[6]).toBe('شنبه');
    expect(jalali.getWeekdayNames('fa', 'long')[5]).toBe('جمعه');
    expect(gregorian.getWeekdayNames('en', 'long')[0]).toBe('Sunday');
  });
});
