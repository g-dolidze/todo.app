import type { CookieOptions, Response } from 'express';
import { REFRESH_TOKEN_TTL_SECONDS } from '../../lib/tokens';

export const REFRESH_COOKIE = 'progress_rt';
/**
 * Readable by the web app and contains no secret. It only tells the app "a session may
 * exist", so guests never make a refresh request that is bound to fail (TDD §13).
 */
export const SESSION_HINT_COOKIE = 'progress_session';

const refreshOptions = (secure: boolean): CookieOptions => ({
  httpOnly: true,
  secure,
  sameSite: 'strict',
  path: '/api/v1/auth',
});

const hintOptions = (secure: boolean): CookieOptions => ({
  httpOnly: false,
  secure,
  sameSite: 'strict',
  path: '/',
});

export function setRefreshCookie(res: Response, token: string, secure: boolean) {
  const maxAge = REFRESH_TOKEN_TTL_SECONDS * 1000;
  res.cookie(REFRESH_COOKIE, token, { ...refreshOptions(secure), maxAge });
  res.cookie(SESSION_HINT_COOKIE, '1', { ...hintOptions(secure), maxAge });
}

export function clearRefreshCookie(res: Response, secure: boolean) {
  res.clearCookie(REFRESH_COOKIE, refreshOptions(secure));
  res.clearCookie(SESSION_HINT_COOKIE, hintOptions(secure));
}

export function readRefreshCookie(cookies: unknown): string | undefined {
  const value = (cookies as Record<string, unknown> | undefined)?.[REFRESH_COOKIE];
  return typeof value === 'string' && value ? value : undefined;
}
