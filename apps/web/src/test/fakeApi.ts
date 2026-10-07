import type { UserDto } from '@progress/shared';
import { vi } from 'vitest';
import { session } from '../api/client';

/**
 * A tiny in-memory stand-in for the API, so component tests exercise the real client,
 * auth provider and forms. It mimics the contract in TDD §10.
 */
export function installFakeApi() {
  const users = new Map<string, UserDto & { password: string }>();
  let cookieUser: string | null = null;
  let tokenSeq = 0;
  const tokens = new Map<string, string>();
  const calls: { method: string; path: string; body: unknown }[] = [];

  const respond = (status: number, body?: unknown) =>
    new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  const fail = (status: number, code: string, details?: unknown) =>
    respond(status, { error: { code, message: code, ...(details ? { details } : {}) } });
  const issue = (user: UserDto) => {
    const accessToken = `token-${++tokenSeq}`;
    tokens.set(accessToken, user.email);
    cookieUser = user.email;
    setHint(true);
    const { password: _password, ...dto } = users.get(user.email)!;
    return { accessToken, user: dto };
  };
  const publicUser = (email: string) => {
    const { password: _password, ...dto } = users.get(email)!;
    return dto;
  };

  function setHint(present: boolean) {
    document.cookie = present
      ? 'progress_session=1; path=/'
      : 'progress_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }
  setHint(false);

  function addUser(data: Partial<UserDto> & { email: string; password: string }) {
    const user = {
      id: `id-${users.size + 1}`,
      firstName: 'Giorgi',
      lastName: 'Dolidze',
      avatar: null,
      timezone: 'Asia/Tbilisi',
      locale: 'ka' as const,
      theme: 'SYSTEM' as const,
      weekStart: 1 as const,
      createdAt: '2026-10-06T10:00:00.000Z',
      ...data,
    };
    users.set(user.email, user);
    return user;
  }

  const fetchMock = vi.fn(async (url: string, init: RequestInit = {}) => {
    const path = url.replace('/api/v1', '');
    const method = init.method ?? 'GET';
    const body = init.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ method, path, body });
    const bearer = new Headers(init.headers).get('Authorization')?.replace('Bearer ', '');
    const me = bearer ? tokens.get(bearer) : undefined;

    switch (`${method} ${path}`) {
      case 'POST /auth/refresh':
        if (cookieUser) return respond(200, issue(publicUser(cookieUser)));
        setHint(false);
        return fail(401, 'UNAUTHORIZED');
      case 'POST /auth/login': {
        const user = users.get(body.email.trim().toLowerCase());
        if (!user || user.password !== body.password) return fail(401, 'UNAUTHORIZED');
        return respond(200, issue(user));
      }
      case 'POST /auth/register': {
        if (users.has(body.email)) return fail(409, 'EMAIL_TAKEN');
        const user = addUser({ ...body, theme: body.theme ?? 'SYSTEM' });
        return respond(201, issue(user));
      }
      case 'POST /auth/logout':
        cookieUser = null;
        setHint(false);
        return respond(204);
    }

    if (!me) return fail(401, 'UNAUTHORIZED');
    switch (`${method} ${path}`) {
      case 'GET /me':
        return respond(200, publicUser(me));
      case 'PATCH /me':
        users.set(me, { ...users.get(me)!, ...body });
        return respond(200, publicUser(me));
      case 'PUT /me/password':
        if (users.get(me)!.password !== body.currentPassword) {
          return fail(400, 'VALIDATION_ERROR', {
            fieldErrors: { currentPassword: ['password.wrong'] },
          });
        }
        users.get(me)!.password = body.newPassword;
        return respond(204);
      case 'DELETE /me':
        if (users.get(me)!.password !== body.password) {
          return fail(400, 'VALIDATION_ERROR', { fieldErrors: { password: ['password.wrong'] } });
        }
        users.delete(me);
        cookieUser = null;
        setHint(false);
        return respond(204);
    }
    return fail(404, 'NOT_FOUND');
  });

  vi.stubGlobal('fetch', fetchMock);
  session.set(null);

  return {
    calls,
    addUser,
    users,
    /** Pretend the browser already has a valid refresh cookie for this user. */
    signInWithCookie(email: string) {
      cookieUser = email;
      setHint(true);
    },
    /** Invalidate every token, as if the session was revoked on the server. */
    revokeAll() {
      tokens.clear();
      cookieUser = null;
    },
  };
}
