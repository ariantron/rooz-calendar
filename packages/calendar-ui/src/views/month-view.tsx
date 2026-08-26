import {
  buildMonthGrid,
  eventsForDay,
  groupEventsByDay,
  toNumerals,
  type DayCell,
  type ResolvedEvent,
} from '@rooz/calendar-core';
import * as React from 'react';
import { cn } from '../lib/utils';
import { useViewContext } from '../lib/use-view-context';
import { CalendarGrid } from '../primitives/calendar-grid';
import { EventBlock } from '../primitives/event-block';
import type { CalendarViewBaseProps } from '../types';

export interface MonthViewProps extends CalendarViewBaseProps {
  /** Always render six week rows so the grid height never jumps. */
  fixedWeeks?: boolean;
  /** Event chips shown per day before collapsing into "+N more". @default 3 */
  maxEventsPerDay?: number;
  /** Minimum height of a day cell. @default '6.5rem' */
  cellMinHeight?: string;
  /** Label for the overflow row. @default `+N more` / `N+ بیشتر` */
  moreLabel?: (count: number) => string;
  /** Fired when the overflow row is clicked. */
  onShowMore?: (day: DayCell, events: ResolvedEvent[]) => void;
}

/**
 * A month laid out natively in the active calendar system.
 *
 * The grid comes straight from `buildMonthGrid`, so Farvardin 1405 is a real
 * Jalali month — 31 days, aligned to a Saturday-first week — rather than March
 * with Persian labels pasted over it.
 */
export function MonthView(props: MonthViewProps) {
  const {
    fixedWeeks,
    maxEventsPerDay = 3,
    cellMinHeight = '6.5rem',
    moreLabel,
    onShowMore,
    onEventClick,
    onDateSelect,
    className,
  } = props;
  const ctx = useViewContext(props);

  const grid = React.useMemo(() => {
    const calendarDate = ctx.system.fromDate(ctx.date);
    return buildMonthGrid(calendarDate.year, calendarDate.month, { ...ctx.gridOptions, fixedWeeks });
  }, [ctx.system, ctx.date, ctx.gridOptions, fixedWeeks]);

  const buckets = React.useMemo(() => groupEventsByDay(ctx.resolvedEvents), [ctx.resolvedEvents]);

  const renderMore = React.useCallback(
    (count: number) =>
      moreLabel
        ? moreLabel(count)
        : ctx.direction === 'rtl'
          ? `${toNumerals(String(count), ctx.numerals)} مورد دیگر`
          : `+${count} more`,
    [moreLabel, ctx.direction, ctx.numerals],
  );

  return (
    <CalendarGrid
      grid={grid}
      className={className}
      selectedKeys={ctx.selectedKeys}
      monthCellMinHeight={cellMinHeight}
      dayLabel={ctx.dayLabel}
      onDaySelect={onDateSelect ? (day) => onDateSelect(day.date, day) : undefined}
      renderDayContent={(day) => {
        const dayEvents = eventsForDay(buckets, day);
        if (dayEvents.length === 0) return null;
        const visible = dayEvents.slice(0, maxEventsPerDay);
        const hidden = dayEvents.length - visible.length;
        return (
          <>
            {visible.map((occurrence) => (
              <EventBlock
                key={occurrence.id}
                layout="chip"
                title={occurrence.title}
                start={occurrence.start}
                allDay={occurrence.allDay || occurrence.isMultiDay}
                variant={occurrence.variant}
                color={occurrence.color}
                formatTime={ctx.formatTime}
                className={cn(!day.isCurrentMonth && 'opacity-60')}
                onClick={(clickEvent) => {
                  clickEvent.stopPropagation();
                  onEventClick?.(occurrence.source, occurrence);
                }}
              />
            ))}
            {hidden > 0 ? (
              <button
                type="button"
                className="rounded-sm px-1.5 text-start text-[0.625rem] font-medium text-muted-foreground outline-none hover:text-foreground hover:underline focus-visible:ring-[2px] focus-visible:ring-ring/60"
                onClick={(clickEvent) => {
                  clickEvent.stopPropagation();
                  if (onShowMore) onShowMore(day, dayEvents);
                  else onDateSelect?.(day.date, day);
                }}
              >
                {renderMore(hidden)}
              </button>
            ) : null}
          </>
        );
      }}
    />
  );
}
