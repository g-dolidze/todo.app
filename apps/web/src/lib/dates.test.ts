import { describe, expect, it } from 'vitest';
import { formatFullDate, formatLongDate, monthName, weekdayName } from './dates';

// 2026-10-06 is a Tuesday. Noon local time avoids any time-zone edge.
const date = new Date(2026, 9, 6, 12);

describe('formatLongDate', () => {
  it('formats Georgian without relying on browser locale data', () => {
    expect(formatLongDate(date, 'ka')).toBe('სამშაბათი, 6 ოქტომბერი');
  });

  it('formats English', () => {
    expect(formatLongDate(date, 'en')).toBe('Tuesday, October 6');
  });
});

describe('Georgian names', () => {
  it('has all 12 months', () => {
    expect(monthName(0, 'ka')).toBe('იანვარი');
    expect(monthName(11, 'ka')).toBe('დეკემბერი');
  });

  it('uses ISO weekdays (1 = Monday)', () => {
    expect(weekdayName(1, 'ka')).toBe('ორშაბათი');
    expect(weekdayName(7, 'ka')).toBe('კვირა');
    expect(weekdayName(1, 'ka', 'short')).toBe('ორშ');
    expect(weekdayName(1, 'en', 'short')).toBe('Mon');
    expect(weekdayName(7, 'en')).toBe('Sunday');
    expect(monthName(9, 'en')).toBe('October');
  });
});

describe('formatFullDate', () => {
  it('includes the year', () => {
    expect(formatFullDate(date, 'ka')).toBe('6 ოქტომბერი 2026');
    expect(formatFullDate(date, 'en')).toBe('October 6, 2026');
  });
});
