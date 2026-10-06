import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch, session } from './client';

function mockFetch(response: Response | Error) {
  const fn = vi.fn((_url: string, _init?: RequestInit) =>
    response instanceof Error ? Promise.reject(response) : Promise.resolve(response),
  );
  vi.stubGlobal('fetch', fn);
  return fn;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('apiFetch', () => {
  it('returns parsed JSON and sends cookies to /api/v1', async () => {
    const fetch = mockFetch(json({ status: 'ok' }));
    await expect(apiFetch('/health')).resolves.toEqual({ status: 'ok' });
    expect(fetch).toHaveBeenCalledWith(
      '/api/v1/health',
      expect.objectContaining({ credentials: 'include' }),
    );
  });

  it('sets JSON content type when there is a body', async () => {
    const fetch = mockFetch(json({}));
    await apiFetch('/x', { method: 'POST', body: '{}' });
    const init = fetch.mock.calls[0]![1]!;
    expect(new Headers(init.headers).get('Content-Type')).toBe('application/json');
  });

  it('returns undefined for 204', async () => {
    mockFetch(new Response(null, { status: 204 }));
    await expect(apiFetch('/x')).resolves.toBeUndefined();
  });

  it('turns the API error format into ApiError', async () => {
    mockFetch(json({ error: { code: 'NOT_DUE', message: 'not due' } }, 422));
    await expect(apiFetch('/x')).rejects.toMatchObject({
      name: 'ApiError',
      code: 'NOT_DUE',
      status: 422,
    });
  });

  it('reports unexpected responses as INTERNAL_ERROR', async () => {
    mockFetch(new Response('<html>Bad gateway</html>', { status: 502 }));
    await expect(apiFetch('/x')).rejects.toMatchObject({ code: 'INTERNAL_ERROR', status: 502 });
  });

  it('reports network failures as NETWORK', async () => {
    mockFetch(new TypeError('Failed to fetch'));
    const error = await apiFetch('/x').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ code: 'NETWORK', status: 0 });
  });
});

describe('session refresh (TDD §11.3)', () => {
  const user = { id: 'u1' };

  afterEach(() => {
    session.set(null);
  });

  it('sends the in-memory access token', async () => {
    session.set('token-1');
    const fetch = mockFetch(json({}));
    await apiFetch('/me');
    expect(new Headers(fetch.mock.calls[0]![1]!.headers).get('Authorization')).toBe(
      'Bearer token-1',
    );
  });

  it('refreshes an expired token once and retries the request', async () => {
    session.set('old');
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(json({ error: { code: 'UNAUTHORIZED', message: 'x' } }, 401))
      .mockResolvedValueOnce(json({ accessToken: 'new', user }))
      .mockResolvedValueOnce(json({ ok: true }));
    vi.stubGlobal('fetch', fetch);

    await expect(apiFetch('/me')).resolves.toEqual({ ok: true });
    expect(fetch.mock.calls.map((call) => call[0])).toEqual([
      '/api/v1/me',
      '/api/v1/auth/refresh',
      '/api/v1/me',
    ]);
    expect(new Headers(fetch.mock.calls[2]![1].headers).get('Authorization')).toBe('Bearer new');
    expect(session.token).toBe('new');
  });

  it('shares one refresh between parallel requests', async () => {
    session.set('old');
    const fetch = vi.fn((url: string, init: RequestInit) => {
      if (url.endsWith('/auth/refresh')) return Promise.resolve(json({ accessToken: 'new', user }));
      const auth = new Headers(init.headers).get('Authorization');
      return Promise.resolve(
        auth === 'Bearer new'
          ? json({ ok: true })
          : json({ error: { code: 'UNAUTHORIZED', message: 'x' } }, 401),
      );
    });
    vi.stubGlobal('fetch', fetch);

    await Promise.all([apiFetch('/a'), apiFetch('/b'), apiFetch('/c')]);
    expect(fetch.mock.calls.filter((call) => call[0].endsWith('/auth/refresh'))).toHaveLength(1);
  });

  it('ends the session when the refresh fails', async () => {
    session.set('old');
    const onExpired = vi.fn();
    const stop = session.onExpired(onExpired);
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(json({ error: { code: 'UNAUTHORIZED', message: 'x' } }, 401))),
    );

    await expect(apiFetch('/me')).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    expect(session.token).toBeNull();
    expect(onExpired).toHaveBeenCalledOnce();
    stop();
  });

  it('does not try to refresh for guests or for auth endpoints', async () => {
    const fetch = mockFetch(json({ error: { code: 'UNAUTHORIZED', message: 'x' } }, 401));
    await expect(apiFetch('/me')).rejects.toMatchObject({ status: 401 });
    session.set('t');
    await expect(apiFetch('/auth/login', { method: 'POST' })).rejects.toMatchObject({
      status: 401,
    });
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});

describe('ApiError.fieldErrors', () => {
  it('exposes validation field errors', () => {
    const error = new ApiError('VALIDATION_ERROR', 'x', 400, {
      fieldErrors: { email: ['email.invalid'] },
    });
    expect(error.fieldErrors).toEqual({ email: ['email.invalid'] });
    expect(new ApiError('NETWORK', 'x', 0).fieldErrors).toEqual({});
  });
});
