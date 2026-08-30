# Changelog

Both packages are versioned together and follow [Semantic Versioning](https://semver.org/).

## Unreleased

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

[0.1.0]: https://github.com/ariantron/rooz-calendar/releases/tag/v0.1.0
