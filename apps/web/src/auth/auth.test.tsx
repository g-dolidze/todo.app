import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../test/render';
import { installFakeApi } from '../test/fakeApi';
import { THEME_STORAGE_KEY } from '../theme/theme';

const html = document.documentElement;

async function fill(label: string, value: string) {
  const input = screen.getByLabelText(label);
  await userEvent.clear(input);
  await userEvent.type(input, value);
}

describe('registration (US-1)', () => {
  it('creates an account, signs in and keeps the guest theme', async () => {
    const api = installFakeApi();
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    const { router } = renderApp('/register');

    await screen.findByRole('heading', { name: 'შექმენი ანგარიში' });
    await fill('სახელი', 'Nino');
    await fill('გვარი', 'Beridze');
    await fill('ელფოსტა', 'nino@example.com');
    await fill('პაროლი', 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'რეგისტრაცია' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
    expect(api.calls.find((call) => call.path === '/auth/register')?.body).toMatchObject({
      email: 'nino@example.com',
      locale: 'ka',
      theme: 'DARK',
      timezone: expect.any(String),
    });
    expect(html.dataset.theme).toBe('dark');
    expect(await screen.findByRole('link', { name: 'პროფილი' })).toHaveTextContent('NB');
  });

  it('explains invalid fields in the current language', async () => {
    renderApp('/register');
    await screen.findByRole('heading', { name: 'შექმენი ანგარიში' });
    await fill('ელფოსტა', 'not-an-email');
    await fill('პაროლი', 'abcdefgh');
    await userEvent.click(screen.getByRole('button', { name: 'რეგისტრაცია' }));

    expect(await screen.findByText('შეიყვანე სწორი ელფოსტა.')).toBeVisible();
    expect(screen.getByText('დაამატე მინიმუმ ერთი ციფრი.')).toBeVisible();
    expect(screen.getAllByText('ეს ველი სავალდებულოა.')).toHaveLength(2);
    expect(screen.getByLabelText('ელფოსტა')).toHaveAttribute('aria-invalid', 'true');
  });

  it('points to sign-in when the email is taken', async () => {
    const api = installFakeApi();
    api.addUser({ email: 'taken@example.com', password: 'secret123' });
    renderApp('/register');
    await screen.findByRole('heading', { name: 'შექმენი ანგარიში' });
    await fill('სახელი', 'A');
    await fill('გვარი', 'B');
    await fill('ელფოსტა', 'taken@example.com');
    await fill('პაროლი', 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'რეგისტრაცია' }));
    expect(
      await screen.findByText('ეს ელფოსტა უკვე დარეგისტრირებულია. სცადე შესვლა.'),
    ).toBeVisible();
  });
});

