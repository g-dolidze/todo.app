import { resolveTheme, type ResolvedTheme, type ThemePreference } from '@progress/shared';

/** Same key as Pro-gress v0.1, so an existing choice carries over. */
export const THEME_STORAGE_KEY = 'progress-theme';

const STORED_TO_PREFERENCE: Record<string, ThemePreference> = {
  light: 'LIGHT',
  dark: 'DARK',
  system: 'SYSTEM',
};

export function readStoredTheme(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return (stored && STORED_TO_PREFERENCE[stored]) || 'SYSTEM';
  } catch {
    return 'SYSTEM';
  }
}

export function storeTheme(preference: ThemePreference): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference.toLowerCase());
  } catch {
    // Storage can be blocked (private mode). The theme still applies for this visit.
  }
}

export function systemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function applyTheme(theme: ResolvedTheme): void {
  document.documentElement.dataset.theme = theme;
}

export { resolveTheme };
