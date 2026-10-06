import { useId, useState, type InputHTMLAttributes, type ReactNode, type Ref } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '../Icon';

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** A translation key under `validation.`, or a ready message. */
  error?: string;
  hint?: ReactNode;
  ref?: Ref<HTMLInputElement>;
  /** Extra element at the end of the input (e.g. show-password button). */
  trailing?: ReactNode;
}

export const inputClass =
  'block min-h-12 w-full rounded-control border bg-surface px-4 text-base text-fg placeholder:text-muted/70 transition outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/25 disabled:bg-surface-soft disabled:text-muted';

/** Translates a validation key, falling back to a generic message for unknown keys. */
export function useErrorText() {
  const { t, i18n } = useTranslation();
  return (error?: string) => {
    if (!error) return undefined;
    const key = `validation.${error}`;
    return i18n.exists(key) ? t(key as 'validation.email.invalid') : t('errors.VALIDATION_ERROR');
  };
}

export function TextField({
  label,
  error,
  hint,
  trailing,
  id,
  className = '',
  ref,
  ...props
}: TextFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorText = useErrorText()(error);
  const describedBy = [errorText && `${inputId}-error`, hint && `${inputId}-hint`]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-semibold text-fg">
        {label}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          aria-invalid={errorText ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={`${inputClass} ${trailing ? 'pr-12' : ''} ${errorText ? 'border-danger' : 'border-line'}`}
          {...props}
        />
        {trailing && <div className="absolute inset-y-0 right-1 flex items-center">{trailing}</div>}
      </div>
      {hint && !errorText && (
        <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      )}
      {errorText && (
        <p id={`${inputId}-error`} className="mt-1.5 text-sm font-medium text-danger">
          {errorText}
        </p>
      )}
    </div>
  );
}

export function PasswordField(props: Omit<TextFieldProps, 'type' | 'trailing'>) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const label = visible ? t('fields.hidePassword') : t('fields.showPassword');
  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          className="grid size-10 place-items-center rounded-control text-muted transition hover:text-fg"
          aria-label={label}
          title={label}
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
        >
          <Icon name={visible ? 'eyeOff' : 'eye'} size={20} />
        </button>
      }
    />
  );
}
