import { describe, expect, it } from 'vitest';
import { isTimeZone, resolveTheme } from './preferences';

describe('resolveTheme', () => {
  it('returns the chosen theme when it is not SYSTEM', () => {
    expect(resolveTheme('LIGHT', true)).toBe('light');
    expect(resolveTheme('DARK', false)).toBe('dark');
  });

  it('follows the OS for SYSTEM', () => {
    expect(resolveTheme('SYSTEM', true)).toBe('dark');
    expect(resolveTheme('SYSTEM', false)).toBe('light');
  });
});

describe('isTimeZone', () => {
  it('accepts IANA zones and rejects anything else', () => {
    expect(isTimeZone('Asia/Tbilisi')).toBe(true);
    expect(isTimeZone('UTC')).toBe(true);
    expect(isTimeZone('Mars/Olympus')).toBe(false);
    expect(isTimeZone('')).toBe(false);
  });
});
