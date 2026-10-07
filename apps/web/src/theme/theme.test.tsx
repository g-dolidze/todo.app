import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../test/render';
import { setSystemDark } from '../test/setup';
import { THEME_STORAGE_KEY } from './theme';

const html = document.documentElement;

describe('theme (TDD §12)', () => {
  it('follows the OS setting by default', async () => {
    setSystemDark(true);
    renderApp();
    await waitFor(() => expect(html.dataset.theme).toBe('dark'));
  });

  it('header button switches to dark and remembers it', async () => {
    renderApp();
    await waitFor(() => expect(html.dataset.theme).toBe('light'));

    await userEvent.click(screen.getByRole('button', { name: 'მუქ თემაზე გადართვა' }));

    expect(html.dataset.theme).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(screen.getByRole('button', { name: 'ღია თემაზე გადართვა' })).toBeInTheDocument();
  });

  it('reads a Pro-gress v0.1 stored theme', async () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    renderApp();
    await waitFor(() => expect(html.dataset.theme).toBe('dark'));
  });

  it('"System" on the profile page tracks live OS changes', async () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    renderApp('/profile');

    await userEvent.click(await screen.findByRole('radio', { name: 'სისტემური' }));
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('system');
    expect(html.dataset.theme).toBe('light');

    setSystemDark(true);
    await waitFor(() => expect(html.dataset.theme).toBe('dark'));
  });
});
