import { cleanup, render, screen } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { DayView, WeekView } from './time-view';

afterEach(cleanup);

const DATE = new Date('2026-08-12T12:00:00Z');

/** The `HH:mm` of every slot row, in grid order, for a single-day view. */
function slotTimes(): string[] {
  return screen
    .getAllByRole('gridcell')
    .map((cell) => cell.getAttribute('aria-label') ?? '')
    .map((label) => label.slice(-5));
}

describe('time views: hour window', () => {
  it('covers a whole day by default', () => {
    render(<DayView date={DATE} today={DATE} events={[]} />);

    const times = slotTimes();
    // Midnight through 23:00 inclusive, one row per hour.
    expect(times).toHaveLength(24);
    expect(times[0]).toBe('00:00');
    expect(times[times.length - 1]).toBe('23:00');
  });

  it('covers a whole day by default in the week view too', () => {
    render(<WeekView date={DATE} today={DATE} events={[]} />);

    // Seven days of 24 rows.
    expect(screen.getAllByRole('gridcell')).toHaveLength(7 * 24);
  });

  it('narrows to an explicit window', () => {
    render(<DayView date={DATE} today={DATE} events={[]} startHour={8} endHour={20} />);

    const times = slotTimes();
    expect(times).toHaveLength(12);
    expect(times[0]).toBe('08:00');
    // endHour is exclusive, so 20:00 is the boundary, not a row.
    expect(times[times.length - 1]).toBe('19:00');
  });

  it('accepts endHour 24 as midnight closing the day', () => {
    render(<DayView date={DATE} today={DATE} events={[]} startHour={22} endHour={24} />);

    expect(slotTimes()).toEqual(['22:00', '23:00']);
  });

  it('rejects hours that are not whole hours on the 24-hour clock', () => {
    const cases: Array<[string, React.ComponentProps<typeof DayView>]> = [
      ['fractional start', { startHour: 8.5 }],
      ['negative start', { startHour: -1 }],
      ['start past the clock', { startHour: 24 }],
      ['end past midnight', { endHour: 25 }],
      ['end before start', { startHour: 10, endHour: 9 }],
      ['empty window', { startHour: 10, endHour: 10 }],
    ];

    for (const [name, props] of cases) {
      expect(() => render(<DayView date={DATE} today={DATE} events={[]} {...props} />), name).toThrow(RangeError);
      cleanup();
    }
  });
});
