import type { ReactNode } from 'react';
import { Icon } from '../Icon';

/** Form-level error, announced immediately to screen readers. */
export function FormAlert({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-control border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-medium text-danger"
    >
      <Icon name="alert" size={20} className="mt-px shrink-0" />
      <span>{children}</span>
    </div>
  );
}
