import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ApiError } from '../api/client';

/**
 * Puts server field errors (VALIDATION_ERROR details) on the matching form fields.
 * Returns false when the error has no field errors, so the caller can show a general message.
 */
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
): boolean {
  if (!(error instanceof ApiError)) return false;
  const entries = Object.entries(error.fieldErrors);
  for (const [field, messages] of entries) {
    if (messages[0]) setError(field as Path<T>, { type: 'server', message: messages[0] });
  }
  return entries.length > 0;
}

/** Translation key for any thrown error. */
export function errorKey(error: unknown) {
  return `errors.${error instanceof ApiError ? error.code : 'INTERNAL_ERROR'}` as const;
}
