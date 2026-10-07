import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { AppError } from './lib/errors';
import type { Db } from './lib/prisma';
import { errorHandler, notFound } from './middleware/errorHandler';
import { requireAuth } from './middleware/requireAuth';
import { authRoutes } from './modules/auth/auth.routes';
import { AuthService } from './modules/auth/auth.service';
import { healthRoutes } from './modules/health/health.routes';
import { meRoutes } from './modules/users/me.routes';

export interface AppDeps {
  db: Db;
  corsOrigins: string[];
  jwtSecret: string;
  /** true in production (HTTPS). */
  secureCookies: boolean;
  /** Disabled in most tests. */
  rateLimit: boolean;
}

function limiter(limit: number) {
  return rateLimit({
    windowMs: 60_000,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, _res, next) =>
      next(new AppError('RATE_LIMITED', 'Too many requests, please try again shortly')),
  });
}

export function createApp({
  db,
  corsOrigins,
  jwtSecret,
  secureCookies,
  rateLimit,
}: AppDeps): Express {
  const app = express();
  const auth = new AuthService(db, jwtSecret);
  const authenticated = requireAuth(db, jwtSecret);

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({ origin: corsOrigins, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  const api = express.Router();
  if (rateLimit) {
    api.use('/auth', limiter(10));
    api.use(limiter(300));
  }
  api.use('/health', healthRoutes(db));
  api.use('/auth', authRoutes(auth, secureCookies));
  api.use('/me', authenticated, meRoutes(db, auth, secureCookies));
  app.use('/api/v1', api);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
