import { describe, expect, it } from 'vitest';
import { loadEnv } from '../src/lib/env';

describe('loadEnv', () => {
  it('applies defaults and splits CORS origins', () => {
    const env = loadEnv({
      DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
      CORS_ORIGIN: 'http://a.test, http://b.test',
      JWT_SECRET: 'x'.repeat(32),
    });
    expect(env.PORT).toBe(4000);
    expect(env.CORS_ORIGIN).toEqual(['http://a.test', 'http://b.test']);
  });

  it('fails fast with a readable message when DATABASE_URL is missing', () => {
    expect(() => loadEnv({})).toThrow(/DATABASE_URL/);
  });

  it('requires a long JWT secret', () => {
    expect(() =>
      loadEnv({ DATABASE_URL: 'postgresql://u:p@localhost:5432/db', JWT_SECRET: 'short' }),
    ).toThrow(/JWT_SECRET: must be at least 32 characters/);
  });
});
