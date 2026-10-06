import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../test/render';

describe('AppLayout', () => {
  it('has desktop and mobile navigation with all five sections', async () => {
    renderApp();
    const navs = await screen.findAllByRole('navigation', { name: 'მთავარი ნავიგაცია' });
    expect(navs).toHaveLength(2);
    for (const nav of navs) {
      expect(
        within(nav)
          .getAllByRole('link')
          .map((link) => link.textContent),
      ).toEqual(['დღეს', 'ჩვევები', 'მისიები', 'კალენდარი', 'ანალიზი']);
    }
  });

  it('marks the current page and navigates', async () => {
    const { router } = renderApp();
    const [desktopNav] = await screen.findAllByRole('navigation', { name: 'მთავარი ნავიგაცია' });
    expect(within(desktopNav!).getByRole('link', { name: 'დღეს' })).toHaveAttribute(
      'aria-current',
      'page',
    );

    await userEvent.click(within(desktopNav!).getByRole('link', { name: 'მისიები' }));
    expect(router.state.location.pathname).toBe('/missions');
    expect(await screen.findByRole('heading', { level: 1, name: 'ჩემი მისიები' })).toBeVisible();
  });

  it('shows a friendly 404 with a way back', async () => {
    renderApp('/nope');
    expect(await screen.findByRole('heading', { name: 'გვერდი ვერ მოიძებნა' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'დღევანდელ გეგმაზე დაბრუნება' })).toHaveAttribute(
      'href',
      '/',
    );
  });

  it('offers a skip link to the main content', async () => {
    renderApp();
    expect(await screen.findByRole('link', { name: 'მთავარ შინაარსზე გადასვლა' })).toHaveAttribute(
      'href',
      '#main',
    );
  });
});
