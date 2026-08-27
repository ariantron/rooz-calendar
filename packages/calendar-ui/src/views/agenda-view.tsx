import { buildAgendaGrid } from '@rooz-calendar/core';
import * as React from 'react';
import { useViewContext } from '../lib/use-view-context';
import { cn } from '../lib/utils';
import { EventBlock } from '../primitives/event-block';
import type { CalendarViewBaseProps } from '../types';

export interface AgendaViewProps extends CalendarViewBaseProps {
  /** Days to list, starting at `date`. Ignored when `from`/`to` are given. @default 30 */
  days?: number;
  /** Explicit range start, inclusive. */
  from?: Date;
  /** Explicit range end, inclusive. */
  to?: Date;
  /** List days with no events too. */
  includeEmptyDays?: boolean;
  /** Message shown when the range holds no events at all. */
  emptyLabel?: string;
}

/**
 * A chronological list of days and their events.
 *
 * Day headings are formatted in the active calendar system, so a Jalali agenda
 * reads «شنبه ۱ فروردین» rather than a translated Gregorian date.
 */
export function AgendaView(props: AgendaViewProps) {
  const { days = 30, from, to, includeEmptyDays, emptyLabel, onEventClick, onDateSelect, className } = props;
  const ctx = useViewContext(props);

  const grid = React.useMemo(() => {
    const start = from ?? ctx.date;
    const end = to ?? ctx.system.toDate(ctx.system.addDays(ctx.system.fromDate(start), Math.max(0, days - 1)));
    return buildAgendaGrid(ctx.resolvedEvents, { ...ctx.gridOptions, from: start, to: end, includeEmptyDays });
  }, [ctx.system, ctx.date, ctx.gridOptions, ctx.resolvedEvents, from, to, days, includeEmptyDays]);

  const emptyText = emptyLabel ?? (ctx.direction === 'rtl' ? 'رویدادی در این بازه نیست' : 'No events in this range');

  return (
    <div
      dir={ctx.direction}
      className={cn(
        'w-full overflow-hidden rounded-lg border border-border bg-card text-card-foreground',
        className,
      )}
    >
      {grid.days.length === 0 ? (
        <p className="p-8 text-center text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="divide-y divide-border">
          {grid.days.map((day) => (
            <li key={day.key} className="flex flex-col gap-2 p-3 sm:flex-row sm:gap-4">
              <button
                type="button"
                disabled={!onDateSelect}
                onClick={() => onDateSelect?.(day.date, day)}
                className={cn(
                  'shrink-0 text-start text-sm font-medium sm:w-48',
                  day.isToday ? 'text-primary' : 'text-muted-foreground',
                  onDateSelect && 'hover:text-foreground hover:underline',
                  !onDateSelect && 'cursor-default',
                )}
              >
                {day.label}
              </button>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                {day.events.length === 0 ? (
                  <span className="text-sm text-muted-foreground/70">{emptyText}</span>
                ) : (
                  day.events.map((occurrence) => (
                    <EventBlock
                      key={occurrence.id}
                      layout="row"
                      title={occurrence.title}
                      start={occurrence.start}
                      end={occurrence.end}
                      allDay={occurrence.allDay}
                      variant={occurrence.variant}
                      color={occurrence.color}
                      formatTime={ctx.formatTime}
                      onClick={() => onEventClick?.(occurrence.source, occurrence)}
                    />
                  ))
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
