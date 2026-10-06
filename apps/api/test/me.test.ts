import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { db, refreshCookie, registerUser, resetDb, testApp, validUser } from './helpers';

const app = testApp();
const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

beforeEach(resetDb);
afterAll(() => db.$disconnect());

describe('GET /me', () => {
  it('returns the signed-in user only', async () => {
    const a = await registerUser(app);
    await registerUser(app, { email: 'other@example.com', firstName: 'Nino' });
    const res = await request(app).get('/api/v1/me').set(auth(a.accessToken));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ email: validUser.email, firstName: 'Giorgi' });
  });
});

describe('PATCH /me', () => {
  it('updates profile, theme, language and week start', async () => {
    const { accessToken } = await registerUser(app);
    const res = await request(app).patch('/api/v1/me').set(auth(accessToken)).send({
      firstName: ' Nino ',
      avatar: 'leaf',
      theme: 'DARK',
      locale: 'en',
      weekStart: 7,
      timezone: 'Europe/London',
    });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      firstName: 'Nino',
      avatar: 'leaf',
      theme: 'DARK',
      locale: 'en',
      weekStart: 7,
      timezone: 'Europe/London',
    });
    const again = await request(app).get('/api/v1/me').set(auth(accessToken));
    expect(again.body.theme).toBe('DARK');
  });

  it('rejects invalid or empty updates and read-only fields', async () => {
    const { accessToken } = await registerUser(app);
    for (const body of [{}, { weekStart: 2 }, { email: 'x@y.ge' }, { theme: 'PINK' }]) {
      const res = await request(app).patch('/api/v1/me').set(auth(accessToken)).send(body);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    }
  });
});

describe('PUT /me/password', () => {
  it('changes the password, keeps this session and ends the others', async () => {
    const first = await registerUser(app);
    const other = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: validUser.email, password: validUser.password });
    const otherCookie = refreshCookie(other)!;

    const res = await request(app)
      .put('/api/v1/me/password')
      .set(auth(first.accessToken))
      .set('Cookie', first.cookie)
      .send({ currentPassword: validUser.password, newPassword: 'brandnew42' });
    expect(res.status).toBe(204);

    expect(
      (await request(app).post('/api/v1/auth/refresh').set('Cookie', first.cookie)).status,
    ).toBe(200);
    expect(
      (await request(app).post('/api/v1/auth/refresh').set('Cookie', otherCookie)).status,
    ).toBe(401);

    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: validUser.email, password: 'brandnew42' });
    expect(login.status).toBe(200);
  });

  it('refuses a wrong current password with a field error', async () => {
    const { accessToken } = await registerUser(app);
    const res = await request(app)
      .put('/api/v1/me/password')
      .set(auth(accessToken))
      .send({ currentPassword: 'wrongpass1', newPassword: 'brandnew42' });
    expect(res.status).toBe(400);
    expect(res.body.error.details.fieldErrors).toEqual({ currentPassword: ['password.wrong'] });
  });
});

describe('DELETE /me', () => {
  it('deletes the account and everything in it after password confirmation', async () => {
    const { accessToken, user } = await registerUser(app);
    await db.mission.create({
      data: {
        userId: user.id,
        title: 'M',
        startDate: new Date('2026-10-01'),
        endDate: new Date('2026-10-30'),
      },
    });

    const res = await request(app)
      .delete('/api/v1/me')
      .set(auth(accessToken))
      .send({ password: validUser.password });
    expect(res.status).toBe(204);
    expect(String(res.headers['set-cookie'])).toMatch(/progress_rt=;/);
    expect(await db.user.count()).toBe(0);
    expect(await db.mission.count()).toBe(0);
    expect(await db.refreshToken.count()).toBe(0);
  });

  it('keeps the account when the password is wrong', async () => {
    const { accessToken } = await registerUser(app);
    const res = await request(app)
      .delete('/api/v1/me')
      .set(auth(accessToken))
      .send({ password: 'wrongpass1' });
    expect(res.status).toBe(400);
    expect(res.body.error.details.fieldErrors).toEqual({ password: ['password.wrong'] });
    expect(await db.user.count()).toBe(1);
  });
});
