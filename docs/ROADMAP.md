# Roadmap

v1 is deliberately narrow: a correct, native multi-calendar grid engine with four read-only
views. Everything below is explicitly **out of scope for v1** and is not stubbed out anywhere
in the codebase.

## Not yet supported

### Recurrence rules (RRULE)

Repeating events are not expanded by the library. Expand them in your own code and pass the
resulting occurrences as ordinary events — each with its own `id`.

Doing this properly means deciding how recurrence interacts with the active calendar system
("the 1st of every month" means something different in Jalali), which deserves its own design
pass rather than a Gregorian-shaped RRULE bolted on.

### Drag to move / drag to resize

Views are read-only. `onEventClick` and `onDateSelect` are the interaction hooks. Adding drag
means a pointer-interaction layer over the time grid plus optimistic-update semantics, neither
of which the current grid renderer is shaped for.

### Resource / timeline views

No per-instructor or per-room row layout. The grid builders are day-major; a resource view is
resource-major and needs its own builder.

### Cross-timezone events

Every instant is interpreted in the host's local timezone. The day-number axis is deliberately
timezone-independent, which is what makes the grids stable — but there is no support for
rendering an event in a timezone other than the viewer's.

### Hijri calendar

The abstraction is ready: `BaseCalendarSystem` derives everything from four primitives, and the
test suite proves a foreign 13-month system drops in with no changes to any grid builder or
component. The Hijri implementation itself is not written, and it carries a real question —
which Hijri variant (tabular, Umm al-Qura, sighting-based)? — that should be answered with a
consumer who needs it, not guessed at.

## Planned improvements

### Replace the conversion backend

`jalali-moment` brings Moment with it, which dominates the download size for browser consumers.
The conversion layer is a single file sitting behind the `CalendarSystem` interface, so
swapping it for an algorithmic Jalali implementation changes one file and no public API. The
existing test suite — Nowruz boundaries across 1395–1410, leap years, and an exhaustive
40-year day-by-day round trip — is the safety net that makes this change safe to attempt.

### Better overlap packing

Overlapping events in week and day views split into equal columns. Real calendars shrink and
offset overlapping blocks so a long event stays readable behind shorter ones.

### Keyboard navigation

Day cells are focusable and the header is fully keyboard-operable, but there is no
arrow-key roving focus across the month grid yet.
