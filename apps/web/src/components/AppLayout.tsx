import { useTranslation } from 'react-i18next';
import { Link, NavLink, Outlet } from 'react-router';
import { useTheme } from '../theme/ThemeProvider';
import { BrandMark } from './BrandMark';
import { Icon, type IconName } from './Icon';

interface NavItem {
  to: string;
  key: 'today' | 'habits' | 'missions' | 'calendar' | 'analytics';
  icon: IconName;
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', key: 'today', icon: 'today' },
  { to: '/habits', key: 'habits', icon: 'habits' },
  { to: '/missions', key: 'missions', icon: 'missions' },
  { to: '/calendar', key: 'calendar', icon: 'calendar' },
  { to: '/analytics', key: 'analytics', icon: 'analytics' },
];

const iconButton =
  'grid size-11 place-items-center rounded-full bg-surface-soft text-fg transition hover:bg-primary-soft hover:text-primary active:scale-95';

function LanguageButton() {
  const { t, i18n } = useTranslation();
  const next = i18n.language === 'ka' ? 'en' : 'ka';
  return (
    <button
      type="button"
      className={`${iconButton} text-xs font-black tracking-wider`}
      aria-label={t('header.switchLanguage')}
      title={t('header.switchLanguage')}
      onClick={() => void i18n.changeLanguage(next)}
    >
      <span lang={next}>{next === 'en' ? 'EN' : 'ქა'}</span>
    </button>
  );
}

function ThemeButton() {
  const { t } = useTranslation();
  const { resolved, toggle } = useTheme();
  const label = resolved === 'dark' ? t('header.themeToLight') : t('header.themeToDark');
  return (
    <button type="button" className={iconButton} aria-label={label} title={label} onClick={toggle}>
      <Icon name={resolved === 'dark' ? 'sun' : 'moon'} />
    </button>
  );
}

export function AppLayout() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only z-50 rounded-control bg-primary px-4 py-2 font-semibold text-on-primary focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        {t('header.skipToContent')}
      </a>

      <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-4 px-4 sm:h-[76px] sm:px-7">
          <Link to="/" aria-label={t('header.home')} className="rounded-control">
            <BrandMark />
          </Link>

          <nav aria-label={t('nav.label')} className="hidden h-full nav:flex">
            <ul className="flex h-full items-stretch gap-8">
              {NAV_ITEMS.map((item) => (
                <li key={item.key} className="flex">
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      `relative flex items-center text-sm font-semibold transition-colors after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:w-6 after:-translate-x-1/2 after:rounded-full after:transition-colors ${
                        isActive
                          ? 'text-fg after:bg-primary-accent'
                          : 'text-muted after:bg-transparent hover:text-fg'
                      }`
                    }
                  >
                    {t(`nav.${item.key}`)}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <LanguageButton />
            <ThemeButton />
            <NavLink
              to="/profile"
              aria-label={t('nav.profile')}
              title={t('nav.profile')}
              className={({ isActive }) =>
                `grid size-11 place-items-center rounded-full transition active:scale-95 ${
                  isActive
                    ? 'bg-primary text-on-primary'
                    : 'bg-avatar text-on-avatar hover:brightness-95'
                }`
              }
            >
              <Icon name="profile" />
            </NavLink>
          </div>
        </div>
      </header>

      <main
        id="main"
        tabIndex={-1}
        className="mx-auto w-full max-w-[1240px] flex-1 px-4 pb-28 pt-6 outline-none sm:px-7 sm:pt-10 nav:pb-12"
      >
        <Outlet />
      </main>

      <footer className="hidden border-t border-line py-6 text-center text-sm text-muted nav:block">
        {t('app.tagline')}
      </footer>

      <nav
        aria-label={t('nav.label')}
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg nav:hidden"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {NAV_ITEMS.map((item) => (
            <li key={item.key}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex min-h-16 flex-col items-center justify-center gap-1 px-0 text-[11px] font-semibold tracking-tight transition-colors [:lang(ka)_&]:text-[10px] ${
                    isActive ? 'text-primary' : 'text-muted hover:text-fg'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`grid h-7 w-12 place-items-center rounded-full transition-colors ${isActive ? 'bg-primary-soft' : ''}`}
                    >
                      <Icon name={item.icon} size={21} />
                    </span>
                    <span className="max-w-full truncate" data-nav-label>
                      {t(`nav.${item.key}`)}
                    </span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
