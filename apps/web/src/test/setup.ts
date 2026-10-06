import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import i18n from '../i18n';

let systemDark = false;

/** Lets a test pretend the OS is in dark mode and fire the change event. */
export function setSystemDark(dark: boolean) {
  systemDark = dark;
  listeners.forEach((listener) => listener({ matches: dark } as MediaQueryListEvent));
}

const listeners = new Set<(event: MediaQueryListEvent) => void>();

vi.stubGlobal('matchMedia', (query: string) => ({
  get matches() {
    return query.includes('dark') ? systemDark : false;
  },
  media: query,
  addEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) =>
    listeners.add(listener),
  removeEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) =>
    listeners.delete(listener),
}));

beforeEach(async () => {
  localStorage.clear();
  systemDark = false;
  delete document.documentElement.dataset.theme;
  await i18n.changeLanguage('ka');
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  listeners.clear();
});
