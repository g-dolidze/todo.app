import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-strong',
  secondary: 'border border-line bg-surface text-fg hover:bg-surface-soft',
  ghost: 'text-muted hover:bg-surface-soft hover:text-fg',
  danger: 'bg-danger text-on-danger hover:brightness-110',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  /** Shows a spinner, keeps the width and blocks clicks. */
  loading?: boolean;
  fullWidth?: boolean;
}

export function buttonClass(variant: Variant = 'primary', fullWidth = false) {
  return `relative inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-5 text-sm font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-55 ${VARIANTS[variant]} ${fullWidth ? 'w-full' : ''}`;
}

export function Button({
  variant = 'primary',
  loading = false,
  fullWidth = false,
  className = '',
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${buttonClass(variant, fullWidth)} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      <span className={`inline-flex items-center gap-2 ${loading ? 'invisible' : ''}`}>
        {children}
      </span>
      {loading && (
        <span className="absolute inset-0 grid place-items-center" aria-hidden="true">
          <span className="size-5 animate-spin rounded-full border-2 border-current border-r-transparent" />
        </span>
      )}
    </button>
  );
}
