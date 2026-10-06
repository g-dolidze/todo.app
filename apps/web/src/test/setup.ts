import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { installFakeApi } from './fakeApi';
import i18n from '../i18n';

// jsdom has no <dialog> modal support; real behaviour is covered by Playwright.
HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
  this.setAttribute('open', '');
};
HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
  this.removeAttribute('open');
};

let systemDark = false;

/** Lets a test pretend the OS is in dark mode and fire the change event. */
export function setSystemDark(dark: boolean) {
  systemDark = dark;
  listeners.forEach((listener) => listener({ matches: dark } as MediaQueryListEvent));
}

const listeners = new Set<(event: MediaQueryListEvent) => void>();

const matchMediaStub = (query: string) => ({
  get matches() {
    return query.includes('dark') ? systemDark : false;
  },
  media: query,
  addEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) =>
    listeners.add(listener),
  removeEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) =>
    listeners.delete(listener),
});
vi.stubGlobal('matchMedia', matchMediaStub);

beforeEach(async () => {
  localStorage.clear();
  systemDark = false;
  delete document.documentElement.dataset.theme;
  await i18n.changeLanguage('ka');
  localStorage.clear();
  // Every test starts as a guest against an empty fake API; tests can add users.
  installFakeApi();
});

afterEach(() => {
  cleanup();
  listeners.clear();
  vi.unstubAllGlobals();
  vi.stubGlobal('matchMedia', matchMediaStub);
});
