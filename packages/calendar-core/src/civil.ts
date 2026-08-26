/**
 * Proleptic Gregorian ↔ day-number conversion.
 *
 * Pure integer arithmetic (Howard Hinnant's `days_from_civil` / `civil_from_days`).
 * Deliberately free of `Date`: every calendar system in this package converts to
 * this shared linear day axis, which makes all date math timezone- and
 * DST-independent. Day number `0` is 1970-01-01 (a Thursday).
 */

/** Days elapsed since the Unix epoch for a proleptic Gregorian y/m/d. */
export function daysFromCivil(year: number, month: number, day: number): number {
  const y = year - (month <= 2 ? 1 : 0);
  const era = Math.floor((y >= 0 ? y : y - 399) / 400);
  const yoe = y - era * 400; // [0, 399]
  const doy = Math.floor((153 * (month + (month > 2 ? -3 : 9)) + 2) / 5) + day - 1; // [0, 365]
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy; // [0, 146096]
  return era * 146097 + doe - 719468;
}

/** Inverse of {@link daysFromCivil}. */
export function civilFromDays(dayNumber: number): { year: number; month: number; day: number } {
  const z = dayNumber + 719468;
  const era = Math.floor((z >= 0 ? z : z - 146096) / 146097);
  const doe = z - era * 146097; // [0, 146096]
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
  const y = yoe + era * 400;
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100)); // [0, 365]
  const mp = Math.floor((5 * doy + 2) / 153); // [0, 11]
  const day = doy - Math.floor((153 * mp + 2) / 5) + 1; // [1, 31]
  const month = mp + (mp < 10 ? 3 : -9); // [1, 12]
  return { year: y + (month <= 2 ? 1 : 0), month, day };
}

/**
 * Absolute weekday for a day number (`0` = Sunday).
 * Day number 0 (1970-01-01) was a Thursday, hence the `+4`.
 */
export function weekdayFromDayNumber(dayNumber: number): number {
  return ((dayNumber + 4) % 7 + 7) % 7;
}

/** Local-midnight `Date` for a proleptic Gregorian y/m/d. */
export function toLocalDate(year: number, month: number, day: number): Date {
  const date = new Date(2000, 0, 1, 0, 0, 0, 0);
  date.setFullYear(year, month - 1, day);
  return date;
}
