import type { DayCell, MonthGrid, TimeGrid, TimeSlot } from '@rooz-calendar/core';
import * as React from 'react';
import { cn } from '../lib/utils';

/** Anything `CalendarGrid` can render. */
export type AnyGrid = MonthGrid | TimeGrid;

export interface CalendarGridProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  /** A grid produced by `@rooz-calendar/core`'s builders. */
  grid: AnyGrid;
  /** Day keys (ISO `YYYY-MM-DD`) to render as selected. */
  selectedKeys?: readonly string[];
  /** Hide the weekday header row. */
  hideWeekdayHeader?: boolean;
  /** Minimum height of a month cell. @default '6.5rem' */
  monthCellMinHeight?: string;
  /** Height in pixels of one time-slot row. @default 48 */
  slotHeight?: number;
  /** Width of the time gutter in a week/day grid. @default '3.75rem' */
  gutterWidth?: string;
  /** Content rendered inside a month cell, below the day number. */
  renderDayContent?: (day: DayCell) => React.ReactNode;
  /** Overlay content for one day column of a week/day grid, positioned absolutely. */
  renderColumnContent?: (day: DayCell) => React.ReactNode;
  /** Extra header content per day column of a week/day grid. */
  renderDayHeader?: (day: DayCell) => React.ReactNode;
  /** A full-width rail above a week/day grid, for all-day events. */
  renderAllDayRail?: (days: DayCell[]) => React.ReactNode;
  /** Accessible label for a day cell. Defaults to the cell's ISO key. */
  dayLabel?: (day: DayCell) => string;
  /** Fired when a day is chosen. */
  onDaySelect?: (day: DayCell, event: React.MouseEvent<HTMLElement>) => void;
  /** Fired when a time slot is chosen in a week/day grid. */
  onSlotSelect?: (day: DayCell, slot: TimeSlot, event: React.MouseEvent<HTMLElement>) => void;
}

/**
 * Renders a month, week or day grid produced by `@rooz-calendar/core`.
 *
 * Deliberately free of any scheduling logic: it draws whatever cells the grid
 * contains and hands their content back to the caller through render props.
 * Because the grid was built natively in the active calendar system, laying it
 * out here is the same code for Gregorian and Jalali — including the column
 * order, which follows the grid's own `weekStartsOn`.
 */
export const CalendarGrid = React.forwardRef<HTMLDivElement, CalendarGridProps>(function CalendarGrid(
  {
    grid,
    selectedKeys,
    hideWeekdayHeader = false,
    monthCellMinHeight = '6.5rem',
    slotHeight = 48,
    gutterWidth = '3.75rem',
    renderDayContent,
    renderColumnContent,
    renderDayHeader,
    renderAllDayRail,
    dayLabel,
    onDaySelect,
    onSlotSelect,
    className,
    ...props
  },
  ref,
) {
  const selected = React.useMemo(() => new Set(selectedKeys ?? []), [selectedKeys]);

  return (
    <div
      ref={ref}
      dir={grid.direction}
      role="grid"
      className={cn(
        'w-full overflow-hidden rounded-lg border border-border bg-card text-card-foreground',
        className,
      )}
      {...props}
    >
      {grid.kind === 'month' ? (
        <MonthBody
          grid={grid}
          selected={selected}
          hideWeekdayHeader={hideWeekdayHeader}
          cellMinHeight={monthCellMinHeight}
          renderDayContent={renderDayContent}
          dayLabel={dayLabel}
          onDaySelect={onDaySelect}
        />
      ) : (
        <TimeBody
          grid={grid}
          selected={selected}
          slotHeight={slotHeight}
          gutterWidth={gutterWidth}
          renderColumnContent={renderColumnContent}
          renderDayHeader={renderDayHeader}
          renderAllDayRail={renderAllDayRail}
          dayLabel={dayLabel}
          onDaySelect={onDaySelect}
          onSlotSelect={onSlotSelect}
        />
      )}
    </div>
  );
});

/* ------------------------------------------------------------------ month */

interface MonthBodyProps {
  grid: MonthGrid;
  selected: ReadonlySet<string>;
  hideWeekdayHeader: boolean;
  cellMinHeight: string;
  renderDayContent?: (day: DayCell) => React.ReactNode;
  dayLabel?: (day: DayCell) => string;
  onDaySelect?: (day: DayCell, event: React.MouseEvent<HTMLElement>) => void;
}

