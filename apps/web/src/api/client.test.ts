import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch } from './client';

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
