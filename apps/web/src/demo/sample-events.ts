import { resolveCalendarSystem, type CalendarEvent, type CalendarSystemInput } from '@rooz/calendar-core';

interface Seed {
  /** Days from the start of the reference month, in the active system. */
  dayOffset: number;
  startHour: number;
  durationMinutes: number;
  title: string;
  titleFa: string;
  variant: CalendarEvent['variant'];
  allDay?: boolean;
  spanDays?: number;
  room?: string;
}

/**
 * A college timetable's worth of sessions, positioned relative to the first day
 * of the displayed month so the demo always has something to show.
 */
const SEEDS: Seed[] = [
  { dayOffset: 1, startHour: 9, durationMinutes: 90, title: 'Linear Algebra — Lecture', titleFa: 'جبر خطی — درس', variant: 'default', room: 'Hall A' },
  { dayOffset: 1, startHour: 11, durationMinutes: 60, title: 'Office hours', titleFa: 'ساعت مراجعه', variant: 'muted', room: 'B-204' },
  { dayOffset: 2, startHour: 8, durationMinutes: 120, title: 'Physics Lab', titleFa: 'آزمایشگاه فیزیک', variant: 'success', room: 'Lab 3' },
  { dayOffset: 2, startHour: 9, durationMinutes: 60, title: 'Faculty standup', titleFa: 'جلسه گروه', variant: 'primary', room: 'Room 12' },
  { dayOffset: 3, startHour: 13, durationMinutes: 180, title: 'Thesis defence', titleFa: 'دفاع پایان‌نامه', variant: 'warning', room: 'Aula' },
  { dayOffset: 5, startHour: 10, durationMinutes: 60, title: 'Curriculum committee', titleFa: 'کمیته برنامه‌ریزی', variant: 'default', room: 'Room 4' },
  { dayOffset: 6, startHour: 0, durationMinutes: 0, title: 'Registration opens', titleFa: 'آغاز ثبت‌نام', variant: 'success', allDay: true },
  { dayOffset: 8, startHour: 9, durationMinutes: 90, title: 'Linear Algebra — Lecture', titleFa: 'جبر خطی — درس', variant: 'default', room: 'Hall A' },
  { dayOffset: 9, startHour: 14, durationMinutes: 120, title: 'Midterm — Statistics', titleFa: 'میان‌ترم آمار', variant: 'danger', room: 'Hall C' },
  { dayOffset: 10, startHour: 0, durationMinutes: 0, title: 'Field trip', titleFa: 'بازدید علمی', variant: 'success', allDay: true, spanDays: 3 },
  { dayOffset: 14, startHour: 11, durationMinutes: 45, title: 'Advisor meeting', titleFa: 'جلسه با استاد راهنما', variant: 'muted', room: 'B-110' },
  { dayOffset: 15, startHour: 9, durationMinutes: 90, title: 'Linear Algebra — Lecture', titleFa: 'جبر خطی — درس', variant: 'default', room: 'Hall A' },
  { dayOffset: 15, startHour: 10, durationMinutes: 60, title: 'Guest seminar', titleFa: 'سمینار مهمان', variant: 'warning', room: 'Hall B' },
  { dayOffset: 16, startHour: 8, durationMinutes: 120, title: 'Physics Lab', titleFa: 'آزمایشگاه فیزیک', variant: 'success', room: 'Lab 3' },
  { dayOffset: 18, startHour: 16, durationMinutes: 90, title: 'Department council', titleFa: 'شورای دانشکده', variant: 'default', room: 'Room 1' },
  { dayOffset: 21, startHour: 9, durationMinutes: 240, title: 'Final exams begin', titleFa: 'آغاز امتحانات پایان‌ترم', variant: 'danger', room: 'Hall C' },
  { dayOffset: 23, startHour: 13, durationMinutes: 60, title: 'Grading meeting', titleFa: 'جلسه نمره‌دهی', variant: 'muted', room: 'Room 12' },
  { dayOffset: 25, startHour: 10, durationMinutes: 120, title: 'Open day', titleFa: 'روز باز دانشگاه', variant: 'primary', room: 'Campus' },
];

/**
 * Build the sample events for a month, in whichever calendar system is active.
 *
 * The offsets are applied with the system's own date arithmetic, so switching
 * to Jalali does not scatter the timetable across two months.
 */
export function buildSampleEvents(
  reference: Date,
  system: CalendarSystemInput,
  locale: string,
): CalendarEvent[] {
  const resolved = resolveCalendarSystem(system);
  const calendarDate = resolved.fromDate(reference);
  const firstOfMonth = { year: calendarDate.year, month: calendarDate.month, day: 1 };
  const fa = locale.startsWith('fa');

  return SEEDS.map((seed, index) => {
    const day = resolved.toDate(resolved.addDays(firstOfMonth, seed.dayOffset));
    const start = new Date(day);
    const title = fa ? seed.titleFa : seed.title;

    if (seed.allDay) {
      const end = new Date(day);
      end.setDate(end.getDate() + (seed.spanDays ?? 1));
      return { id: `sample-${index}`, title, start, end, allDay: true, variant: seed.variant };
    }

    start.setHours(seed.startHour, 0, 0, 0);
    const end = new Date(start.getTime() + seed.durationMinutes * 60_000);
    return {
      id: `sample-${index}`,
      title,
      start,
      end,
      variant: seed.variant,
      meta: { room: seed.room },
    };
  });
}
