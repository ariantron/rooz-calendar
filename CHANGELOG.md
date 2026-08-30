# Changelog

Both packages are versioned together and follow [Semantic Versioning](https://semver.org/).

## [0.2.0] — 2026-08-30

### `@rooz-calendar/ui`

- `MonthView`'s "+N more" overflow row now opens a dialog listing that day's
  events in full, rather than falling through to `onDateSelect`. Rows are
  `EventBlock`s in the `row` layout — the same component the agenda list uses —
  so time formatting, RTL and Jalali digit shaping stay consistent, and
  selecting one calls the same `onEventClick` as clicking a chip in the grid.
  The overflow threshold itself is unchanged.
- Added a shadcn-styled `Dialog` primitive (`Dialog`, `DialogTrigger`,
  `DialogContent`, …), exported for consumers. This adds
  `@radix-ui/react-dialog` as a dependency.
- Passing `onShowMore` keeps the previous behaviour: the overflow row calls it
  and no dialog opens, for consumers who present their own panel.

## [0.1.1] — 2026-08-30

### `@rooz-calendar/ui`

- Fixed: event text sat against the top of its box instead of the middle in the
  `chip` layout (month cells) and in `dense` blocks. Both have a height fixed by
  their container, so the inherited `items-baseline` pinned the text to the
  baseline of the flex line rather than centring it. `row` keeps baseline
  alignment, where it is correct — that layout is sized by its own content.

## [0.1.0] — 2026-08-27

First release.

### `@rooz-calendar/core`

- `CalendarSystem` interface with Gregorian and Jalali implementations, and
  `registerCalendarSystem` as the extension point for further systems.
- Month, week, day and agenda grid builders that compute layout natively in the active system.
- Token formatter using each system's own month and weekday names, with Latin, Persian and
  Arabic-Indic digit shaping.
- Event resolution, multi-day bucketing and time-grid overlap layout.
- Period helpers: `buildPeriodTitle`, `getPeriodRange`, `stepPeriod`.

### `@rooz-calendar/ui`

- `CalendarGrid`, `CalendarHeader` and `EventBlock` primitives.
- `MonthView`, `WeekView`, `DayView`, `AgendaView`, and the `Calendar` composite.
- Full RTL support and shadcn-compatible theme tokens.
- Two style delivery routes: a self-contained `styles.css` with no Preflight, and a
  `tokens.css` for Tailwind consumers.

[0.2.0]: https://github.com/ariantron/rooz-calendar/releases/tag/v0.2.0
[0.1.1]: https://github.com/ariantron/rooz-calendar/releases/tag/v0.1.1
[0.1.0]: https://github.com/ariantron/rooz-calendar/releases/tag/v0.1.0
