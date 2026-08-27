# @rooz/calendar-ui

shadcn-styled React calendar and scheduling views with native Jalali (Shamsi) and RTL support,
built on [`@rooz/calendar-core`](https://www.npmjs.com/package/@rooz/calendar-core).

```bash
npm install @rooz/calendar-ui @rooz/calendar-core
```

```tsx
import { MonthView } from '@rooz/calendar-ui';
import '@rooz/calendar-ui/styles.css';

<MonthView
  events={sessions}
  calendarSystem="jalali"   // or "gregorian"
  locale="fa"               // drives RTL and Persian digits
  onEventClick={(event) => console.log(event.id)}
  onDateSelect={(date, cell) => console.log(cell.key)}
/>;
```

## Exports

| Component        | What it is                                                             |
| ---------------- | ---------------------------------------------------------------------- |
| `MonthView`      | A month grid, laid out natively in the active calendar system.          |
| `WeekView`       | Seven days with hour slots, aligned to the system's own week start.     |
| `DayView`        | A single day with hour slots.                                           |
| `AgendaView`     | A chronological list of days and their events.                          |
| `Calendar`       | Header + view + navigation, wired together.                             |
| `CalendarGrid`   | The grid renderer. No scheduling logic; content comes from render props.|
| `CalendarHeader` | Title, period navigation and a view switcher. Mirrors under RTL.        |
| `EventBlock`     | One event as a chip, a time-grid block, or an agenda row.               |

Every view takes the same props: `events`, `calendarSystem`, `locale`, `numerals`,
`weekStartsOn`, `onEventClick`, `onDateSelect`.

## Styles

**No Tailwind?** `import '@rooz/calendar-ui/styles.css'` — self-contained and free of
Preflight, so it will not reset your application's styles.

**Tailwind + shadcn?** Add `@source "../node_modules/@rooz/calendar-ui/dist";` to your CSS and
the calendar inherits your theme tokens.

**Tailwind without shadcn tokens?** Add `@import "@rooz/calendar-ui/tokens.css";` as well.

## Peer dependencies

`react` (18 or 19), `react-dom`, and `@rooz/calendar-core`. The core package is a peer so your
app holds exactly one date engine and one calendar-system registry.

Full documentation and a live demo: <https://github.com/ariantron/rooz-calendar#readme>

MIT licensed.
