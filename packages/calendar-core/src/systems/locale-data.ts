import { primarySubtag } from '../numerals';
import type { NameWidth } from '../types';

/** Month/weekday names for one locale, in every supported width. */
export interface LocaleNames {
  months: Record<NameWidth, readonly string[]>;
  /** Indexed by absolute weekday: `0` = Sunday … `6` = Saturday. */
  weekdays: Record<NameWidth, readonly string[]>;
}

/** A locale table plus the fallback used for unknown locales. */
export interface LocaleTable {
  fallback: string;
  locales: Record<string, LocaleNames>;
}

const EN_WEEKDAYS: LocaleNames['weekdays'] = {
  long: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  short: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  narrow: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
};

/** Persian weekday names, still indexed Sunday-first for interface consistency. */
const FA_WEEKDAYS: LocaleNames['weekdays'] = {
  long: ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'],
  short: ['یک', 'دو', 'سه', 'چهار', 'پنج', 'جمعه', 'شنبه'],
  narrow: ['ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش'],
};

export const GREGORIAN_LOCALES: LocaleTable = {
  fallback: 'en',
  locales: {
    en: {
      months: {
        long: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        short: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        narrow: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
      },
      weekdays: EN_WEEKDAYS,
    },
    fa: {
      months: {
        long: ['ژانویه', 'فوریه', 'مارس', 'آوریل', 'مه', 'ژوئن', 'ژوئیه', 'اوت', 'سپتامبر', 'اکتبر', 'نوامبر', 'دسامبر'],
        short: ['ژانویه', 'فوریه', 'مارس', 'آوریل', 'مه', 'ژوئن', 'ژوئیه', 'اوت', 'سپتامبر', 'اکتبر', 'نوامبر', 'دسامبر'],
        narrow: ['ژ', 'ف', 'م', 'آ', 'م', 'ژ', 'ژ', 'ا', 'س', 'ا', 'ن', 'د'],
      },
      weekdays: FA_WEEKDAYS,
    },
  },
};

export const JALALI_LOCALES: LocaleTable = {
  fallback: 'fa',
  locales: {
    fa: {
      months: {
        long: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'],
        short: ['فرو', 'ارد', 'خرد', 'تیر', 'مرد', 'شهر', 'مهر', 'آبا', 'آذر', 'دی', 'بهم', 'اسف'],
        narrow: ['ف', 'ا', 'خ', 'ت', 'م', 'ش', 'م', 'آ', 'آ', 'د', 'ب', 'ا'],
      },
      weekdays: FA_WEEKDAYS,
    },
    /** Latin transliteration, for consumers who want Jalali dates in English. */
    en: {
      months: {
        long: ['Farvardin', 'Ordibehesht', 'Khordad', 'Tir', 'Mordad', 'Shahrivar', 'Mehr', 'Aban', 'Azar', 'Dey', 'Bahman', 'Esfand'],
        short: ['Far', 'Ord', 'Kho', 'Tir', 'Mor', 'Sha', 'Meh', 'Aba', 'Aza', 'Dey', 'Bah', 'Esf'],
        narrow: ['F', 'O', 'K', 'T', 'M', 'S', 'M', 'A', 'A', 'D', 'B', 'E'],
      },
      weekdays: EN_WEEKDAYS,
    },
  },
};

/** Resolve a locale tag against a table, falling back to the table's default. */
export function resolveNames(table: LocaleTable, locale: string | undefined): LocaleNames {
  const tag = primarySubtag(locale);
  return table.locales[tag] ?? table.locales[table.fallback]!;
}
