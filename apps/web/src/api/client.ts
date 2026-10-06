import { ERROR_CODES, type ApiErrorBody, type ErrorCode } from '@progress/shared';

/** Error thrown by every API call. `code` is translated in the UI via `errors.<code>`. */
export class ApiError extends Error {
  constructor(
    readonly code: ErrorCode | 'NETWORK',
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const BASE_URL = '/api/v1';

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  const code = (value as ApiErrorBody | null)?.error?.code;
  return typeof code === 'string' && (ERROR_CODES as readonly string[]).includes(code);
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, { ...init, headers, credentials: 'include' });
  } catch {
    throw new ApiError('NETWORK', 'Network request failed', 0);
  }

  if (response.status === 204) return undefined as T;

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    if (isApiErrorBody(body)) {
      throw new ApiError(body.error.code, body.error.message, response.status, body.error.details);
    }
    throw new ApiError('INTERNAL_ERROR', `Unexpected ${response.status} response`, response.status);
  }
  return body as T;
}
