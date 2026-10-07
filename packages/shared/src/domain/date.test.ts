import { describe, expect, it } from 'vitest';
import { addDays, daysBetween, isISODate, isoWeekday, todayInTimeZone } from './date';

describe('isISODate', () => {
  it('accepts real calendar dates', () => {
    expect(isISODate('2026-10-06')).toBe(true);
    expect(isISODate('2024-02-29')).toBe(true);
  });

  it('rejects malformed or impossible dates', () => {
    expect(isISODate('2026-1-6')).toBe(false);
    expect(isISODate('2026-02-30')).toBe(false);
    expect(isISODate('2025-02-29')).toBe(false);
    expect(isISODate('2026-13-01')).toBe(false);
    expect(isISODate('not a date')).toBe(false);
  });
});

describe('addDays', () => {
  it('moves forward and backward across months and years', () => {
    expect(addDays('2026-10-06', 1)).toBe('2026-10-07');
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29');
  });

  it('throws on a malformed date instead of guessing', () => {
    expect(() => addDays('06/10/2026', 1)).toThrow(RangeError);
  });

  it('never skips or repeats a day around DST changes', () => {
    // Europe DST ends 2026-10-25, US DST starts 2026-03-08.
    expect(addDays('2026-10-24', 1)).toBe('2026-10-25');
    expect(addDays('2026-10-25', 1)).toBe('2026-10-26');
    expect(addDays('2026-03-07', 1)).toBe('2026-03-08');
    expect(addDays('2026-03-08', 1)).toBe('2026-03-09');
  });
});

describe('daysBetween', () => {
  it('counts whole days from a to b', () => {
    expect(daysBetween('2026-10-01', '2026-10-06')).toBe(5);
    expect(daysBetween('2026-10-06', '2026-10-01')).toBe(-5);
    expect(daysBetween('2026-10-06', '2026-10-06')).toBe(0);
  });
});

describe('isoWeekday', () => {
  it('returns 1 for Monday and 7 for Sunday', () => {
    expect(isoWeekday('2026-10-05')).toBe(1);
    expect(isoWeekday('2026-10-06')).toBe(2);
    expect(isoWeekday('2026-10-11')).toBe(7);
  });
});

describe('todayInTimeZone', () => {
  it('uses the user time zone, not UTC', () => {
    const instant = new Date('2026-10-06T22:30:00Z');
    expect(todayInTimeZone(instant, 'Asia/Tbilisi')).toBe('2026-10-07');
    expect(todayInTimeZone(instant, 'America/Los_Angeles')).toBe('2026-10-06');
    expect(todayInTimeZone(instant, 'UTC')).toBe('2026-10-06');
  });

  it('gives different days for Auckland and Los Angeles at the same instant', () => {
    const instant = new Date('2026-10-06T12:00:00Z');
    expect(todayInTimeZone(instant, 'Pacific/Auckland')).toBe('2026-10-07');
    expect(todayInTimeZone(instant, 'America/Los_Angeles')).toBe('2026-10-06');
  });
});
