import { getLocaleDirection, primarySubtag, type Direction } from '@rooz/calendar-core';
import * as ToggleGroup from '@radix-ui/react-toggle-group';
import * as React from 'react';
import { cn } from '../lib/utils';
import { Button } from './button';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

/** The four views shipped in v1. */
export type CalendarViewKind = 'month' | 'week' | 'day' | 'agenda';

/** Every string `CalendarHeader` renders, so any locale can be supplied. */
export interface CalendarHeaderLabels {
  previous: string;
  next: string;
  today: string;
  month: string;
  week: string;
  day: string;
  agenda: string;
}

const LABELS: Record<string, CalendarHeaderLabels> = {
  en: {
    previous: 'Previous',
    next: 'Next',
    today: 'Today',
    month: 'Month',
    week: 'Week',
    day: 'Day',
    agenda: 'Agenda',
  },
  fa: {
    previous: 'قبلی',
    next: 'بعدی',
    today: 'امروز',
    month: 'ماه',
    week: 'هفته',
    day: 'روز',
    agenda: 'فهرست',
  },
};

export interface CalendarHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Period label, already formatted in the active calendar system. */
  title: string;
  /**
   * Locale, used only to pick the built-in control labels and text direction.
   * Override individual strings with `labels`.
   */
  locale?: string;
  /** Force a direction instead of deriving it from `locale`. */
  direction?: Direction;
  /** Currently active view. Omit to hide the view switcher. */
  view?: CalendarViewKind;
  /** Views offered by the switcher. @default all four */
  views?: readonly CalendarViewKind[];
  onViewChange?: (view: CalendarViewKind) => void;
  /** Step back one period. Omit to hide the button. */
  onPrevious?: () => void;
  /** Step forward one period. Omit to hide the button. */
  onNext?: () => void;
  /** Jump to today. Omit to hide the button. */
  onToday?: () => void;
  /** Override any built-in label. */
  labels?: Partial<CalendarHeaderLabels>;
  /** Extra controls, rendered at the trailing edge. */
  children?: React.ReactNode;
}

const ALL_VIEWS: readonly CalendarViewKind[] = ['month', 'week', 'day', 'agenda'];

/**
 * Title, period navigation and view switcher.
 *
 * Fully mirrored under RTL: the container carries `dir`, spacing uses logical
 * properties, and the navigation chevrons flip so "previous" always points at
 * the past — which in Farsi is to the right.
 */
export const CalendarHeader = React.forwardRef<HTMLDivElement, CalendarHeaderProps>(function CalendarHeader(
  {
    title,
    locale = 'en',
    direction,
    view,
    views = ALL_VIEWS,
    onViewChange,
    onPrevious,
    onNext,
    onToday,
    labels,
    children,
    className,
    ...props
  },
  ref,
) {
  const resolvedDirection = direction ?? getLocaleDirection(locale);
  const text: CalendarHeaderLabels = {
    ...(LABELS[primarySubtag(locale)] ?? LABELS.en!),
    ...labels,
  };

  return (
    <div
      ref={ref}
      dir={resolvedDirection}
      className={cn('flex flex-wrap items-center justify-between gap-3 pb-3', className)}
      {...props}
    >
      <div className="flex items-center gap-2">
        {onPrevious || onNext ? (
          <div className="flex items-center gap-1">
            {onPrevious ? (
              <Button variant="outline" size="icon" onClick={onPrevious} aria-label={text.previous}>
                <ChevronLeftIcon className="rtl:rotate-180" />
              </Button>
            ) : null}
            {onNext ? (
              <Button variant="outline" size="icon" onClick={onNext} aria-label={text.next}>
                <ChevronRightIcon className="rtl:rotate-180" />
              </Button>
            ) : null}
          </div>
        ) : null}
        {onToday ? (
          <Button variant="outline" size="sm" onClick={onToday}>
            {text.today}
          </Button>
        ) : null}
        <h2 className="ms-1 text-base font-semibold tracking-tight text-foreground sm:text-lg">{title}</h2>
      </div>

      <div className="flex items-center gap-2">
        {children}
        {view && onViewChange ? (
          <ToggleGroup.Root
            type="single"
            value={view}
            dir={resolvedDirection}
            onValueChange={(next) => {
              // Radix emits '' when the active item is re-pressed; keep the view.
              if (next) onViewChange(next as CalendarViewKind);
            }}
            className="inline-flex items-center gap-1 rounded-md border border-input bg-background p-0.5"
          >
            {views.map((kind) => (
              <ToggleGroup.Item
                key={kind}
                value={kind}
                aria-label={text[kind]}
                className={cn(
                  'inline-flex h-7 items-center justify-center rounded-sm px-2.5 text-xs font-medium outline-none transition-colors',
                  'hover:bg-accent hover:text-accent-foreground focus-visible:ring-[2px] focus-visible:ring-ring/60',
                  'data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary',
                )}
              >
                {text[kind]}
              </ToggleGroup.Item>
            ))}
          </ToggleGroup.Root>
        ) : null}
      </div>
    </div>
  );
});
