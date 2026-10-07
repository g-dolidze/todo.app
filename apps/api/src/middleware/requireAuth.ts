import type { RequestHandler } from 'express';
import { AppError } from '../lib/errors';
import type { Db } from '../lib/prisma';
import { verifyAccessToken } from '../lib/tokens';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- Express's own extension point
  namespace Express {
    interface Request {
      /** Set by requireAuth. Every query must be scoped by it (TDD §13). */
      userId?: string;
    }
  }
}

export function requireAuth(db: Db, jwtSecret: string): RequestHandler {
  return async (req, _res, next) => {
    const header = req.get('authorization') ?? '';
    const [scheme, token] = header.split(' ');
    const userId = scheme === 'Bearer' && token ? await verifyAccessToken(token, jwtSecret) : null;

    // A token can outlive its user (account deleted), so check the user still exists.
    const exists = userId && (await db.user.count({ where: { id: userId } })) > 0;
    if (!exists) throw new AppError('UNAUTHORIZED', 'Authentication required');

    req.userId = userId;
    next();
  };
}

/** For handlers behind requireAuth. */
export function currentUserId(req: { userId?: string }): string {
  if (!req.userId) throw new AppError('UNAUTHORIZED', 'Authentication required');
  return req.userId;
}
