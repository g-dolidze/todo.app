import { LoginSchema, RegisterSchema } from '@progress/shared';
import { Router, type Response } from 'express';
import { validateBody } from '../../middleware/validate';
import type { AuthService, Session } from './auth.service';
import { clearRefreshCookie, readRefreshCookie, setRefreshCookie } from './cookies';

export function authRoutes(auth: AuthService, secureCookies: boolean): Router {
  const router = Router();

  const send = (res: Response, session: Session, status = 200) => {
    setRefreshCookie(res, session.refreshToken, secureCookies);
    res.status(status).json({ accessToken: session.accessToken, user: session.user });
  };

  router.post('/register', validateBody(RegisterSchema), async (req, res) => {
    send(res, await auth.register(req.body), 201);
  });

  router.post('/login', validateBody(LoginSchema), async (req, res) => {
    send(res, await auth.login(req.body));
  });

  router.post('/refresh', async (req, res) => {
    try {
      const session = await auth.refresh(readRefreshCookie(req.cookies));
      setRefreshCookie(res, session.refreshToken, secureCookies);
      res.json({ accessToken: session.accessToken, user: session.user });
    } catch (error) {
      clearRefreshCookie(res, secureCookies);
      throw error;
    }
  });

  router.post('/logout', async (req, res) => {
    await auth.logout(readRefreshCookie(req.cookies));
    clearRefreshCookie(res, secureCookies);
    res.status(204).end();
  });

  return router;
}
