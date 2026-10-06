import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

/*
 * Visual regression (TDD §14.6): screenshots of every screen in both themes and languages,
 * on desktop and phone. A changed pixel fails the test; intended changes update the
 * baseline in the same PR:  pnpm test:visual --update-snapshots
 *
 * Baselines are Linux + Chromium 141 (Playwright 1.56.1), the same as CI.
 */

const COMBOS = [
  { theme: 'light', locale: 'ka' },
  { theme: 'dark', locale: 'en' },
] as const;

const GUEST_PAGES = [
  { name: 'today', path: '/' },
  { name: 'missions', path: '/missions' },
  { name: 'profile-guest', path: '/profile' },
  { name: 'login', path: '/login' },
  { name: 'register', path: '/register' },
  { name: 'not-found', path: '/missing' },
];

async function prepare(page: Page, theme: string, locale: string) {
  // Tuesday 6 October 2026, 09:00 — fixed date and greeting.
  await page.clock.setFixedTime(new Date('2026-10-06T09:00:00'));
  await page.addInitScript(
    ([t, l]) => {
      localStorage.setItem('progress-theme', t!);
      localStorage.setItem('progress-locale', l!);
    },
    [theme, locale],
  );
}

async function snapshot(page: Page, name: string) {
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });
}

for (const { theme, locale } of COMBOS) {
  for (const { name, path } of GUEST_PAGES) {
    test(`@visual ${name} — ${theme}, ${locale}`, async ({ page }) => {
      await prepare(page, theme, locale);
      await page.goto(path);
      await snapshot(page, `${name}-${theme}-${locale}`);
    });
  }

  test(`@visual register with errors — ${theme}, ${locale}`, async ({ page }) => {
    await prepare(page, theme, locale);
    await page.goto('/register');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('[aria-invalid="true"]').first()).toBeVisible();
    await snapshot(page, `register-errors-${theme}-${locale}`);
  });

  test(`@visual profile signed in — ${theme}, ${locale}`, async ({ page }) => {
    await prepare(page, theme, locale);
    const email = `visual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
    await page.goto('/register');
    await page.locator('input[autocomplete="given-name"]').fill('Giorgi');
    await page.locator('input[autocomplete="family-name"]').fill('Dolidze');
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[autocomplete="new-password"]').fill('secret123');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL('/');
    await page.goto('/profile');
    await expect(page.locator('#details')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot(`profile-signed-in-${theme}-${locale}.png`, {
      fullPage: true,
      // Differ per run: the email (text and read-only field) and the sign-up date.
      mask: [page.getByText(email), page.locator('input[type="email"]'), page.getByText(/20\d\d/)],
    });
  });
}
