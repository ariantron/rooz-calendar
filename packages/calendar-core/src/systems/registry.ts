import type { CalendarSystem } from '../types';
import { gregorian } from './gregorian';
import { jalali } from './jalali';

/**
 * A calendar system, or the id of a registered one.
 *
 * Every public API in this package accepts this union, so a consumer can pass
 * the string `'jalali'` and never import a class.
 */
export type CalendarSystemInput = CalendarSystem | string;

const registry = new Map<string, CalendarSystem>([
  [gregorian.id, gregorian],
  [jalali.id, jalali],
]);

/**
 * Register an additional calendar system.
 *
 * This is the extension point that keeps Hijri (or any other system) out of
 * this package's core: implement {@link CalendarSystem}, register it once, and
 * every grid builder and UI component works with it unchanged.
 */
export function registerCalendarSystem(system: CalendarSystem): void {
  registry.set(system.id, system);
}

/** Ids of all currently registered calendar systems. */
export function listCalendarSystems(): string[] {
  return [...registry.keys()];
}

/** Resolve a system instance or id into an instance. Throws if unknown. */
export function resolveCalendarSystem(input: CalendarSystemInput): CalendarSystem {
  if (typeof input !== 'string') return input;
  const found = registry.get(input);
  if (!found) {
    throw new RangeError(`Unknown calendar system "${input}". Registered: ${listCalendarSystems().join(', ')}`);
  }
  return found;
}
