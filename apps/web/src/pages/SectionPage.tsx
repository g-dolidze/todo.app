import { useTranslation } from 'react-i18next';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import type { IconName } from '../components/Icon';
import { PageHeader } from '../components/PageHeader';

type Section = 'habits' | 'missions' | 'calendar' | 'analytics';

const ICONS: Record<Section, IconName> = {
  habits: 'habits',
  missions: 'missions',
  calendar: 'calendar',
  analytics: 'analytics',
};

/** Placeholder for sections that later milestones fill in (TDD §16). */
export function SectionPage({ section }: { section: Section }) {
  const { t } = useTranslation();
  const tone = section === 'missions' ? 'mission' : 'primary';

  return (
    <>
      <PageHeader title={t(`${section}.title`)} subtitle={t(`${section}.subtitle`)} tone={tone} />
      <Card>
        <EmptyState
          icon={ICONS[section]}
          title={t(`${section}.empty.title`)}
          text={t(`${section}.empty.text`)}
          tone={tone}
          comingSoon
        />
      </Card>
    </>
  );
}
