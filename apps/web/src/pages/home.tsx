import { MonthView } from '@rooz/calendar-ui';
import { useMemo } from 'react';
import { Link } from 'react-router';
import { buildSampleEvents } from '../demo/sample-events';
import { Code } from '../components/code';
import { Badge, Card, Section } from '../components/layout';

const INSTALL = 'npm install @rooz/calendar-ui @rooz/calendar-core';

const QUICKSTART = `import { MonthView } from '@rooz/calendar-ui';
import '@rooz/calendar-ui/styles.css';

const sessions = [
  { id: 's1', title: 'Linear Algebra', start: '2026-08-26T09:00:00', end: '2026-08-26T10:30:00' },
  { id: 's2', title: 'Physics Lab',    start: '2026-08-27T08:00:00', end: '2026-08-27T10:00:00' },
];

export function Timetable() {
  return (
    <MonthView
      events={sessions}
      calendarSystem="jalali"   // or "gregorian"
      locale="fa"               // drives RTL and Persian digits
      onEventClick={(event) => console.log(event.id)}
      onDateSelect={(date, cell) => console.log(cell.key)}
    />
  );
}`;

const WHY = [
  {
    title: 'The grid is computed in the active system',
    body: 'Farvardin 1405 is a real Jalali month: 31 days, laid out from its own Saturday-first week, with the tail of a leap Esfand 1404 leading it in. Nothing is computed in Gregorian and relabeled.',
  },
  {
    title: 'Events stay calendar-agnostic',
    body: 'Pass native Dates or ISO strings. Callbacks hand back an ISO day key. A consumer never has to know which system is on screen — switching systems does not touch their data.',
  },
  {
    title: 'One interface, more calendars later',
    body: 'Every system implements the same CalendarSystem interface. Adding Hijri means implementing four primitives and registering them — no grid builder or component changes.',
  },
  {
    title: 'RTL that actually mirrors',
    body: 'Direction follows the locale: columns read right to left, navigation chevrons flip, spacing uses logical properties, and digits shape to ۰۱۲۳ — or stay Latin, if you prefer.',
  },
];

export function HomePage() {
  // A pinned date keeps the two preview grids stable and comparable.
  const reference = useMemo(() => new Date(2026, 7, 26), []);
  const gregorianEvents = useMemo(() => buildSampleEvents(reference, 'gregorian', 'en').slice(0, 10), [reference]);
  const jalaliEvents = useMemo(() => buildSampleEvents(reference, 'jalali', 'fa').slice(0, 10), [reference]);

  return (
    <>
      <Section className="pt-12 sm:pt-16">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="accent">v0.1.0</Badge>
          <Badge tone="muted">MIT</Badge>
          <Badge tone="muted">React 18 · 19</Badge>
        </div>
        <h1 className="mt-5 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl sm:leading-[1.1]">
          A scheduling library that treats the Jalali calendar as a first-class date system.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Month, week, day and agenda views for React — shadcn-styled, Tailwind-native, and generated natively in
          whichever calendar system is active. Not a Gregorian grid with Persian labels pasted over it.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            to="/demo"
            className="inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try the live demo
          </Link>
          <Link
            to="/docs"
            className="inline-flex h-10 items-center rounded-md border border-input bg-background px-5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            API reference
          </Link>
        </div>

        <div className="mt-8 max-w-xl">
          <Code language="bash">{INSTALL}</Code>
        </div>
      </Section>

      <Section
        id="preview"
        title="The same month, two calendar systems"
        lead="Both grids below are live components rendering the same events. Only calendarSystem and locale differ — the day cells, month boundaries and week alignment are recomputed, not translated."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <figure className="min-w-0">
            <figcaption className="mb-2 flex items-baseline gap-2 text-sm">
              <span className="font-medium">Gregorian</span>
              <code className="font-mono text-xs text-muted-foreground">calendarSystem="gregorian" locale="en"</code>
            </figcaption>
            <MonthView
              date={reference}
              today={reference}
              events={gregorianEvents}
              calendarSystem="gregorian"
              locale="en"
              maxEventsPerDay={2}
              cellMinHeight="4.25rem"
              showEventTime={false}
              fixedWeeks
            />
          </figure>
          <figure className="min-w-0">
            <figcaption className="mb-2 flex items-baseline gap-2 text-sm">
              <span className="font-medium">Jalali</span>
              <code className="font-mono text-xs text-muted-foreground">calendarSystem="jalali" locale="fa"</code>
            </figcaption>
            <MonthView
              date={reference}
              today={reference}
              events={jalaliEvents}
              calendarSystem="jalali"
              locale="fa"
              maxEventsPerDay={2}
              cellMinHeight="4.25rem"
              showEventTime={false}
              fixedWeeks
            />
          </figure>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          August 2026 runs Sunday to Saturday and holds 31 days. Shahrivar 1405 runs Saturday to Friday, starts on
          23&nbsp;August, and also holds 31 — because that is how long Shahrivar is, not because August is.
        </p>
      </Section>

      <Section id="why" title="Why this exists">
        <div className="grid gap-4 sm:grid-cols-2">
          {WHY.map((item) => (
            <Card key={item.title}>
              <h3 className="text-sm font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section id="quickstart" title="Quickstart" lead="Drop a view in, hand it events, pick a calendar system.">
        <Code>{QUICKSTART}</Code>
        <p className="mt-4 text-sm text-muted-foreground">
          Already using Tailwind? Skip the stylesheet import and point Tailwind at the package instead, so the calendar
          inherits your theme. Both routes are covered in the{' '}
          <Link to="/docs" className="font-medium text-foreground underline underline-offset-4">
            API reference
          </Link>
          .
        </p>
      </Section>
    </>
  );
}
