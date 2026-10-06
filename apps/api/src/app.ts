import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import type { Db } from './lib/prisma';
import { errorHandler, notFound } from './middleware/errorHandler';
import { healthRoutes } from './modules/health/health.routes';

export interface AppDeps {
  db: Db;
  corsOrigins: string[];
}

export function createApp({ db, corsOrigins }: AppDeps): Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({ origin: corsOrigins, credentials: true }));
  app.use(express.json({ limit: '1mb' }));

  const api = express.Router();
  api.use('/health', healthRoutes(db));
  app.use('/api/v1', api);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
