import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Icon } from '../components/Icon';

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <p className="text-7xl font-extrabold tracking-tight text-primary-accent">404</p>
      <h1 className="mt-4 text-2xl font-extrabold tracking-tight">{t('notFound.title')}</h1>
      <p className="mt-2 text-muted">{t('notFound.text')}</p>
      <Link
        to="/"
        className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-control bg-primary px-5 font-semibold text-on-primary transition hover:bg-primary-strong active:scale-[0.98]"
      >
        <Icon name="arrowLeft" size={18} />
        {t('notFound.back')}
      </Link>
    </div>
  );
}
