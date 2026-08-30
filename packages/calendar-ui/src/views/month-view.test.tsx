import type { CalendarEvent } from '@rooz-calendar/core';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MonthView } from './month-view';

afterEach(cleanup);

// A fixed "today" keeps the rendered month deterministic — the grid is built
// from `date`, and the assertions below name a specific day.
const TODAY = new Date('2026-08-15T12:00:00Z');

/** Five events on 2026-08-12, deliberately more than maxEventsPerDay. */
const DAY_EVENTS: CalendarEvent[] = [
  { id: 'e1', title: 'Linear Algebra', start: '2026-08-12T09:00:00', end: '2026-08-12T10:00:00' },
  { id: 'e2', title: 'Office hours', start: '2026-08-12T11:00:00', end: '2026-08-12T12:00:00' },
  { id: 'e3', title: 'Faculty standup', start: '2026-08-12T13:00:00', end: '2026-08-12T13:30:00' },
  { id: 'e4', title: 'Thesis defence', start: '2026-08-12T15:00:00', end: '2026-08-12T16:00:00' },
  { id: 'e5', title: 'Guest seminar', start: '2026-08-12T17:00:00', end: '2026-08-12T18:00:00' },
];

function renderMonth(props: Partial<React.ComponentProps<typeof MonthView>> = {}) {
  return render(<MonthView date={TODAY} today={TODAY} events={DAY_EVENTS} maxEventsPerDay={3} {...props} />);
}

/** Read one recorded call, failing loudly rather than yielding `undefined`. */
function callAt<T extends unknown[]>(mock: { mock: { calls: T[] } }, index: number): T {
  const call = mock.mock.calls[index];
  if (!call) throw new Error(`expected at least ${index + 1} call(s), got ${mock.mock.calls.length}`);
  return call;
}

/** The dialog's own list, so cell chips are never mistaken for dialog rows. */
function dialogEventTitles(): string[] {
  const dialog = screen.getByRole('dialog');
  return within(dialog)
    .getAllByRole('button')
    .map((button) => button.textContent ?? '')
    .filter((text) => DAY_EVENTS.some((event) => text.includes(event.title)))
    .map((text) => DAY_EVENTS.find((event) => text.includes(event.title))!.title);
}

describe('MonthView overflow dialog', () => {
  it('collapses the overflow into a focusable button, not a bare div', () => {
    renderMonth();

    const trigger = screen.getByRole('button', { name: '+2 more' });
    expect(trigger.tagName).toBe('BUTTON');
    // Reachable by keyboard: a real button is focusable without a tabindex.
    trigger.focus();
    expect(document.activeElement).toBe(trigger);
  });

  it('opens a dialog listing the full day, not just the hidden events', async () => {
    const user = userEvent.setup();
    renderMonth();

    expect(screen.queryByRole('dialog')).toBeNull();
    await user.click(screen.getByRole('button', { name: '+2 more' }));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeTruthy();

    // All five, in the order the cell renders them — not only the two hidden.
    expect(dialogEventTitles()).toEqual([
      'Linear Algebra',
      'Office hours',
      'Faculty standup',
      'Thesis defence',
      'Guest seminar',
    ]);
  });

  it('invokes onEventClick with the right event when a dialog row is clicked', async () => {
    const user = userEvent.setup();
    const onEventClick = vi.fn();
    const onDateSelect = vi.fn();
    renderMonth({ onEventClick, onDateSelect });

    await user.click(screen.getByRole('button', { name: '+2 more' }));

    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /Thesis defence/ }));

    expect(onEventClick).toHaveBeenCalledTimes(1);
    const [source, occurrence] = callAt(onEventClick, 0);
    expect(source.id).toBe('e4');
    expect(occurrence.title).toBe('Thesis defence');

    // React portals bubble through the React tree, not the DOM one, so without
    // a guard this click would also reach the day cell underneath.
    expect(onDateSelect).not.toHaveBeenCalled();
  });

  it('routes dialog clicks through the same callback as clicking a chip in the cell', async () => {
    const user = userEvent.setup();
    const onEventClick = vi.fn();
    renderMonth({ onEventClick });

    // A chip rendered directly in the cell.
    await user.click(screen.getByRole('button', { name: /Linear Algebra/ }));
    const fromCell = callAt(onEventClick, 0);

    await user.click(screen.getByRole('button', { name: '+2 more' }));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /Linear Algebra/ }));
    const fromDialog = callAt(onEventClick, 1);

    expect(onEventClick).toHaveBeenCalledTimes(2);
    expect(fromDialog[0]).toBe(fromCell[0]);
    expect(fromDialog[1].id).toBe(fromCell[1].id);
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    renderMonth();

    await user.click(screen.getByRole('button', { name: '+2 more' }));
    expect(screen.getByRole('dialog')).toBeTruthy();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opening the overflow does not select the day underneath', async () => {
    const user = userEvent.setup();
    const onDateSelect = vi.fn();
    renderMonth({ onDateSelect });

    await user.click(screen.getByRole('button', { name: '+2 more' }));

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(onDateSelect).not.toHaveBeenCalled();
  });

  it('renders the day heading in the active calendar system and numerals', async () => {
    const user = userEvent.setup();
    renderMonth({ calendarSystem: 'jalali', locale: 'fa' });

    // The overflow label is localised too, so find it by its Persian text.
    await user.click(screen.getByRole('button', { name: /مورد دیگر/ }));

    const dialog = screen.getByRole('dialog');
    const heading = within(dialog).getByRole('heading');
    // Jalali month name and Persian digits — never a Gregorian relabelling.
    expect(heading.textContent).toMatch(/مرداد/);
    expect(heading.textContent).toMatch(/[۰-۹]/);
    expect(dialog.getAttribute('dir')).toBe('rtl');
  });

  it('hands over to onShowMore instead of opening the dialog when one is supplied', async () => {
    const user = userEvent.setup();
    const onShowMore = vi.fn();
    renderMonth({ onShowMore });

    await user.click(screen.getByRole('button', { name: '+2 more' }));

    expect(onShowMore).toHaveBeenCalledTimes(1);
    expect(callAt(onShowMore, 0)[1]).toHaveLength(5);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('leaves the overflow threshold alone', () => {
    // Four events with maxEventsPerDay=4 fit, so no overflow row appears.
    renderMonth({ events: DAY_EVENTS.slice(0, 4), maxEventsPerDay: 4 });
    expect(screen.queryByRole('button', { name: /more/ })).toBeNull();

    cleanup();

    renderMonth({ events: DAY_EVENTS.slice(0, 4), maxEventsPerDay: 2 });
    expect(screen.getByRole('button', { name: '+2 more' })).toBeTruthy();
  });
});