describe('sign in (US-2)', () => {
  it('shows a generic error for wrong credentials', async () => {
    const api = installFakeApi();
    api.addUser({ email: 'giorgi@example.com', password: 'secret123' });
    renderApp('/login');
    await screen.findByRole('heading', { name: 'კეთილი იყოს შენი დაბრუნება' });
    await fill('ელფოსტა', 'giorgi@example.com');
    await fill('პაროლი', 'wrong-pass1');
    await userEvent.click(screen.getByRole('button', { name: 'შესვლა' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('ელფოსტა ან პაროლი არასწორია.');
  });

  it('applies the theme and language saved in the profile', async () => {
    const api = installFakeApi();
    api.addUser({
      email: 'giorgi@example.com',
      password: 'secret123',
      theme: 'DARK',
      locale: 'en',
    });
    const { router } = renderApp('/login');
    await screen.findByRole('heading', { name: 'კეთილი იყოს შენი დაბრუნება' });
    await fill('ელფოსტა', 'giorgi@example.com');
    await fill('პაროლი', 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'შესვლა' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
    expect(html.dataset.theme).toBe('dark');
    expect(html.lang).toBe('en');
    expect(await screen.findByRole('heading', { name: "Today's tasks" })).toBeVisible();
  });
});

describe('session', () => {
  it('restores the session from the refresh cookie and skips the sign-in page', async () => {
    const api = installFakeApi();
    api.addUser({ email: 'giorgi@example.com', password: 'secret123' });
    api.signInWithCookie('giorgi@example.com');
    const { router } = renderApp('/login');
    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
    expect(await screen.findByRole('link', { name: 'პროფილი' })).toHaveTextContent('GD');
  });

  it('saves the header theme toggle to the profile when signed in', async () => {
    const api = installFakeApi();
    api.addUser({ email: 'giorgi@example.com', password: 'secret123', theme: 'LIGHT' });
    api.signInWithCookie('giorgi@example.com');
    renderApp('/');
    await screen.findByText('GD');
    await userEvent.click(screen.getByRole('button', { name: 'მუქ თემაზე გადართვა' }));
    await waitFor(() =>
      expect(api.calls.find((call) => call.method === 'PATCH')?.body).toEqual({ theme: 'DARK' }),
    );
  });

  it('becomes a guest with a message when the session is revoked elsewhere', async () => {
    const api = installFakeApi();
    api.addUser({ email: 'giorgi@example.com', password: 'secret123' });
    api.signInWithCookie('giorgi@example.com');
    renderApp('/profile');
    await screen.findByRole('heading', { name: 'პირადი მონაცემები' });

    api.revokeAll();
    await fill('სახელი', 'Nika');
    await userEvent.click(screen.getByRole('button', { name: 'შენახვა' }));

    expect(await screen.findByText('სესია დასრულდა. გთხოვ, თავიდან შედი.')).toBeVisible();
    expect(await screen.findByRole('heading', { name: 'შექმენი ანგარიში' })).toBeVisible();
  });
});

describe('profile (US-3, US-4)', () => {
  async function signedInProfile() {
    const api = installFakeApi();
    api.addUser({ email: 'giorgi@example.com', password: 'secret123' });
    api.signInWithCookie('giorgi@example.com');
    const result = renderApp('/profile');
    await screen.findByRole('heading', { name: 'პირადი მონაცემები' });
    return { api, ...result };
  }

  it('shows sign-up options to guests', async () => {
    renderApp('/profile');
    expect(await screen.findByRole('link', { name: 'რეგისტრაცია' })).toHaveAttribute(
      'href',
      '/register',
    );
  });

  it('saves only the changed details and confirms', async () => {
    const { api } = await signedInProfile();
    const save = screen.getByRole('button', { name: 'შენახვა' });
    expect(save).toBeDisabled();

    await fill('სახელი', 'Nika');
    await userEvent.click(screen.getByRole('radio', { name: 'ვარსკვლავი' }));
    await userEvent.click(screen.getByRole('radio', { name: 'კვირა' }));
    await userEvent.click(save);

    expect(await screen.findByText('ცვლილებები შენახულია.')).toBeVisible();
    expect(api.calls.find((call) => call.method === 'PATCH')?.body).toEqual({
      firstName: 'Nika',
      avatar: 'star',
      weekStart: 7,
    });
    expect(screen.getByText('Nika Dolidze')).toBeVisible();
    expect(save).toBeDisabled();
  });

  it('shows a field error for a wrong current password', async () => {
    await signedInProfile();
    await fill('ამჟამინდელი პაროლი', 'nope-nope1');
    await fill('ახალი პაროლი', 'brandnew42');
    await userEvent.click(screen.getByRole('button', { name: 'პაროლის შეცვლა' }));
    expect(await screen.findByText('პაროლი არასწორია.')).toBeVisible();
  });

  it('changes the password and clears the form', async () => {
    await signedInProfile();
    await fill('ამჟამინდელი პაროლი', 'secret123');
    await fill('ახალი პაროლი', 'brandnew42');
    await userEvent.click(screen.getByRole('button', { name: 'პაროლის შეცვლა' }));
    expect(await screen.findByText('პაროლი შეიცვალა.')).toBeVisible();
    expect(screen.getByLabelText('ამჟამინდელი პაროლი')).toHaveValue('');
  });

  it('deletes the account only after password confirmation', async () => {
    const { api, router } = await signedInProfile();
    await userEvent.click(screen.getByRole('button', { name: 'ანგარიშის წაშლა' }));
    const dialog = await screen.findByRole('dialog', { name: 'ნამდვილად გინდა ანგარიშის წაშლა?' });

    await userEvent.type(within(dialog).getByLabelText('პაროლი'), 'wrong-pass1');
    await userEvent.click(within(dialog).getByRole('button', { name: 'სამუდამოდ წაშლა' }));
    expect(await within(dialog).findByText('პაროლი არასწორია.')).toBeVisible();
    expect(api.users.size).toBe(1);

    await userEvent.clear(within(dialog).getByLabelText('პაროლი'));
    await userEvent.type(within(dialog).getByLabelText('პაროლი'), 'secret123');
    await userEvent.click(within(dialog).getByRole('button', { name: 'სამუდამოდ წაშლა' }));

    expect(await screen.findByText('ანგარიში წაიშალა.')).toBeVisible();
    expect(api.users.size).toBe(0);
    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
  });

  it('signs out', async () => {
    const { router } = await signedInProfile();
    await userEvent.click(screen.getByRole('button', { name: 'გასვლა' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
    expect(await screen.findByRole('link', { name: 'შესვლა' })).toBeVisible();
  });
});

describe('guests', () => {
  it('make no session request when there is no session cookie', async () => {
    const api = installFakeApi();
    renderApp('/');
    expect(await screen.findByRole('link', { name: 'შესვლა' })).toBeVisible();
    expect(api.calls).toEqual([]);
  });
});
