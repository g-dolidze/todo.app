import type { Locale, ThemePreference } from '@progress/shared';
import { THEMES } from '@progress/shared';
import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { hasSessionHint } from '../api/client';
import { useAuth } from '../auth/AuthProvider';
import { usePreferences } from '../auth/usePreferences';
import { Avatar } from '../components/Avatar';
import { Card } from '../components/Card';
import type { IconName } from '../components/Icon';
import { PageHeader } from '../components/PageHeader';
import { buttonClass } from '../components/ui/Button';
import { Segmented } from '../components/ui/Segmented';
import { useTheme } from '../theme/ThemeProvider';
import { CardTitle } from './profile/CardTitle';

const loadSignedIn = () => import('./profile/SignedInProfile');
const SignedInProfile = lazy(() => loadSignedIn().then((m) => ({ default: m.SignedInProfile })));
// A session cookie exists: start downloading the signed-in view now, in parallel with the
// session check, instead of after it.
if (typeof document !== 'undefined' && hasSessionHint()) void loadSignedIn();

const THEME_ICONS: Record<ThemePreference, IconName> = {
  LIGHT: 'sun',
  DARK: 'moon',
  SYSTEM: 'monitor',
};

const LANGUAGES: { value: Locale; label: string; lang: string }[] = [
  { value: 'ka', label: 'ქართული', lang: 'ka' },
  { value: 'en', label: 'English', lang: 'en' },
];

function AppearanceCard() {
  const { t, i18n } = useTranslation();
  const { preference } = useTheme();
  const { setTheme, setLocale } = usePreferences();

  return (
    <Card aria-labelledby="appearance">
      <CardTitle id="appearance">{t('profile.appearance')}</CardTitle>
      <div className="space-y-6">
        <Segmented
          legend={t('profile.theme.label')}
          value={preference}
          onChange={setTheme}
          options={THEMES.map((theme) => ({
            value: theme,
            label: t(`profile.theme.${theme}`),
            icon: THEME_ICONS[theme],
          }))}
        />
        <Segmented
          legend={t('profile.language')}
          value={i18n.language === 'en' ? 'en' : 'ka'}
          onChange={setLocale}
          options={LANGUAGES}
        />
      </div>
    </Card>
  );
}

function GuestCard() {
  const { t } = useTranslation();
  return (
    <Card aria-labelledby="guest-account" className="flex flex-col">
      <CardTitle id="guest-account">{t('profile.guest.title')}</CardTitle>
      <div className="flex items-start gap-4">
        <Avatar user={null} size="md" />
        <p className="text-sm leading-relaxed text-muted">{t('profile.guest.text')}</p>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/register" className={buttonClass('primary')}>
          {t('profile.guest.register')}
        </Link>
        <Link to="/login" className={buttonClass('secondary')}>
          {t('profile.guest.signIn')}
        </Link>
      </div>
    </Card>
  );
}

function Skeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-2" aria-hidden="true">
      {[0, 1].map((key) => (
        <Card key={key} className="h-64 animate-pulse">
          <div className="h-5 w-40 rounded-full bg-surface-soft" />
          <div className="mt-6 h-11 rounded-control bg-surface-soft" />
          <div className="mt-4 h-11 rounded-control bg-surface-soft" />
        </Card>
      ))}
    </div>
  );
}

export function ProfilePage() {
  const { t } = useTranslation();
  const { status, user } = useAuth();

  return (
    <>
      <PageHeader title={t('profile.title')} subtitle={t('profile.subtitle')} />

      {status === 'loading' && (
        <>
          <span className="sr-only" role="status">
            {t('common.loading')}
          </span>
          <Skeleton />
        </>
      )}

      {status === 'guest' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <AppearanceCard />
          <GuestCard />
        </div>
      )}

      {status === 'authenticated' && user && (
        <Suspense fallback={<Skeleton />}>
          <SignedInProfile user={user} appearance={<AppearanceCard />} />
        </Suspense>
      )}
    </>
  );
}
