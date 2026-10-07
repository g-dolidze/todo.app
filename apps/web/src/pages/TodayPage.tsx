import { useTranslation } from 'react-i18next';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { ProgressRing } from '../components/ProgressRing';
import { formatLongDate } from '../lib/dates';

function greetingKey(hour: number) {
  if (hour < 12) return 'today.greeting.morning' as const;
  if (hour < 18) return 'today.greeting.afternoon' as const;
  return 'today.greeting.evening' as const;
}

export function TodayPage() {
  const { t, i18n } = useTranslation();
  const now = new Date();
  const date = formatLongDate(now, i18n.language === 'en' ? 'en' : 'ka');

  // Real data arrives in milestone M3; until then the day is empty.
  const done = 0;
  const total = 0;
  const percent = total === 0 ? 0 : (done / total) * 100;

  return (
    <>
      <PageHeader eyebrow={date} title={t(greetingKey(now.getHours()))} />

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <Card aria-labelledby="today-tasks">
          <h2 id="today-tasks" className="text-lg font-bold tracking-tight">
            {t('today.title')}
          </h2>
          <EmptyState
            icon="habits"
            title={t('today.empty.title')}
            text={t('today.empty.text')}
            comingSoon
          />
        </Card>

        <Card aria-labelledby="today-progress" className="flex flex-col">
          <h2 id="today-progress" className="text-lg font-bold tracking-tight">
            {t('today.progress')}
          </h2>
          <div className="flex flex-1 flex-col items-center justify-center gap-4 py-8">
            <ProgressRing
              value={percent}
              label={`${t('today.progress')}: ${t('today.progressValue', { done, total })}`}
            />
            <p className="text-sm font-semibold text-muted">
              {t('today.progressValue', { done, total })}
            </p>
          </div>
        </Card>
      </div>
    </>
  );
}
