import { Playground } from '@rooz/demo';
import { Code } from '../components/code';
import { Section } from '../components/layout';

const SNIPPET = `import { Calendar } from '@rooz/calendar-ui';

<Calendar
  events={sessions}
  calendarSystem={system}     // 'gregorian' | 'jalali'
  locale={locale}             // 'en' | 'fa' — drives RTL
  numerals={numerals}         // 'latn' | 'arabext'
  startHour={7}
  endHour={20}
  onEventClick={(event, occurrence) => select(event)}
  onDateSelect={(date, cell) => console.log(cell.key)}
/>`;

export function DemoPage() {
  return (
    <>
      <Section
        className="pt-12"
        title="Live demo"
        lead="The real library, imported from its package entry point exactly as a consumer would. Switch the calendar system, the locale and the digit shaping, and move between all four views."
      >
        <Playground />
      </Section>

      <Section title="What the demo is doing">
        <Code>{SNIPPET}</Code>
        <ul className="mt-5 space-y-2 text-sm leading-relaxed text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">Calendar system</span> swaps the entire grid engine. Month
            lengths, week start and month boundaries are recomputed in the new system.
          </li>
          <li>
            <span className="font-medium text-foreground">Locale</span> sets direction, month and weekday names, and the
            default numerals. Setting Jalali with <code className="font-mono text-xs">locale="en"</code> gives Latin
            month names and digits over a Jalali grid.
          </li>
          <li>
            <span className="font-medium text-foreground">Digits</span> is independent of locale on purpose — some
            consumers want Jalali dates rendered with Latin digits.
          </li>
          <li>
            <span className="font-medium text-foreground">Events</span> never change shape. The same array of ISO
            instants drives both systems.
          </li>
        </ul>
      </Section>
    </>
  );
}
