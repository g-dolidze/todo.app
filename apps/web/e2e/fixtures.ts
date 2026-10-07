import { test as base, expect } from '@playwright/test';

/**
 * Every E2E test fails if the app logs a console error or the server answers 5xx (TDD §14.6).
 * Chrome also logs expected 4xx responses (wrong password, signed-out guest) as
 * "Failed to load resource"; those are normal app flows, not errors.
 */
export const test = base.extend<{ consoleErrors: string[] }>({
  consoleErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('console', (message) => {
        if (message.type() !== 'error') return;
        if (
          /Failed to load resource: the server responded with a status of 4\d\d/.test(
            message.text(),
          )
        ) {
          return;
        }
        errors.push(message.text());
      });
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('response', (response) => {
        if (response.status() >= 500) errors.push(`${response.status()} ${response.url()}`);
      });
      await use(errors);
      expect(errors, 'browser console errors').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
