import type { CalendarEvent, Numerals, ResolvedEvent } from '@rooz/calendar-core';
import { getLocaleDirection, resolveCalendarSystem } from '@rooz/calendar-core';
import { Calendar, type CalendarViewKind } from '@rooz/calendar-ui';
import { useEffect, useMemo, useState } from 'react';
import { type EventDetails, EventDialog } from './event-dialog';
import { buildSampleEvents } from './sample-events';
import { Segmented } from './segmented';
import { type Theme, useTheme } from '../lib/use-theme';

type SystemId = 'gregorian' | 'jalali';
type LocaleId = 'en' | 'fa';
type NumeralChoice = 'auto' | Numerals;

export interface PlaygroundProps {
  /** Pin "today" so screenshots and tests stay stable. */
  today?: Date;
  /** Start on a particular view. @default 'month' */
  defaultView?: CalendarViewKind;
  /** Hide the demo's own control strip. */
  hideControls?: boolean;
  /** Initial calendar system. @default 'gregorian' */
  defaultSystem?: SystemId;
  className?: string;
}

/**
 * The interactive demo: every view, both calendar systems, both locales.
 *
 * It imports `@rooz/calendar-ui` exactly as a consumer would — same package
 * entry point, same props — so what is on screen is what ships.
 */
export function Playground({
  today,
  defaultView = 'month',
  hideControls = false,
  defaultSystem = 'gregorian',
  className,
}: PlaygroundProps) {
  const [system, setSystem] = useState<SystemId>(defaultSystem);
  const [locale, setLocale] = useState<LocaleId>(defaultSystem === 'jalali' ? 'fa' : 'en');
  const [numerals, setNumerals] = useState<NumeralChoice>('auto');
  const [view, setView] = useState<CalendarViewKind>(defaultView);
  const [selected, setSelected] = useState<{ event: CalendarEvent; occurrence: ResolvedEvent } | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  // Shared with the docs site's header button so the two never disagree.
  const { theme, setTheme } = useTheme();

  const now = useMemo(() => today ?? new Date(), [today]);
  const [date, setDate] = useState<Date>(now);
  useEffect(() => setDate(now), [now]);

  // Switching system swaps the locale to its natural default, which the user
  // can then override — that combination (Jalali + English) is a real use case.
  const changeSystem = (next: SystemId) => {
    setSystem(next);
    setLocale(next === 'jalali' ? 'fa' : 'en');
    setSelected(null);
  };

  const events = useMemo(() => buildSampleEvents(date, system, locale), [date, system, locale]);
  const direction = getLocaleDirection(locale);

  const details = useMemo<EventDetails | null>(() => {
    if (!selected) return null;
    const { event, occurrence } = selected;
    const resolved = resolveCalendarSystem(system);
    const pattern = direction === 'rtl' ? 'EEEE d MMMM yyyy' : 'EEEE, MMMM d, yyyy';
    const opts = { locale, numerals: numerals === 'auto' ? undefined : numerals };
    const fa = locale === 'fa';
    const days = occurrence.endDayNumber - occurrence.startDayNumber + 1;

    return {
      title: occurrence.title,
      day: resolved.format(occurrence.start, pattern, opts),
      time: occurrence.allDay
        ? fa
          ? 'تمام‌روز'
          : 'All day'
        : `${resolved.format(occurrence.start, 'HH:mm', opts)} – ${resolved.format(occurrence.end, 'HH:mm', opts)}`,
      room: (event.meta as { room?: string } | undefined)?.room,
      variant: occurrence.variant,
      span: occurrence.isMultiDay
        ? fa
          ? `${resolved.format(occurrence.start, 'd MMMM', opts)} تا ${resolved.format(resolved.addDays(resolved.fromDate(occurrence.start), days - 1), 'd MMMM', opts)} (${days} روز)`
          : `${days} days, ${resolved.format(occurrence.start, 'MMM d', opts)} – ${resolved.format(resolved.addDays(resolved.fromDate(occurrence.start), days - 1), 'MMM d', opts)}`
        : undefined,
      // The instants exactly as the callback hands them over — the point the
      // old inline strip was making, with room to show it properly.
      payload: JSON.stringify(
        {
          id: occurrence.id,
          start: occurrence.start.toISOString(),
          end: occurrence.end.toISOString(),
          allDay: occurrence.allDay,
          variant: occurrence.variant,
        },
        null,
        2,
      ),
    };
  }, [selected, system, locale, numerals, direction]);

  return (
    <div className={className}>
      {hideControls ? null : (
        <div className="mb-5 flex flex-wrap items-end gap-x-6 gap-y-4 rounded-lg border border-border bg-muted/30 p-4">
          <Segmented
            label="Calendar system"
            value={system}
            onChange={changeSystem}
            options={[
              { value: 'gregorian', label: 'Gregorian' },
              { value: 'jalali', label: 'Jalali (شمسی)' },
            ]}
          />
          <Segmented
            label="Locale / direction"
            value={locale}
            onChange={(next) => setLocale(next)}
            options={[
              { value: 'en', label: 'en · LTR' },
              { value: 'fa', label: 'fa · RTL' },
            ]}
          />
          <Segmented
            label="Digits"
            value={numerals}
            onChange={(next) => setNumerals(next)}
            options={[
              { value: 'auto', label: 'Auto' },
              { value: 'latn', label: '1 2 3' },
              { value: 'arabext', label: '۱ ۲ ۳' },
            ]}
          />
          <Segmented
            label="Theme"
            value={theme}
            onChange={(next: Theme) => setTheme(next)}
            options={[
              { value: 'system', label: 'Auto' },
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
          />
          <div className="ms-auto text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{events.length}</span> sample events
          </div>
        </div>
      )}

      <Calendar
        date={date}
        onDateChange={setDate}
        view={view}
        onViewChange={setView}
        events={events}
        calendarSystem={system}
        locale={locale}
        numerals={numerals === 'auto' ? undefined : numerals}
        today={now}
        selectedDate={selectedDate}
        startHour={7}
        endHour={20}
        agendaDays={30}
        onEventClick={(event, occurrence) => setSelected({ event, occurrence })}
        onDateSelect={(next, cell) => {
          setSelectedDate(next);
          if (view === 'month') setDate(next);
          // `cell.key` is the ISO day, identical in both calendar systems.
          console.info('date selected', cell.key, cell.calendarDate);
        }}
      />

      <EventDialog details={details} locale={locale} dir={direction} onClose={() => setSelected(null)} />
    </div>
  );
}
