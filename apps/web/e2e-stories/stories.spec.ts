import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

/*
 * Every Storybook story must render without errors and pass axe in light and dark mode
 * (TDD §14.6). Runs against the static Storybook build (`pnpm build-storybook`).
 */
const index = JSON.parse(
  readFileSync(new URL('../storybook-static/index.json', import.meta.url), 'utf8'),
);
const ids = Object.keys(index.entries as Record<string, unknown>);

for (const theme of ['light', 'dark']) {
  for (const id of ids) {
    test(`${id} — ${theme}`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });

      await page.goto(`/iframe.html?id=${id}&viewMode=story&globals=theme:${theme}`);
      await expect(page.locator('#storybook-root > *').first()).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);

      const results = await new AxeBuilder({ page })
        .include('#storybook-root')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(results.violations.map((v) => v.id)).toEqual([]);
      expect(errors).toEqual([]);
    });
  }
}
