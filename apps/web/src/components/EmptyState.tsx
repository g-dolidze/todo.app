import { useTranslation } from 'react-i18next';
import { Icon, type IconName } from './Icon';

interface EmptyStateProps {
  icon: IconName;
  title: string;
  text: string;
  tone?: 'primary' | 'mission';
  /** Shows a "Coming soon" pill for features that are not built yet. */
  comingSoon?: boolean;
}

export function EmptyState({ icon, title, text, tone = 'primary', comingSoon }: EmptyStateProps) {
  const { t } = useTranslation();
  const toneClass =
    tone === 'mission' ? 'bg-mission-soft text-mission' : 'bg-primary-soft text-primary';

  return (
    <div className="flex flex-col items-center px-4 py-10 text-center sm:py-14">
      <div className={`mb-5 grid size-16 place-items-center rounded-[22px] ${toneClass}`}>
        <Icon name={icon} size={30} />
      </div>
      <h2 className="text-lg font-bold tracking-tight text-fg">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">{text}</p>
      {comingSoon && (
        <span className="mt-5 rounded-full border border-line bg-surface-soft px-3 py-1 text-xs font-semibold text-muted">
          {t('common.comingSoon')}
        </span>
      )}
    </div>
  );
}
