import {
  buildMonthGrid,
  eventsForDay,
  groupEventsByDay,
  toNumerals,
  type DayCell,
  type ResolvedEvent,
} from '@rooz-calendar/core';
import * as React from 'react';
import { cn } from '../lib/utils';
import { useViewContext, type ViewContext } from '../lib/use-view-context';
import { CalendarGrid } from '../primitives/calendar-grid';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../primitives/dialog';
import { EventBlock } from '../primitives/event-block';
import type { CalendarViewBaseProps } from '../types';

export interface MonthViewProps extends CalendarViewBaseProps {
  /** Always render six week rows so the grid height never jumps. */
  fixedWeeks?: boolean;
  /** Event chips shown per day before collapsing into "+N more". @default 3 */
  maxEventsPerDay?: number;
  /** Minimum height of a day cell. @default '6.5rem' */
  cellMinHeight?: string;
  /**
   * Prefix each event chip with its start time. Turn off for narrow cells,
   * where the time crowds out the title. @default true
   */
  showEventTime?: boolean;
  /** Label for the overflow row. @default `+N more` / `N+ بیشتر` */
  moreLabel?: (count: number) => string;
  /**
   * Fired when the overflow row is clicked.
   *
   * Supplying this replaces the built-in dialog — the overflow row becomes a
   * plain button that calls this instead, for consumers who want to open their
   * own panel. Leave it unset to get the default dialog listing the day.
   */
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
    showEventTime = true,
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
                showTime={showEventTime}
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
              <DayOverflow
                ctx={ctx}
                day={day}
                dayEvents={dayEvents}
                label={renderMore(hidden)}
                onEventClick={onEventClick}
                onShowMore={onShowMore}
              />
            ) : null}
          </>
        );
      }}
    />
  );
}

const moreButtonClassName =
  'rounded-sm px-1.5 text-start text-[0.625rem] font-medium text-muted-foreground outline-none hover:text-foreground hover:underline focus-visible:ring-[2px] focus-visible:ring-ring/60';

interface DayOverflowProps {
  ctx: ViewContext;
  day: DayCell;
  /** Every event on the day, in the order the cell renders them. */
  dayEvents: ResolvedEvent[];
  label: string;
  onEventClick?: CalendarViewBaseProps['onEventClick'];
  onShowMore?: MonthViewProps['onShowMore'];
}

/**
 * The "+N more" row, and the dialog it opens.
 *
 * The dialog lists the day's events in full rather than only the hidden ones:
 * once the day is open in its own panel there is no reason to keep the first
 * few somewhere else, and reading the whole day is the point of opening it.
 */
function DayOverflow({ ctx, day, dayEvents, label, onEventClick, onShowMore }: DayOverflowProps) {
  // An explicit onShowMore means the consumer is opening their own panel;
  // stay out of the way and keep the pre-dialog behaviour exactly.
  if (onShowMore) {
    return (
      <button
        type="button"
        className={moreButtonClassName}
        onClick={(clickEvent) => {
          clickEvent.stopPropagation();
          onShowMore(day, dayEvents);
        }}
      >
        {label}
      </button>
    );
  }

  const rtl = ctx.direction === 'rtl';
  const countLabel = rtl
    ? `${toNumerals(String(dayEvents.length), ctx.numerals)} رویداد`
    : `${dayEvents.length} ${dayEvents.length === 1 ? 'event' : 'events'}`;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className={moreButtonClassName}
          // The day cell is itself clickable; without this, opening the
          // overflow would also select the day underneath.
          onClick={(clickEvent) => clickEvent.stopPropagation()}
        >
          {label}
        </button>
      </DialogTrigger>
      <DialogContent
        dir={ctx.direction}
        closeLabel={rtl ? 'بستن' : 'Close'}
        // The trigger lives inside a clickable day cell, and Radix dispatches
        // the closing click through the overlay — swallow it so dismissing the
        // dialog does not select the day behind it.
        onClick={(clickEvent) => clickEvent.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>{ctx.dayLabel(day)}</DialogTitle>
          <DialogDescription>{countLabel}</DialogDescription>
        </DialogHeader>
        <ul className="flex max-h-[60vh] flex-col gap-1.5 overflow-y-auto">
          {dayEvents.map((occurrence) => (
            <li key={occurrence.id}>
              {/*
                Closing on select keeps the consumer's own onEventClick handler
                from opening a second modal on top of this one.
              */}
              <DialogClose asChild>
                <EventBlock
                  layout="row"
                  title={occurrence.title}
                  start={occurrence.start}
                  end={occurrence.end}
                  allDay={occurrence.allDay || occurrence.isMultiDay}
                  variant={occurrence.variant}
                  color={occurrence.color}
                  formatTime={ctx.formatTime}
                  onClick={() => onEventClick?.(occurrence.source, occurrence)}
                />
              </DialogClose>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
