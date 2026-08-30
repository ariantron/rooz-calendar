import {
  allDayEventsForDay,
  buildDayGrid,
  buildWeekGrid,
  eventsForDay,
  groupEventsByDay,
  layoutDayEvents,
  slotStart,
} from '@rooz-calendar/core';
import * as React from 'react';
import { useViewContext } from '../lib/use-view-context';
import { cn } from '../lib/utils';
import { CalendarGrid } from '../primitives/calendar-grid';
import { EventBlock } from '../primitives/event-block';
import type { TimeViewBaseProps } from '../types';

export type WeekViewProps = TimeViewBaseProps;
export type DayViewProps = TimeViewBaseProps;

interface TimeViewProps extends TimeViewBaseProps {
  kind: 'week' | 'day';
}

/** Shared implementation behind {@link WeekView} and {@link DayView}. */
function TimeView(props: TimeViewProps) {
  const {
    kind,
    // A full day by default. Cropping to office hours hides events rather
    // than compacting them, and a caller who wants a narrower window can say
    // so; a caller who does not cannot discover what they are missing.
    startHour = 0,
    endHour = 24,
    slotMinutes = 60,
    slotHeight = 48,
    onEventClick,
    onDateSelect,
    className,
  } = props;
  const ctx = useViewContext(props);

  const grid = React.useMemo(() => {
    const options = { ...ctx.gridOptions, startHour, endHour, slotMinutes };
    return kind === 'week' ? buildWeekGrid(ctx.date, options) : buildDayGrid(ctx.date, options);
  }, [kind, ctx.date, ctx.gridOptions, startHour, endHour, slotMinutes]);

  const buckets = React.useMemo(() => groupEventsByDay(ctx.resolvedEvents), [ctx.resolvedEvents]);

  const hasAllDay = React.useMemo(
    () => grid.days.some((day) => allDayEventsForDay(eventsForDay(buckets, day)).length > 0),
    [grid.days, buckets],
  );

  return (
    <CalendarGrid
      grid={grid}
      className={className}
      selectedKeys={ctx.selectedKeys}
      slotHeight={slotHeight}
      dayLabel={ctx.dayLabel}
      onDaySelect={onDateSelect ? (day) => onDateSelect(day.date, day) : undefined}
      onSlotSelect={onDateSelect ? (day, slot) => onDateSelect(slotStart(day, slot), day) : undefined}
      renderAllDayRail={
        hasAllDay
          ? (days) =>
              days.map((day) => (
                <div
                  key={day.key}
                  className="flex min-h-9 flex-col gap-0.5 border-e border-border p-1 last:border-e-0"
                >
                  {allDayEventsForDay(eventsForDay(buckets, day)).map((occurrence) => (
                    <EventBlock
                      key={occurrence.id}
                      layout="chip"
                      title={occurrence.title}
                      allDay
                      variant={occurrence.variant}
                      color={occurrence.color}
                      onClick={() => onEventClick?.(occurrence.source, occurrence)}
                    />
                  ))}
                </div>
              ))
          : undefined
      }
      renderColumnContent={(day) => {
        const positioned = layoutDayEvents(eventsForDay(buckets, day), day, grid);
        return positioned.map((item) => {
          // Roughly two lines of text; below that, collapse onto one line
          // rather than clipping the second line through the middle.
          const dense = item.height * grid.totalMinutes < 50;
          return (
          <div
            key={item.event.id}
            className="pointer-events-auto absolute p-px"
            style={{
              top: `${item.top * 100}%`,
              height: `${item.height * 100}%`,
              insetInlineStart: `${(item.column / item.columnCount) * 100}%`,
              width: `${100 / item.columnCount}%`,
            }}
          >
            <EventBlock
              layout="block"
              title={item.event.title}
              start={item.event.start}
              // Drop the end time when the block is sharing its column: a
              // half-width block cannot fit a range without clipping it.
              end={item.columnCount === 1 ? item.event.end : undefined}
              variant={item.event.variant}
              color={item.event.color}
              formatTime={ctx.formatTime}
              dense={dense}
              clippedStart={item.clippedStart}
              clippedEnd={item.clippedEnd}
              className={cn(item.columnCount > 1 && 'shadow-sm')}
              onClick={(clickEvent) => {
                clickEvent.stopPropagation();
                onEventClick?.(item.event.source, item.event);
              }}
            />
          </div>
          );
        });
      }}
    />
  );
}

/**
 * Seven days with hour slots, aligned to the active system's own week start —
 * Saturday for Jalali, so a Jalali week is a genuinely different set of seven
 * days than the Gregorian one containing the same date.
 */
export function WeekView(props: WeekViewProps) {
  return <TimeView {...props} kind="week" />;
}

/** A single day with hour slots, in the active calendar system. */
export function DayView(props: DayViewProps) {
  return <TimeView {...props} kind="day" />;
}
