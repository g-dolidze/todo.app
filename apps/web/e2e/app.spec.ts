import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

const PAGES = ['/', '/habits', '/missions', '/calendar', '/analytics', '/profile', '/missing'];

async function setPreferences(page: Page, theme: string, locale: string) {
  await page.addInitScript(
    ([t, l]) => {
      if (!sessionStorage.getItem('prefs-set')) {
        localStorage.setItem('progress-theme', t!);
        localStorage.setItem('progress-locale', l!);
        sessionStorage.setItem('prefs-set', '1');
      }
    },
    [theme, locale],
  );
}

for (const theme of ['light', 'dark']) {
  for (const locale of ['ka', 'en']) {
    test(`every page passes accessibility checks — ${theme}, ${locale}`, async ({ page }) => {
      await setPreferences(page, theme, locale);
      for (const path of PAGES) {
        await page.goto(path);
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        await expect(page.locator('html')).toHaveAttribute('lang', locale);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

        await page.evaluate(() =>
          Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined))),
        );
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze();
        expect(
          results.violations.map(
            (v) => `${path}: ${v.id} — ${v.nodes.map((n) => n.target).join(', ')}`,
          ),
        ).toEqual([]);
      }
    });
  }
}

test('theme choice survives a reload without flashing', async ({ page, consoleErrors }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: 'მუქ თემაზე გადართვა' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  // Check the theme before any app script runs: set by the inline script in index.html.
  await page.route('**/assets/*.js', (route) => route.abort());
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  // The aborted script requests are intentional; they are not app errors.
  consoleErrors.splice(0);
});

test('language choice survives a reload', async ({ page }) => {
  await page.goto('/missions');
  await page.getByRole('button', { name: 'ინგლისურ ენაზე გადართვა' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('My missions');
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('My missions');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('navigation reaches every section', async ({ page, isMobile }) => {
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'მთავარი ნავიგაცია' }).locator('visible=true');
  await expect(nav).toHaveCount(1);
  for (const [name, heading] of [
    ['ჩვევები', 'ჩემი ჩვევები'],
    ['მისიები', 'ჩემი მისიები'],
    ['კალენდარი', 'კალენდარი'],
    ['ანალიზი', 'ანალიზი'],
  ]) {
    await nav.getByRole('link', { name }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading!);
  }
  // The bottom bar is used on phones, the top bar on desktop.
  const box = await nav.boundingBox();
  expect(box!.y > 300).toBe(isMobile);
});

test('layout never scrolls sideways', async ({ page }) => {
  for (const path of PAGES) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `${path} horizontal overflow`).toBe(0);
  }
});

test('first Tab press reaches the skip link', async ({ page, isMobile }) => {
  test.skip(isMobile, 'keyboard test runs on desktop');
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'მთავარ შინაარსზე გადასვლა' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
});

test('bottom bar labels are never cut off', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'bottom bar exists on phones only');
  for (const locale of ['ka', 'en']) {
    await page.goto('/');
    await page.evaluate((l) => localStorage.setItem('progress-locale', l), locale);
    await page.reload();
    const clipped = await page
      .locator('[data-nav-label]')
      .evaluateAll((labels) =>
        labels.filter((label) => label.scrollWidth > label.clientWidth).map((l) => l.textContent),
      );
    expect(clipped, `clipped labels in ${locale}`).toEqual([]);
  }
});
