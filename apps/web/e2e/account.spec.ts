import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

const PASSWORD = 'secret123';
const uniqueEmail = () => `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;

async function register(page: Page, email: string) {
  await page.goto('/register');
  await page.getByLabel('სახელი').fill('Giorgi');
  await page.getByLabel('გვარი').fill('Dolidze');
  await page.getByLabel('ელფოსტა').fill(email);
  await page.getByLabel('პაროლი', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'რეგისტრაცია' }).click();
  await expect(page).toHaveURL('/');
}

async function login(page: Page, email: string, password = PASSWORD) {
  await page.goto('/login');
  await page.getByLabel('ელფოსტა').fill(email);
  await page.getByLabel('პაროლი', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'შესვლა' }).click();
}

async function expectNoA11yViolations(page: Page, label: string) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(
    results.violations.map((v) => `${label}: ${v.id} — ${v.nodes.map((n) => n.target).join(', ')}`),
  ).toEqual([]);
}

test('sign up, stay signed in after reload, sign out and sign back in', async ({ page }) => {
  const email = uniqueEmail();
  await register(page, email);
  const avatar = page.getByRole('link', { name: 'პროფილი' }).locator('visible=true');
  await expect(avatar).toHaveText('GD');

  await page.reload();
  await expect(avatar).toHaveText('GD');

  await avatar.click();
  await expect(page.getByText(email)).toBeVisible();
  await page.getByRole('button', { name: 'გასვლა' }).click();
  await expect(page).toHaveURL('/');
  await page.reload();
  await expect(page.getByRole('link', { name: 'პროფილი' }).locator('visible=true')).not.toHaveText(
    'GD',
  );

  await login(page, email);
  await expect(page).toHaveURL('/');
  await expect(avatar).toHaveText('GD');
});

test('wrong password shows a clear message', async ({ page }) => {
  await login(page, 'nobody@example.com', 'wrong-pass1');
  await expect(page.getByRole('alert')).toHaveText('ელფოსტა ან პაროლი არასწორია.');
});

test('theme follows the account to another browser (journey 4)', async ({ page, browser }) => {
  test.skip(test.info().project.name === 'mobile', 'one device is enough');
  const email = uniqueEmail();
  await register(page, email);
  await Promise.all([
    page.waitForResponse((res) => res.url().endsWith('/api/v1/me') && res.ok()),
    page.getByRole('button', { name: 'მუქ თემაზე გადართვა' }).click(),
  ]);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  const other = await browser.newContext({ colorScheme: 'light' });
  const second = await other.newPage();
  await login(second, email);
  await expect(second.locator('html')).toHaveAttribute('data-theme', 'dark');
  await other.close();
});

test('signed-in pages pass accessibility checks in both themes', async ({ page }) => {
  await register(page, uniqueEmail());
  for (const theme of ['light', 'dark']) {
    await page.goto('/profile');
    if ((await page.locator('html').getAttribute('data-theme')) !== theme) {
      await page
        .getByRole('radio', { name: theme === 'dark' ? 'მუქი' : 'ღია' })
        .check({ force: true });
    }
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await expect(page.getByRole('heading', { name: 'პირადი მონაცემები' })).toBeVisible();
    await expectNoA11yViolations(page, `profile ${theme}`);

    await page.getByRole('button', { name: 'ანგარიშის წაშლა' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expectNoA11yViolations(page, `delete dialog ${theme}`);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  }
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBe(0);
});

test('auth pages pass accessibility checks', async ({ page }) => {
  for (const path of ['/login', '/register']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expectNoA11yViolations(page, path);
    // Show validation errors too: they must also be accessible.
    await page.getByRole('button', { name: path === '/login' ? 'შესვლა' : 'რეგისტრაცია' }).click();
    await expect(page.locator('[aria-invalid="true"]').first()).toBeVisible();
    await expectNoA11yViolations(page, `${path} with errors`);
  }
});

test('delete dialog traps focus, closes on Escape and returns focus', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'keyboard test runs on desktop');
  await register(page, uniqueEmail());
  await page.goto('/profile');
  const open = page.getByRole('button', { name: 'ანგარიშის წაშლა' });
  await open.click();
  const dialog = page.getByRole('dialog', { name: 'ნამდვილად გინდა ანგარიშის წაშლა?' });
  await expect(dialog.getByLabel('პაროლი', { exact: true })).toBeFocused();
  // Native modal dialog: the page behind is inert. Tab may reach the browser's own UI
  // (focus on <body>), but never an element of the page behind the dialog.
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab');
    const escaped = await dialog.evaluate(
      (el) => !el.contains(document.activeElement) && document.activeElement !== document.body,
    );
    expect(escaped, `focus left the dialog after ${i + 1} Tab presses`).toBe(false);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(open).toBeFocused();
});

test('deleting the account removes it for good', async ({ page }) => {
  const email = uniqueEmail();
  await register(page, email);
  await page.goto('/profile');
  await page.getByRole('button', { name: 'ანგარიშის წაშლა' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('პაროლი', { exact: true }).fill(PASSWORD);
  await dialog.getByRole('button', { name: 'სამუდამოდ წაშლა' }).click();
  await expect(page.getByText('ანგარიში წაიშალა.')).toBeVisible();
  await expect(page).toHaveURL('/');

  await login(page, email);
  await expect(page.getByRole('alert')).toHaveText('ელფოსტა ან პაროლი არასწორია.');
});
