import { defineConfig } from 'vitest/config';

const TEST_DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://progress:progress@localhost:5432/progress_test';

// Never run tests against a database whose name does not say "test": they truncate tables.
if (!/test/i.test(new URL(TEST_DATABASE_URL).pathname)) {
  throw new Error(`Refusing to run tests against non-test database: ${TEST_DATABASE_URL}`);
}
process.env.TEST_DATABASE_URL = TEST_DATABASE_URL;

export default defineConfig({
  test: {
    environment: 'node',
    // Test files share one database, so they run one after another.
    fileParallelism: false,
    globalSetup: ['test/global-setup.ts'],
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: TEST_DATABASE_URL,
    },
  },
});
