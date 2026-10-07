import type { ErrorCode } from '@progress/shared';

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  EMAIL_TAKEN: 409,
  DATE_IN_FUTURE: 422,
  DATE_TOO_OLD: 422,
  NOT_DUE: 422,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
};

/** Throw this from services; the error handler turns it into the TDD §10.1 format. */
export class AppError extends Error {
  readonly status: number;

  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.status = STATUS_BY_CODE[code];
  }
}
