import type { HTMLAttributes } from 'react';

export function Card({ className = '', ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={`rounded-card border border-line bg-surface p-5 shadow-card sm:p-6 ${className}`}
      {...props}
    />
  );
}
