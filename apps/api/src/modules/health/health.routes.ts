import { Router } from 'express';
import type { Db } from '../../lib/prisma';

export function healthRoutes(db: Db): Router {
  const router = Router();

  router.get('/', async (_req, res) => {
    try {
      await db.$queryRaw`SELECT 1`;
      res.json({ status: 'ok', db: 'ok' });
    } catch {
      res.status(503).json({ status: 'degraded', db: 'down' });
    }
  });

  return router;
}
