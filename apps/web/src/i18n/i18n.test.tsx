import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../test/render';
import { LOCALE_STORAGE_KEY } from '.';

describe('languages (TDD §11.5)', () => {
  it('starts in Georgian', async () => {
    renderApp('/habits');
    expect(await screen.findByRole('heading', { level: 1, name: 'ჩემი ჩვევები' })).toBeVisible();
  });

  it('header button switches the whole UI to English and remembers it', async () => {
    renderApp('/habits');
    await userEvent.click(await screen.findByRole('button', { name: 'ინგლისურ ენაზე გადართვა' }));

    expect(screen.getByRole('heading', { level: 1, name: 'My habits' })).toBeVisible();
    expect(screen.getAllByRole('link', { name: 'Missions' }).length).toBeGreaterThan(0);
    expect(document.documentElement.lang).toBe('en');
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('en');
  });

  it('can switch language from the profile page', async () => {
    renderApp('/profile');
    await userEvent.click(await screen.findByRole('radio', { name: 'English' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Profile' })).toBeVisible();
    expect(screen.getByRole('radio', { name: 'English' })).toBeChecked();
  });
});
