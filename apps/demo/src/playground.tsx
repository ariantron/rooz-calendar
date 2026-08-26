import type { CalendarEvent, Numerals, ResolvedEvent } from '@rooz/calendar-core';
import { getLocaleDirection, resolveCalendarSystem } from '@rooz/calendar-core';
import { Calendar, type CalendarViewKind } from '@rooz/calendar-ui';
import { useEffect, useMemo, useState } from 'react';
import { buildSampleEvents } from './sample-events';
import { Segmented } from './segmented';

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

  const summary = useMemo(() => {
    if (!selected) return null;
    const resolved = resolveCalendarSystem(system);
    const pattern = direction === 'rtl' ? 'EEEE d MMMM yyyy' : 'EEEE, MMMM d, yyyy';
    const opts = { locale, numerals: numerals === 'auto' ? undefined : numerals };
    const room = (selected.event.meta as { room?: string } | undefined)?.room;
    return {
      title: selected.occurrence.title,
      day: resolved.format(selected.occurrence.start, pattern, opts),
      time: selected.occurrence.allDay
        ? locale === 'fa'
          ? 'تمام‌روز'
          : 'All day'
        : `${resolved.format(selected.occurrence.start, 'HH:mm', opts)} – ${resolved.format(selected.occurrence.end, 'HH:mm', opts)}`,
      room,
      iso: selected.occurrence.start.toISOString(),
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

      <div
        dir={direction}
        className="mt-4 rounded-lg border border-border bg-card p-4 text-sm text-card-foreground"
        aria-live="polite"
      >
        {summary ? (
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="font-semibold">{summary.title}</span>
            <span className="text-muted-foreground">{summary.day}</span>
            <span className="text-muted-foreground tabular-nums">{summary.time}</span>
            {summary.room ? <span className="text-muted-foreground">· {summary.room}</span> : null}
            <code dir="ltr" className="ms-auto rounded bg-muted px-1.5 py-0.5 font-mono text-[0.6875rem] text-muted-foreground">
              {summary.iso}
            </code>
          </div>
        ) : (
          <span className="text-muted-foreground">
            {locale === 'fa' ? 'برای دیدن جزئیات روی یک رویداد کلیک کنید.' : 'Click an event to see what the callback hands back.'}
          </span>
        )}
      </div>
    </div>
  );
}
