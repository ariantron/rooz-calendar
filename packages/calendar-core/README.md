# @rooz/calendar-core

The calendar-system-agnostic date engine and grid generator behind
[Rooz Calendar](https://github.com/ariantron/rooz-calendar). No React dependency — install this
alone if you need Jalali date math without calendar UI.

```bash
npm install @rooz/calendar-core
```

```ts
import { buildMonthGrid, jalali, gregorian, stepPeriod } from '@rooz/calendar-core';

jalali.fromDate(new Date(2026, 7, 26));   // { year: 1405, month: 6, day: 4 }
jalali.daysInMonth(1403, 12);             // 30 — 1403 is a leap year
jalali.format(new Date(), 'EEEE d MMMM yyyy', { locale: 'fa' });

const grid = buildMonthGrid(1405, 1, { system: 'jalali' });
grid.title;                               // 'فروردین ۱۴۰۵'
grid.weeks.length;                        // weeks, aligned to a Saturday-first week
grid.days.filter((day) => day.isCurrentMonth).length;  // 31
```

## What it gives you

- **`CalendarSystem`** — one interface implemented by `gregorian` and `jalali`, and the
  extension point for adding Hijri later without touching any consumer.
- **Grid builders** — `buildMonthGrid`, `buildWeekGrid`, `buildDayGrid`, `buildAgendaGrid`.
  Month lengths, week starts and month boundaries all come from the active system.
- **Formatting** — a token formatter using each system's own month and weekday names, with
  Farsi/Latin/Arabic digit shaping as an explicit option.
- **Event helpers** — resolution, per-day bucketing across multi-day spans, and time-grid
  overlap layout.

## Timezone safety

Every system converts to and from one shared axis: integer days since 1970-01-01. That axis is
pure arithmetic, and the Jalali implementation drives `jalali-moment` through its string APIs
only — no `Date` is ever handed to or taken from the conversion layer. The same Jalali date
therefore maps to the same day in every timezone, and no DST transition can shift a grid cell.

Full documentation, including how to add a calendar system:
<https://github.com/ariantron/rooz-calendar#readme>

MIT licensed.
