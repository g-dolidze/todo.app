import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e-stories',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? 'github' : 'list',
  use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:6007' },
  webServer: {
    command: 'pnpm exec vite preview --outDir storybook-static --port 6007 --strictPort',
    url: 'http://localhost:6007/index.json',
    reuseExistingServer: false,
  },
});
