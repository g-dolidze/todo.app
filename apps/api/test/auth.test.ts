import { SignJWT } from 'jose';
import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import {
  db,
  JWT_SECRET,
  refreshCookie,
  registerUser,
  resetDb,
  testApp,
  validUser,
} from './helpers';

const app = testApp();

beforeEach(resetDb);
afterAll(() => db.$disconnect());

describe('POST /auth/register', () => {
  it('creates the account, logs in and never returns the password hash', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...validUser, email: 'Giorgi@Example.com' });

    expect(res.status).toBe(201);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({
      email: 'giorgi@example.com',
      firstName: 'Giorgi',
      lastName: 'Dolidze',
      timezone: 'Asia/Tbilisi',
      locale: 'ka',
      theme: 'SYSTEM',
      weekStart: 1,
      avatar: null,
    });
    expect(JSON.stringify(res.body)).not.toMatch(/password/i);

    const stored = await db.user.findUniqueOrThrow({ where: { email: 'giorgi@example.com' } });
    expect(stored.passwordHash).toMatch(/^\$argon2id\$/);
  });

  it('sets a secure-by-default refresh cookie limited to the auth path', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(validUser);
    const cookie = ([] as string[]).concat(res.headers['set-cookie'] ?? []).join(';');
    expect(cookie).toMatch(/progress_rt=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Strict/i);
    expect(cookie).toMatch(/Path=\/api\/v1\/auth/i);
    expect(cookie).toMatch(/Max-Age=2592000/i);
  });

  it('marks the cookie Secure in production', async () => {
    const res = await request(testApp({ secureCookies: true }))
      .post('/api/v1/auth/register')
      .send(validUser);
    expect(String(res.headers['set-cookie'])).toMatch(/Secure/);
  });

  it('rejects an email that is already used, in any letter case', async () => {
    await registerUser(app);
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...validUser, email: 'GIORGI@example.com' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('returns field errors for invalid input', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...validUser, password: 'short', email: 'nope' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.fieldErrors).toMatchObject({
      email: ['email.invalid'],
      // "short" breaks two rules; the form shows the first one.
      password: ['password.tooShort', 'password.digit'],
    });
  });
});

describe('POST /auth/login', () => {
  it('logs in with the right password', async () => {
    await registerUser(app);
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: ' GIORGI@example.com', password: validUser.password });
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('giorgi@example.com');
    expect(refreshCookie(res)).toBeDefined();
  });

  it('gives the same generic error for a wrong password and an unknown email', async () => {
    await registerUser(app);
    const wrong = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: validUser.email, password: 'wrongpass1' });
    const unknown = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@example.com', password: 'wrongpass1' });

    for (const res of [wrong, unknown]) {
      expect(res.status).toBe(401);
      expect(res.body.error).toEqual({
        code: 'UNAUTHORIZED',
        message: 'Invalid email or password',
      });
    }
  });
});

describe('POST /auth/refresh', () => {
  it('issues a new access token and rotates the refresh cookie', async () => {
    const { cookie } = await registerUser(app);
    const res = await request(app).post('/api/v1/auth/refresh').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
    const next = refreshCookie(res);
    expect(next).toBeDefined();
    expect(next).not.toBe(cookie);
  });

  it('detects reuse of an old token and logs out every session', async () => {
    const { cookie: first } = await registerUser(app);
    const rotated = refreshCookie(
      await request(app).post('/api/v1/auth/refresh').set('Cookie', first),
    )!;

    const reuse = await request(app).post('/api/v1/auth/refresh').set('Cookie', first);
    expect(reuse.status).toBe(401);

    // The thief's reuse also kills the legitimate, newer session.
    const afterReuse = await request(app).post('/api/v1/auth/refresh').set('Cookie', rotated);
    expect(afterReuse.status).toBe(401);
  });

  it('rejects a missing, unknown or expired token', async () => {
    expect((await request(app).post('/api/v1/auth/refresh')).status).toBe(401);
    expect(
      (await request(app).post('/api/v1/auth/refresh').set('Cookie', 'progress_rt=made-up')).status,
    ).toBe(401);

    const { cookie } = await registerUser(app);
    await db.refreshToken.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });
    expect((await request(app).post('/api/v1/auth/refresh').set('Cookie', cookie)).status).toBe(
      401,
    );
  });
});

describe('POST /auth/logout', () => {
  it('revokes the session and clears the cookie', async () => {
    const { cookie } = await registerUser(app);
    const res = await request(app).post('/api/v1/auth/logout').set('Cookie', cookie);
    expect(res.status).toBe(204);
    expect(String(res.headers['set-cookie'])).toMatch(/progress_rt=;/);
    expect((await request(app).post('/api/v1/auth/refresh').set('Cookie', cookie)).status).toBe(
      401,
    );
  });

  it('succeeds even without a cookie', async () => {
    expect((await request(app).post('/api/v1/auth/logout')).status).toBe(204);
  });
});

describe('access tokens', () => {
  it('rejects requests without a valid bearer token', async () => {
    expect((await request(app).get('/api/v1/me')).status).toBe(401);
    expect(
      (await request(app).get('/api/v1/me').set('Authorization', 'Bearer not-a-jwt')).status,
    ).toBe(401);
  });

  it('rejects an expired token and a token signed with another key', async () => {
    const { user } = await registerUser(app);
    const sign = (secret: string, exp: number) =>
      new SignJWT({})
        .setProtectedHeader({ alg: 'HS256' })
        .setSubject(user.id)
        .setIssuedAt()
        .setExpirationTime(exp)
        .sign(new TextEncoder().encode(secret));

    const expired = await sign(JWT_SECRET, Math.floor(Date.now() / 1000) - 10);
    const forged = await sign(
      'another-secret-that-is-also-long-enough',
      Math.floor(Date.now() / 1000) + 600,
    );
    for (const token of [expired, forged]) {
      expect(
        (await request(app).get('/api/v1/me').set('Authorization', `Bearer ${token}`)).status,
      ).toBe(401);
    }
  });

  it('rejects the token of a deleted user', async () => {
    const { accessToken } = await registerUser(app);
    await resetDb();
    expect(
      (await request(app).get('/api/v1/me').set('Authorization', `Bearer ${accessToken}`)).status,
    ).toBe(401);
  });
});

describe('rate limiting (TDD §13)', () => {
  it('allows 10 auth requests per minute per IP, then answers 429', async () => {
    const limited = testApp({ rateLimit: true });
    for (let i = 0; i < 10; i++) {
      await request(limited).post('/api/v1/auth/login').send({ email: 'a@b.ge', password: 'x' });
    }
    const res = await request(limited)
      .post('/api/v1/auth/login')
      .send({ email: 'a@b.ge', password: 'x' });
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('RATE_LIMITED');
  });
});
