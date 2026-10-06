import { defineConfig, devices } from '@playwright/test';

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const E2E_DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://progress:progress@localhost:5432/progress_test';

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    { name: 'mobile', use: { ...devices['Pixel 7'], viewport: { width: 320, height: 720 } } },
  ],
  webServer: [
    {
      // Real API against the test database (rate limits off: every test signs in).
      command:
        'pnpm --filter @progress/api exec prisma migrate deploy && pnpm --filter @progress/api build && node ../api/dist/server.js',
      url: 'http://localhost:4000/api/v1/health',
      env: {
        NODE_ENV: 'test',
        PORT: '4000',
        DATABASE_URL: E2E_DATABASE_URL,
        JWT_SECRET: 'e2e-secret-that-is-at-least-32-characters-long',
        CORS_ORIGIN: 'http://localhost:4173',
      },
      // Always test a fresh build: reusing a running server can silently test stale code.
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: 'pnpm build && pnpm preview --strictPort',
      url: 'http://localhost:4173',
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
