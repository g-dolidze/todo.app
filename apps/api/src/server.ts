import { createApp } from './app';
import { loadEnv } from './lib/env';
import { createPrisma } from './lib/prisma';

const env = loadEnv();
const db = createPrisma(env.DATABASE_URL);
const app = createApp({ db, corsOrigins: env.CORS_ORIGIN });

const server = app.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}/api/v1`);
});

async function shutdown() {
  server.close();
  await db.$disconnect();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
