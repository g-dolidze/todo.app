import type { CookieOptions, Response } from 'express';
import { REFRESH_TOKEN_TTL_SECONDS } from '../../lib/tokens';

export const REFRESH_COOKIE = 'progress_rt';

const options = (secure: boolean): CookieOptions => ({
  httpOnly: true,
  secure,
  sameSite: 'strict',
  path: '/api/v1/auth',
});

export function setRefreshCookie(res: Response, token: string, secure: boolean) {
  res.cookie(REFRESH_COOKIE, token, {
    ...options(secure),
    maxAge: REFRESH_TOKEN_TTL_SECONDS * 1000,
  });
}

export function clearRefreshCookie(res: Response, secure: boolean) {
  res.clearCookie(REFRESH_COOKIE, options(secure));
}

export function readRefreshCookie(cookies: unknown): string | undefined {
  const value = (cookies as Record<string, unknown> | undefined)?.[REFRESH_COOKIE];
  return typeof value === 'string' && value ? value : undefined;
}
