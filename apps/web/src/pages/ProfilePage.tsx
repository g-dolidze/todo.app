import { THEMES, type Locale, type ThemePreference } from '@progress/shared';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../components/Card';
import { Icon, type IconName } from '../components/Icon';
import { PageHeader } from '../components/PageHeader';
import { useTheme } from '../theme/ThemeProvider';

const THEME_ICONS: Record<ThemePreference, IconName> = {
  LIGHT: 'sun',
  DARK: 'moon',
  SYSTEM: 'monitor',
};

const LANGUAGES: { value: Locale; label: string }[] = [
  { value: 'ka', label: 'ქართული' },
  { value: 'en', label: 'English' },
];

interface Option<T extends string> {
  value: T;
  label: string;
  icon?: IconName;
  lang?: string;
}

/** Accessible segmented control built on native radio buttons. */
function Segmented<T extends string>({
  legend,
  value,
  options,
  onChange,
}: {
  legend: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
}) {
  const name = useId();
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-semibold text-fg">{legend}</legend>
      <div className="grid auto-cols-fr grid-flow-col gap-1 rounded-[14px] bg-surface-soft p-1">
        {options.map((option) => (
          <label
            key={option.value}
            className="relative flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-control px-3 text-sm font-semibold text-muted transition has-checked:bg-surface has-checked:text-fg has-checked:shadow-sm has-focus-visible:outline-3 has-focus-visible:outline-primary/45"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.icon && <Icon name={option.icon} size={18} />}
            <span lang={option.lang}>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function ProfilePage() {
  const { t, i18n } = useTranslation();
  const { preference, setPreference } = useTheme();
  const locale: Locale = i18n.language === 'en' ? 'en' : 'ka';

  return (
    <>
      <PageHeader title={t('profile.title')} subtitle={t('profile.subtitle')} />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card aria-labelledby="appearance">
          <h2 id="appearance" className="mb-5 text-lg font-bold tracking-tight">
            {t('profile.appearance')}
          </h2>
          <div className="space-y-6">
            <Segmented
              legend={t('profile.theme.label')}
              value={preference}
              onChange={setPreference}
              options={THEMES.map((theme) => ({
                value: theme,
                label: t(`profile.theme.${theme}`),
                icon: THEME_ICONS[theme],
              }))}
            />
            <Segmented
              legend={t('profile.language')}
              value={locale}
              onChange={(next) => void i18n.changeLanguage(next)}
              options={LANGUAGES.map((language) => ({ ...language, lang: language.value }))}
            />
          </div>
        </Card>

        <Card aria-labelledby="account">
          <h2 id="account" className="mb-5 text-lg font-bold tracking-tight">
            {t('profile.account.title')}
          </h2>
          <div className="flex items-start gap-4">
            <div className="grid size-14 shrink-0 place-items-center rounded-full bg-avatar text-on-avatar">
              <Icon name="profile" size={26} />
            </div>
            <p className="text-sm leading-relaxed text-muted">{t('profile.account.soon')}</p>
          </div>
        </Card>
      </div>
    </>
  );
}
