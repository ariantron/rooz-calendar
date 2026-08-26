import { buildPeriodTitle, stepPeriod, type PeriodKind } from '@rooz/calendar-core';
import * as React from 'react';
import { useViewContext } from './lib/use-view-context';
import { cn } from './lib/utils';
import { CalendarHeader, type CalendarHeaderProps, type CalendarViewKind } from './primitives/calendar-header';
import type { TimeViewBaseProps } from './types';
import { AgendaView } from './views/agenda-view';
import { MonthView, type MonthViewProps } from './views/month-view';
import { DayView, WeekView } from './views/time-view';

export interface CalendarProps extends TimeViewBaseProps, Pick<MonthViewProps, 'fixedWeeks' | 'maxEventsPerDay' | 'cellMinHeight'> {
  /** Active view. Supply with `onViewChange` to control it. */
  view?: CalendarViewKind;
  /** Initial view when uncontrolled. @default 'month' */
  defaultView?: CalendarViewKind;
  onViewChange?: (view: CalendarViewKind) => void;
  /** Views offered by the switcher. @default all four */
  views?: readonly CalendarViewKind[];
  /** Initial focused date when uncontrolled. @default today */
  defaultDate?: Date;
  /** Fired whenever navigation moves the focused date. */
  onDateChange?: (date: Date) => void;
  /** Hide the header entirely. */
  hideHeader?: boolean;
  /** Extra props forwarded to {@link CalendarHeader}. */
  headerProps?: Omit<CalendarHeaderProps, 'title' | 'view' | 'onViewChange' | 'onPrevious' | 'onNext' | 'onToday'>;
  /** Days an agenda view covers. @default 30 */
  agendaDays?: number;
}

/**
 * Header plus a view, with navigation wired up.
 *
 * A thin composition over the exported primitives — nothing here is private.
 * Navigation steps by whole periods **in the active calendar system**, so
 * "next month" in Jalali means Farvardin → Ordibehesht.
 */
export function Calendar(props: CalendarProps) {
  const {
    view: viewProp,
    defaultView = 'month',
    onViewChange,
    views,
    date: dateProp,
    defaultDate,
    onDateChange,
    hideHeader = false,
    headerProps,
    agendaDays = 30,
    className,
    ...rest
  } = props;

  const ctx = useViewContext(props);

  const [internalView, setInternalView] = React.useState<CalendarViewKind>(defaultView);
  const view = viewProp ?? internalView;
  const changeView = (next: CalendarViewKind) => {
    if (viewProp === undefined) setInternalView(next);
    onViewChange?.(next);
  };

  const [internalDate, setInternalDate] = React.useState<Date>(() => defaultDate ?? ctx.today);
  const date = dateProp ?? internalDate;
  const changeDate = (next: Date) => {
    if (dateProp === undefined) setInternalDate(next);
    onDateChange?.(next);
  };

  const periodOptions = { ...ctx.gridOptions, agendaDays };
  const title = buildPeriodTitle(view as PeriodKind, date, periodOptions);
  const step = (delta: number) => changeDate(stepPeriod(view as PeriodKind, date, delta, periodOptions));

  const shared = { ...rest, date, calendarSystem: ctx.system, locale: ctx.locale, numerals: ctx.numerals, today: ctx.today };

  return (
    <div dir={ctx.direction} className={cn('flex w-full flex-col', className)}>
      {hideHeader ? null : (
        <CalendarHeader
          {...headerProps}
          title={title}
          locale={ctx.locale}
          direction={ctx.direction}
          view={view}
          views={views}
          onViewChange={changeView}
          onPrevious={() => step(-1)}
          onNext={() => step(1)}
          onToday={() => changeDate(ctx.today)}
        />
      )}
      {view === 'month' ? <MonthView {...shared} /> : null}
      {view === 'week' ? <WeekView {...shared} /> : null}
      {view === 'day' ? <DayView {...shared} /> : null}
      {view === 'agenda' ? <AgendaView {...shared} days={agendaDays} /> : null}
    </div>
  );
}
