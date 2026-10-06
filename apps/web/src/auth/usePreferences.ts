import type { Locale, ThemePreference } from '@progress/shared';
import { useTranslation } from 'react-i18next';
import { useToast } from '../components/ui/Toast';
import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from './AuthProvider';

/**
 * Change theme or language. Applies instantly (and in localStorage); for a signed-in user
 * it is also saved to the profile so it follows them to other devices (TDD §12 step 5).
 */
export function usePreferences() {
  const { status, updateMe } = useAuth();
  const { resolved, setPreference } = useTheme();
  const { i18n, t } = useTranslation();
  const toast = useToast();

  const save = (input: Parameters<typeof updateMe>[0]) => {
    if (status !== 'authenticated') return;
    updateMe(input).catch(() => toast(t('errors.NETWORK'), 'error'));
  };

  return {
    setTheme(theme: ThemePreference) {
      setPreference(theme);
      save({ theme });
    },
    toggleTheme() {
      const theme = resolved === 'dark' ? 'LIGHT' : 'DARK';
      setPreference(theme);
      save({ theme });
    },
    setLocale(locale: Locale) {
      void i18n.changeLanguage(locale);
      save({ locale });
    },
  };
}
