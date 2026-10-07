import {
  ERROR_CODES,
  type ApiErrorBody,
  type AuthResponse,
  type ErrorCode,
} from '@progress/shared';

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

  /** Field errors from a VALIDATION_ERROR (keys are translation keys under `validation.`). */
  get fieldErrors(): Record<string, string[]> {
    const details = this.details as { fieldErrors?: Record<string, string[]> } | undefined;
    return details?.fieldErrors ?? {};
  }
}

const BASE_URL = '/api/v1';

/*
 * Session (TDD §11.3): the access token lives only in memory, never in localStorage.
 * The refresh token is an httpOnly cookie the browser sends to /api/v1/auth/* by itself.
 */
let accessToken: string | null = null;
const expiredListeners = new Set<() => void>();

export const session = {
  get token() {
    return accessToken;
  },
  set(token: string | null) {
    accessToken = token;
  },
  /** Called when the session can no longer be refreshed (logged out elsewhere, expired). */
  onExpired(listener: () => void) {
    expiredListeners.add(listener);
    return () => void expiredListeners.delete(listener);
  },
};

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  const code = (value as ApiErrorBody | null)?.error?.code;
  return typeof code === 'string' && (ERROR_CODES as readonly string[]).includes(code);
}

async function rawFetch<T>(path: string, init: RequestInit, token: string | null): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

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

/** Set by the API next to the refresh cookie; holds no secret (see apps/api cookies.ts). */
export function hasSessionHint(): boolean {
  return document.cookie.split('; ').some((cookie) => cookie.startsWith('progress_session='));
}

let refreshing: Promise<AuthResponse> | null = null;

/** Exchanges the refresh cookie for a new access token. Parallel callers share one request. */
export function refreshSession(): Promise<AuthResponse> {
  refreshing ??= rawFetch<AuthResponse>('/auth/refresh', { method: 'POST' }, null)
    .then((result) => {
      session.set(result.accessToken);
      return result;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = session.token;
  try {
    return await rawFetch<T>(path, init, token);
  } catch (error) {
    const expired =
      error instanceof ApiError && error.status === 401 && token && !path.startsWith('/auth/');
    if (!expired) throw error;
  }

  // The access token expired: refresh once, then retry the original request.
  try {
    await refreshSession();
  } catch {
    session.set(null);
    expiredListeners.forEach((listener) => listener());
    throw new ApiError('UNAUTHORIZED', 'Session expired', 401);
  }
  return rawFetch<T>(path, init, session.token);
}

export const json = (body: unknown): RequestInit['body'] => JSON.stringify(body);
