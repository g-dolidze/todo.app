import type { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow?: ReactNode;
  title: string;
  subtitle?: string;
  tone?: 'primary' | 'mission';
}

export function PageHeader({ eyebrow, title, subtitle, tone = 'primary' }: PageHeaderProps) {
  return (
    <header className="mb-6 sm:mb-8">
      {eyebrow && (
        <p
          className={`mb-2 text-xs font-extrabold tracking-[0.12em] [:lang(en)_&]:uppercase [:lang(ka)_&]:text-sm [:lang(ka)_&]:tracking-normal ${tone === 'mission' ? 'text-mission' : 'text-primary'}`}
        >
          {eyebrow}
        </p>
      )}
      <h1 className="text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">{title}</h1>
      {subtitle && <p className="mt-2 text-base text-muted">{subtitle}</p>}
    </header>
  );
}
