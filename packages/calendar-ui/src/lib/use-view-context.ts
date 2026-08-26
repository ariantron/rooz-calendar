import {
  defaultNumeralsForLocale,
  getLocaleDirection,
  resolveCalendarSystem,
  resolveEvents,
  type CalendarEvent,
  type CalendarSystem,
  type DayCell,
  type Direction,
  type Numerals,
  type ResolvedEvent,
} from '@rooz/calendar-core';
import * as React from 'react';
import type { CalendarViewBaseProps } from '../types';

/** Resolved, memoised context shared by every view. */
export interface ViewContext {
  system: CalendarSystem;
  locale: string;
  numerals: Numerals;
  direction: Direction;
  today: Date;
  date: Date;
  resolvedEvents: ResolvedEvent[];
  selectedKeys: string[];
  /** Format an instant's time in the active system and locale. */
  formatTime: (value: Date) => string;
  /** Accessible full-date label for a day cell. */
  dayLabel: (day: DayCell) => string;
  /** Options object accepted by every `@rooz/calendar-core` grid builder. */
  gridOptions: {
    system: CalendarSystem;
    locale: string;
    numerals: Numerals;
    weekStartsOn?: CalendarViewBaseProps['weekStartsOn'];
    weekends?: CalendarViewBaseProps['weekends'];
    today: Date;
  };
}

const EMPTY_EVENTS: readonly CalendarEvent[] = [];

/**
 * Turn a view's loosely-typed props into everything the render needs.
 *
 * Every derived value is memoised on its real inputs, so re-rendering a view
 * with the same props does not re-resolve events or re-run conversions.
 */
export function useViewContext(props: CalendarViewBaseProps): ViewContext {
  const {
    calendarSystem = 'gregorian',
    locale: localeProp,
    numerals: numeralsProp,
    events = EMPTY_EVENTS,
    weekStartsOn,
    weekends,
    selectedDate,
    today: todayProp,
    date: dateProp,
  } = props;

  const system = React.useMemo(() => resolveCalendarSystem(calendarSystem), [calendarSystem]);
  const locale = localeProp ?? (system.id === 'jalali' ? 'fa' : 'en');
  const numerals = numeralsProp ?? defaultNumeralsForLocale(locale);
  const direction = getLocaleDirection(locale);

  // Fall back to a fresh Date only when the consumer supplies none; memoised so
  // an uncontrolled view does not rebuild its grid on every render.
  const fallbackNow = React.useMemo(() => new Date(), []);
  const today = todayProp ?? fallbackNow;
  const date = dateProp ?? today;

  const resolvedEvents = React.useMemo(() => resolveEvents(events), [events]);

  const selectedKeys = React.useMemo(() => {
    if (!selectedDate) return [];
    return [
      `${String(selectedDate.getFullYear()).padStart(4, '0')}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`,
    ];
  }, [selectedDate]);

  const formatTime = React.useCallback(
    (value: Date) => system.format(value, 'HH:mm', { locale, numerals }),
    [system, locale, numerals],
  );

  const dayLabel = React.useCallback(
    (day: DayCell) =>
      system.format(day.calendarDate, direction === 'rtl' ? 'EEEE d MMMM yyyy' : 'EEEE, MMMM d, yyyy', {
        locale,
        numerals,
      }),
    [system, locale, numerals, direction],
  );

  const gridOptions = React.useMemo(
    () => ({ system, locale, numerals, weekStartsOn, weekends, today }),
    [system, locale, numerals, weekStartsOn, weekends, today],
  );

  return {
    system,
    locale,
    numerals,
    direction,
    today,
    date,
    resolvedEvents,
    selectedKeys,
    formatTime,
    dayLabel,
    gridOptions,
  };
}