function MonthBody({
  grid,
  selected,
  hideWeekdayHeader,
  cellMinHeight,
  renderDayContent,
  dayLabel,
  onDaySelect,
}: MonthBodyProps) {
  return (
    <>
      {hideWeekdayHeader ? null : (
        <div role="row" className="grid grid-cols-7 border-b border-border bg-muted/40">
          {grid.weekdayLabels.map((label) => (
            <div
              key={label.weekday}
              role="columnheader"
              title={label.long}
              className={cn(
                'py-2 text-center text-xs font-medium text-muted-foreground',
                label.isWeekend && 'text-muted-foreground/70',
              )}
            >
              {label.short}
            </div>
          ))}
        </div>
      )}
      <div role="rowgroup">
        {grid.weeks.map((week) => (
          <div key={week.index} role="row" className="grid grid-cols-7 last:[&>*]:border-b-0">
            {week.days.map((day) => (
              <div
                key={day.key}
                role="gridcell"
                aria-selected={selected.has(day.key) || undefined}
                onClick={(event) => onDaySelect?.(day, event)}
                style={{ minHeight: cellMinHeight }}
                className={cn(
                  'flex flex-col gap-1 border-b border-e border-border p-1 transition-colors last:border-e-0',
                  onDaySelect && 'cursor-pointer hover:bg-accent/40',
                  !day.isCurrentMonth && 'bg-muted/60 text-muted-foreground',
                  day.isWeekend && day.isCurrentMonth && 'bg-muted/35',
                  selected.has(day.key) && 'bg-accent/60 hover:bg-accent/60',
                )}
              >
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    tabIndex={day.isCurrentMonth ? 0 : -1}
                    aria-label={dayLabel?.(day) ?? day.key}
                    aria-current={day.isToday ? 'date' : undefined}
                    onClick={(event) => {
                      event.stopPropagation();
                      onDaySelect?.(day, event);
                    }}
                    className={cn(
                      'inline-flex size-6 items-center justify-center rounded-full text-xs font-medium tabular-nums outline-none transition-colors focus-visible:ring-[2px] focus-visible:ring-ring/60',
                      !onDaySelect && 'pointer-events-none',
                      day.isToday && 'bg-primary text-primary-foreground',
                      !day.isToday && !day.isCurrentMonth && 'text-muted-foreground/60',
                      !day.isToday && onDaySelect && 'hover:bg-accent',
                    )}
                  >
                    {day.dayLabel}
                  </button>
                </div>
                {renderDayContent ? (
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">{renderDayContent(day)}</div>
                ) : null}
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

/* ------------------------------------------------------------- week / day */

interface TimeBodyProps {
  grid: TimeGrid;
  selected: ReadonlySet<string>;
  slotHeight: number;
  gutterWidth: string;
  renderColumnContent?: (day: DayCell) => React.ReactNode;
  renderDayHeader?: (day: DayCell) => React.ReactNode;
  renderAllDayRail?: (days: DayCell[]) => React.ReactNode;
  dayLabel?: (day: DayCell) => string;
  onDaySelect?: (day: DayCell, event: React.MouseEvent<HTMLElement>) => void;
  onSlotSelect?: (day: DayCell, slot: TimeSlot, event: React.MouseEvent<HTMLElement>) => void;
}

function TimeBody({
  grid,
  selected,
  slotHeight,
  gutterWidth,
  renderColumnContent,
  renderDayHeader,
  renderAllDayRail,
  dayLabel,
  onDaySelect,
  onSlotSelect,
}: TimeBodyProps) {
  const columns = `repeat(${grid.days.length}, minmax(0, 1fr))`;
  const weekdayNames = grid.weekdayLabels;
  const shortFor = (day: DayCell) => weekdayNames.find((label) => label.weekday === day.weekday)?.short ?? '';

  return (
    <>
      <div role="row" className="flex border-b border-border bg-muted/40">
        <div style={{ width: gutterWidth }} className="shrink-0 border-e border-border" aria-hidden="true" />
        <div className="grid flex-1" style={{ gridTemplateColumns: columns }}>
          {grid.days.map((day) => (
            <div
              key={day.key}
              role="columnheader"
              onClick={(event) => onDaySelect?.(day, event)}
              className={cn(
                'flex flex-col items-center gap-0.5 border-e border-border py-2 last:border-e-0',
                onDaySelect && 'cursor-pointer hover:bg-accent/40',
                selected.has(day.key) && 'bg-accent/60',
              )}
            >
              <span className="text-xs font-medium text-muted-foreground">{shortFor(day)}</span>
              <span
                aria-label={dayLabel?.(day) ?? day.key}
                aria-current={day.isToday ? 'date' : undefined}
                className={cn(
                  'inline-flex size-7 items-center justify-center rounded-full text-sm font-semibold tabular-nums',
                  day.isToday && 'bg-primary text-primary-foreground',
                )}
              >
                {day.dayLabel}
              </span>
              {renderDayHeader?.(day)}
            </div>
          ))}
        </div>
      </div>

      {renderAllDayRail ? (
        <div className="flex border-b border-border">
          <div
            style={{ width: gutterWidth }}
            className="shrink-0 border-e border-border px-2 py-1 text-end text-[0.625rem] uppercase tracking-wide text-muted-foreground"
          >
            {/* Intentionally unlabeled in RTL-neutral terms; the rail is self-evident. */}
          </div>
          <div className="grid flex-1" style={{ gridTemplateColumns: columns }}>
            {renderAllDayRail(grid.days)}
          </div>
        </div>
      ) : null}

      <div className="flex overflow-hidden">
        <div style={{ width: gutterWidth }} className="shrink-0 border-e border-border">
          {grid.slots.map((slot) => (
            <div
              key={slot.index}
              style={{ height: slotHeight }}
              className="relative -top-2 pe-2 text-end text-[0.6875rem] tabular-nums text-muted-foreground"
            >
              {slot.index === 0 ? null : slot.label}
            </div>
          ))}
        </div>
        <div className="grid flex-1" style={{ gridTemplateColumns: columns }}>
          {grid.days.map((day) => (
            <div key={day.key} className="relative border-e border-border last:border-e-0">
              {grid.slots.map((slot) => (
                <div
                  key={slot.index}
                  role="gridcell"
                  aria-label={`${dayLabel?.(day) ?? day.key} ${slot.label}`}
                  onClick={(event) => onSlotSelect?.(day, slot, event)}
                  style={{ height: slotHeight }}
                  className={cn(
                    'border-b border-border/60 transition-colors',
                    !slot.isMajor && 'border-dashed',
                    day.isWeekend && 'bg-muted/35',
                    onSlotSelect && 'cursor-pointer hover:bg-accent/40',
                  )}
                />
              ))}
              {renderColumnContent ? (
                <div className="pointer-events-none absolute inset-0">{renderColumnContent(day)}</div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
