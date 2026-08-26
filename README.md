# Rooz Calendar

A React scheduling and calendar library that treats the **Jalali (Shamsi) calendar as a
first-class date system** — not a Gregorian grid with Persian labels pasted over it.

```
packages/calendar-core   calendar-system-agnostic date engine + grid generation
packages/calendar-ui     shadcn-styled React components, built on calendar-core
apps/demo                interactive playground
apps/docs                landing page, live demo and generated API reference
```

- **Native grids.** Which day falls in which week, where a month begins and ends, and which
  day the week starts on are all computed in whichever calendar system is active.
- **shadcn conventions.** Tailwind utilities, CVA variants, a `cn()` helper, Radix where the
  interaction calls for it, and theme tokens that inherit from your existing shadcn setup.
- **Real RTL.** Direction follows the locale: mirrored columns, flipped navigation, logical
  spacing, and Persian digits — or Latin digits, if you prefer them.
- **Small, predictable API.** Every view takes the same props.

---

## Why this exists

Most calendar libraries compute a Gregorian grid and translate the labels. That produces a
calendar that is subtly wrong in Persian: months are the wrong length, the week starts on the
wrong day, and the year boundary lands in the wrong place.

Rooz asks the *active* calendar system for everything:

|                      | Gregorian, August 2026 | Jalali, Shahrivar 1405 |
| -------------------- | ---------------------- | ---------------------- |
| Days in the month    | 31                     | 31                     |
| Week starts on       | Sunday                 | **Saturday**           |
| Weekend              | Sat + Sun              | **Friday**             |
| First day is         | 2026-08-01             | **2026-08-23**         |
| Leap rule            | 4/100/400              | 33-year cycle          |

Farvardin 1405 is a real Jalali month — 31 days, laid out from its own Saturday-first week,
with the tail of a *leap* Esfand 1404 leading it in. That comes out of the grid builder, not
out of a translation table.

---

## Install

```bash
npm install @rooz/calendar-ui @rooz/calendar-core
```

`@rooz/calendar-core` is a peer dependency of the UI package, so there is exactly one copy of
the date engine (and one calendar-system registry) in your app. `react` and `react-dom` are
peers too — React 18 and 19 are both supported.

Need only the date math? Install `@rooz/calendar-core` on its own; it has no React dependency.

## Quickstart

```tsx
import { MonthView } from '@rooz/calendar-ui';
import '@rooz/calendar-ui/styles.css';

const sessions = [
  { id: 's1', title: 'Linear Algebra', start: '2026-08-26T09:00:00', end: '2026-08-26T10:30:00' },
  { id: 's2', title: 'Physics Lab',    start: '2026-08-27T08:00:00', end: '2026-08-27T10:00:00' },
  { id: 's3', title: 'Field trip',     start: '2026-08-28', end: '2026-08-31', allDay: true, variant: 'success' },
];

export function Timetable() {
  return (
    <MonthView
      events={sessions}
      calendarSystem="jalali"   // or "gregorian"
      locale="fa"               // drives RTL and Persian digits
      onEventClick={(event) => console.log(event.id)}
      onDateSelect={(date, cell) => console.log(cell.key)} // cell.key is an ISO day
    />
  );
}
```

Events go in as native `Date`s or ISO strings and come back the same way. **A consumer never
has to know which calendar system is on screen** — switching systems does not touch your data.

For a header, navigation and a view switcher, use the `Calendar` composite:

```tsx
import { Calendar } from '@rooz/calendar-ui';

<Calendar events={sessions} calendarSystem="jalali" locale="fa" defaultView="week" />;
```

## Styles

Three supported setups, depending on what your project already uses.

**1. No Tailwind.** Import the prebuilt stylesheet. It ships every utility the components use
and **contains no Preflight**, so it will not reset your application's styles.

```ts
import '@rooz/calendar-ui/styles.css';
```

**2. Tailwind + shadcn.** Point Tailwind at the package instead, and the calendar inherits your
theme — your `--background`, `--primary` and `--radius` tokens are used directly.

```css
@source "../node_modules/@rooz/calendar-ui/dist";
```

**3. Tailwind without shadcn tokens.** Add the token map as well.

```css
@import "@rooz/calendar-ui/tokens.css";
@source "../node_modules/@rooz/calendar-ui/dist";
```

Every colour resolves through a fallback chain — *your token, then the library's default* — so
nothing is overwritten and nothing is missing. Dark mode follows a `.dark` class, and the
standalone stylesheet also honours `prefers-color-scheme`.

---

## The calendar-system abstraction

This is the part to understand before contributing. Every calendar system implements one
interface, and everything else in the library is written against it.

