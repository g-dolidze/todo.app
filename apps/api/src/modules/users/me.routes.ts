import {
  ChangePasswordSchema,
  DeleteMeSchema,
  UpdateMeSchema,
  type UpdateMeInput,
} from '@progress/shared';
import { Router } from 'express';
import { AppError } from '../../lib/errors';
import { hashPassword, verifyPassword } from '../../lib/password';
import type { Db } from '../../lib/prisma';
import { currentUserId } from '../../middleware/requireAuth';
import { validateBody } from '../../middleware/validate';
import type { AuthService } from '../auth/auth.service';
import { clearRefreshCookie, readRefreshCookie } from '../auth/cookies';
import { toUserDto } from './user.dto';

const wrongPassword = (field: string) =>
  new AppError('VALIDATION_ERROR', 'Password is incorrect', {
    formErrors: [],
    fieldErrors: { [field]: ['password.wrong'] },
  });

export function meRoutes(db: Db, auth: AuthService, secureCookies: boolean): Router {
  const router = Router();

  router.get('/', async (req, res) => {
    const user = await db.user.findUniqueOrThrow({ where: { id: currentUserId(req) } });
    res.json(toUserDto(user));
  });

  router.patch('/', validateBody(UpdateMeSchema), async (req, res) => {
    const { locale, ...rest } = req.body as UpdateMeInput;
    const user = await db.user.update({
      where: { id: currentUserId(req) },
      data: { ...rest, ...(locale ? { locale: locale === 'en' ? 'EN' : 'KA' } : {}) },
    });
    res.json(toUserDto(user));
  });

  router.put('/password', validateBody(ChangePasswordSchema), async (req, res) => {
    const userId = currentUserId(req);
    const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
    if (!(await verifyPassword(user.passwordHash, req.body.currentPassword))) {
      throw wrongPassword('currentPassword');
    }
    await db.user.update({
      where: { id: userId },
      data: { passwordHash: await hashPassword(req.body.newPassword) },
    });
    // Sign out every other device; keep the one that made this change.
    await auth.revokeAll(userId, readRefreshCookie(req.cookies));
    res.status(204).end();
  });

  router.delete('/', validateBody(DeleteMeSchema), async (req, res) => {
    const userId = currentUserId(req);
    const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
    if (!(await verifyPassword(user.passwordHash, req.body.password))) {
      throw wrongPassword('password');
    }
    await db.user.delete({ where: { id: userId } }); // cascades to all user data
    clearRefreshCookie(res, secureCookies);
    res.status(204).end();
  });

  return router;
}
