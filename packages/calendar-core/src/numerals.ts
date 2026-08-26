import type { Direction, Numerals } from './types';

const DIGIT_SETS: Record<Numerals, string> = {
  latn: '0123456789',
  arabext: '۰۱۲۳۴۵۶۷۸۹',
  arab: '٠١٢٣٤٥٦٧٨٩',
};

/** Locales that conventionally render Extended Arabic-Indic (Persian) digits. */
const ARABEXT_LOCALES = new Set(['fa', 'ps', 'ur']);
/** Locales that conventionally render Arabic-Indic digits. */
const ARAB_LOCALES = new Set(['ar']);
/** Right-to-left primary language subtags. */
const RTL_LOCALES = new Set(['fa', 'ar', 'he', 'ur', 'ps', 'sd', 'ug', 'yi', 'dv', 'ckb']);

/** Reduce a locale tag to its primary subtag, lowercased (`fa-IR` → `fa`). */
export function primarySubtag(locale: string | undefined): string {
  if (!locale) return 'en';
  const [tag] = locale.split(/[-_]/);
  return (tag ?? 'en').toLowerCase();
}

/** The numeral system a locale conventionally uses. */
export function defaultNumeralsForLocale(locale: string | undefined): Numerals {
  const tag = primarySubtag(locale);
  if (ARABEXT_LOCALES.has(tag)) return 'arabext';
  if (ARAB_LOCALES.has(tag)) return 'arab';
  return 'latn';
}

/** Text direction for a locale. */
export function getLocaleDirection(locale: string | undefined): Direction {
  return RTL_LOCALES.has(primarySubtag(locale)) ? 'rtl' : 'ltr';
}

/**
 * Re-shape the ASCII digits in `input` into another numeral system.
 * Non-digit characters are passed through untouched.
 */
export function toNumerals(input: string, numerals: Numerals = 'latn'): string {
  if (numerals === 'latn') return input;
  const digits = DIGIT_SETS[numerals];
  let out = '';
  for (const ch of input) {
    const code = ch.charCodeAt(0) - 48;
    out += code >= 0 && code <= 9 ? digits[code] : ch;
  }
  return out;
}

/** Convert any supported numeral system's digits back to ASCII. */
export function toLatinNumerals(input: string): string {
  let out = '';
  for (const ch of input) {
    const code = ch.codePointAt(0) ?? 0;
    if (code >= 0x06f0 && code <= 0x06f9) out += String.fromCharCode(code - 0x06f0 + 48);
    else if (code >= 0x0660 && code <= 0x0669) out += String.fromCharCode(code - 0x0660 + 48);
    else out += ch;
  }
  return out;
}

/** Zero-pad to `length`, then shape the digits. */
export function padNumber(value: number, length: number, numerals: Numerals = 'latn'): string {
  const sign = value < 0 ? '-' : '';
  return sign + toNumerals(String(Math.abs(value)).padStart(length, '0'), numerals);
}
