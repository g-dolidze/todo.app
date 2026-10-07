import type { Express } from 'express';
import request from 'supertest';
import { createApp, type AppDeps } from '../src/app';
import { createPrisma } from '../src/lib/prisma';

export const db = createPrisma(process.env.DATABASE_URL!);

export const JWT_SECRET = 'test-secret-that-is-long-enough-for-hs256-signing';

export function testApp(overrides: Partial<AppDeps> = {}): Express {
  return createApp({
    db,
    corsOrigins: ['http://localhost:5173'],
    jwtSecret: JWT_SECRET,
    secureCookies: false,
    rateLimit: false,
    ...overrides,
  });
}

export async function resetDb() {
  await db.$executeRawUnsafe('TRUNCATE "user" CASCADE');
}

export const validUser = {
  firstName: 'Giorgi',
  lastName: 'Dolidze',
  email: 'giorgi@example.com',
  password: 'secret123',
  timezone: 'Asia/Tbilisi',
  locale: 'ka',
} as const;

/** Value of the refresh cookie from a response, e.g. `progress_rt=abc`. */
export function refreshCookie(res: request.Response): string | undefined {
  const cookies = ([] as string[]).concat(res.headers['set-cookie'] ?? []);
  return cookies.find((cookie) => cookie.startsWith('progress_rt='))?.split(';')[0];
}

export async function registerUser(
  app: Express,
  data: Partial<Record<keyof typeof validUser, string>> = {},
) {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ ...validUser, ...data });
  if (res.status !== 201)
    throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
  return {
    accessToken: res.body.accessToken as string,
    cookie: refreshCookie(res)!,
    user: res.body.user,
  };
}
