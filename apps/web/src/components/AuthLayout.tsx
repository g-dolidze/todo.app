import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, Outlet } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import { usePreferences } from '../auth/usePreferences';
import { useTheme } from '../theme/ThemeProvider';
import { BrandMark } from './BrandMark';
import { Icon } from './Icon';

const iconButton =
  'grid size-11 place-items-center rounded-full bg-surface-soft text-fg transition hover:bg-primary-soft hover:text-primary active:scale-95';

/** Centered card layout for sign-in and registration. Signed-in users go straight home. */
export function AuthLayout() {
  const { t, i18n } = useTranslation();
  const { status } = useAuth();
  const { resolved } = useTheme();
  const { toggleTheme, setLocale } = usePreferences();
  const next = i18n.language === 'ka' ? 'en' : 'ka';

  if (status === 'authenticated') return <Navigate to="/" replace />;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-[1240px] items-center justify-between px-4 py-4 sm:px-7">
        <Link to="/" aria-label={t('header.home')} className="rounded-control">
          <BrandMark />
        </Link>
        <div className="flex gap-2">
          <button
            type="button"
            className={`${iconButton} text-xs font-black tracking-wider`}
            aria-label={t('header.switchLanguage')}
            onClick={() => setLocale(next)}
          >
            <span lang={next}>{next === 'en' ? 'EN' : 'ქა'}</span>
          </button>
          <button
            type="button"
            className={iconButton}
            aria-label={resolved === 'dark' ? t('header.themeToLight') : t('header.themeToDark')}
            onClick={toggleTheme}
          >
            <Icon name={resolved === 'dark' ? 'sun' : 'moon'} />
          </button>
        </div>
      </header>
      <main
        id="main"
        className="flex flex-1 items-start justify-center px-4 pb-12 pt-4 sm:items-center sm:pt-0"
      >
        <div className="w-full max-w-md">
          <Suspense fallback={null}>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
