# Changelog

Both packages are versioned together and follow [Semantic Versioning](https://semver.org/).

## [0.1.0] — unreleased

First release.

### `@rooz/calendar-core`

- `CalendarSystem` interface with Gregorian and Jalali implementations, and
  `registerCalendarSystem` as the extension point for further systems.
- Month, week, day and agenda grid builders that compute layout natively in the active system.
- Token formatter using each system's own month and weekday names, with Latin, Persian and
  Arabic-Indic digit shaping.
- Event resolution, multi-day bucketing and time-grid overlap layout.
- Period helpers: `buildPeriodTitle`, `getPeriodRange`, `stepPeriod`.

### `@rooz/calendar-ui`

- `CalendarGrid`, `CalendarHeader` and `EventBlock` primitives.
- `MonthView`, `WeekView`, `DayView`, `AgendaView`, and the `Calendar` composite.
- Full RTL support and shadcn-compatible theme tokens.
- Two style delivery routes: a self-contained `styles.css` with no Preflight, and a
  `tokens.css` for Tailwind consumers.

[0.1.0]: https://github.com/your-org/rooz-calendar/releases/tag/v0.1.0