```ts
interface CalendarSystem {
  id: string;
  monthsInYear: number;
  defaultWeekStartsOn: WeekdayIndex;   // Jalali: 6 (Saturday)
  defaultWeekends: readonly WeekdayIndex[];

  toDayNumber(date: CalendarDate): number;      // → days since 1970-01-01
  fromDayNumber(dayNumber: number): CalendarDate;
  daysInMonth(year: number, month: number): number;
  isLeapYear(year: number): boolean;

  // …plus formatting, weekday and arithmetic methods, all derived from the above
}
```

**The day number is the spine.** Every system converts to and from one shared linear axis:
integer days since 1970-01-01. Two consequences fall out of that:

- **Grid generation is written once.** `buildMonthGrid` asks the system for the first day of
  the month, its length and its weekday, then walks the day-number axis. The same code lays
  out Gregorian and Jalali, and would lay out Hijri.
- **Nothing depends on the host timezone.** The axis is pure integer arithmetic, and the Jalali
  implementation drives `jalali-moment` through its *string* APIs only. No `Date` is ever
  handed to or taken from the conversion layer, so the same Jalali date maps to the same day
  in Tehran, Auckland and UTC. DST cannot shift a grid cell.

### Adding a calendar system (this is how Hijri arrives)

`BaseCalendarSystem` derives everything it can from four primitives. A new system supplies
those, plus a table of month and weekday names, and registers itself:

```ts
import { BaseCalendarSystem, registerCalendarSystem } from '@rooz/calendar-core';

class HijriCalendarSystem extends BaseCalendarSystem {
  readonly id = 'hijri';
  readonly monthsInYear = 12;
  readonly defaultWeekStartsOn = 6;
  readonly defaultWeekends = [5];
  readonly minYear = 1;
  readonly maxYear = 2000;
  protected readonly localeTable = HIJRI_LOCALES;

  toDayNumber(date) { /* … */ }
  fromDayNumber(dayNumber) { /* … */ }
  daysInMonth(year, month) { /* … */ }
  isLeapYear(year) { /* … */ }
}

registerCalendarSystem(new HijriCalendarSystem());
```

Week alignment, month arithmetic, day clamping, formatting and all four views then work
unchanged — `calendarSystem="hijri"` is the only call-site change. The test suite exercises
this path with a deliberately alien 13-month system, so the claim stays honest.

## Using the date engine on its own

```ts
import { buildMonthGrid, jalali, stepPeriod } from '@rooz/calendar-core';

jalali.fromDate(new Date(2026, 7, 26));            // { year: 1405, month: 6, day: 4 }
jalali.format(new Date(), 'EEEE d MMMM yyyy', { locale: 'fa' });  // چهارشنبه ۴ شهریور ۱۴۰۵
jalali.daysInMonth(1403, 12);                      // 30 — 1403 is a leap year

const grid = buildMonthGrid(1405, 1, { system: 'jalali' });
grid.title;                                        // 'فروردین ۱۴۰۵'
grid.weeks[0].days[0].calendarDate;                // { year: 1405, month: 1, day: 1 }

stepPeriod('month', new Date(), 1, { system: 'jalali' });  // next *Jalali* month
```

---

## Roadmap / not yet supported

v1 is deliberately narrow. These are **not** implemented, and are not stubbed out either:

| Not in v1                      | Notes                                                                  |
| ------------------------------ | ---------------------------------------------------------------------- |
| Recurrence rules (RRULE)       | Expand recurrences in your own code and pass the occurrences as events. |
| Drag to move / resize events   | Views are read-only; `onEventClick` and `onDateSelect` are the hooks.   |
| Resource / timeline views      | No per-instructor or per-room row layout.                               |
| Cross-timezone events          | Everything is interpreted in the host's local timezone.                 |
| Hijri calendar                 | The abstraction is ready for it (above); the implementation is not written. |

### Known trade-offs

- **Bundle size.** `jalali-moment` carries Moment with it, which dominates the download for a
  browser consumer. The conversion layer is one file behind the `CalendarSystem` interface, so
  swapping it for an algorithmic implementation is a contained change — planned, not done.
- **Overlap layout.** Overlapping events in week and day views split into equal columns. There
  is no side-by-side "shrink and offset" packing yet.

## Development

```bash
pnpm install
pnpm test            # calendar-core unit tests
pnpm build           # build both packages
pnpm dev:demo        # playground at localhost:5173
pnpm dev:docs        # documentation site
pnpm smoke           # pack, install into a throwaway app, build and render it
```

`pnpm smoke` is the gate before any release: a green monorepo build is not evidence that the
*published* artifact works. It checks the `files` allowlist, the `exports` map, peer-dependency
declarations, the generated `.d.ts`, and that the shipped stylesheet renders correctly in an
app with no Tailwind at all.

See [`docs/RELEASING.md`](docs/RELEASING.md) for the release checklist and versioning policy.

## Licence

MIT. Jalali ↔ Gregorian conversion by [jalali-moment](https://github.com/fingerpich/jalali-moment).
