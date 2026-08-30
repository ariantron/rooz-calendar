/**
 * `@rooz-calendar/ui` — shadcn-styled React calendar views built on
 * `@rooz-calendar/core`.
 *
 * Every view takes the same small prop set (`events`, `calendarSystem`,
 * `locale`, `onEventClick`, `onDateSelect`), and every grid is generated
 * natively in the active calendar system rather than translated from Gregorian.
 */

export { cn } from './lib/utils';

export { CalendarGrid, type AnyGrid, type CalendarGridProps } from './primitives/calendar-grid';
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  type DialogContentProps,
} from './primitives/dialog';
export {
  CalendarHeader,
  type CalendarHeaderLabels,
  type CalendarHeaderProps,
  type CalendarViewKind,
} from './primitives/calendar-header';
export { EventBlock, eventBlockVariants, type EventBlockProps } from './primitives/event-block';

export { MonthView, type MonthViewProps } from './views/month-view';
export { DayView, WeekView, type DayViewProps, type WeekViewProps } from './views/time-view';
export { AgendaView, type AgendaViewProps } from './views/agenda-view';
export { Calendar, type CalendarProps } from './calendar';

export { useViewContext, type ViewContext } from './lib/use-view-context';
export type { CalendarViewBaseProps, TimeViewBaseProps } from './types';

// Re-exported so consumers can type their event data without a second import.
export type {
  CalendarEvent,
  CalendarSystem,
  CalendarSystemInput,
  DayCell,
  EventVariant,
  Numerals,
  ResolvedEvent,
  WeekdayIndex,
} from '@rooz-calendar/core';
