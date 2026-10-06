// Lighthouse CI (TDD §14.6): runs against the production build served by `vite preview`.
// Chrome comes from Playwright, so it is the same browser everywhere.
const { chromium } = require('playwright-core');

module.exports = {
  ci: {
    collect: {
      startServerCommand: 'pnpm preview --strictPort',
      startServerReadyPattern: 'localhost:4173',
      url: [
        'http://localhost:4173/',
        'http://localhost:4173/login',
        'http://localhost:4173/register',
        'http://localhost:4173/profile',
      ],
      numberOfRuns: 3,
      chromePath: chromium.executablePath(),
      // Default Lighthouse profile: a mid-range phone on a slow 4G network (TDD §14.6).
      settings: {
        chromeFlags: '--no-sandbox --headless=new',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.95, aggregationMethod: 'median-run' }],
        'categories:accessibility': ['error', { minScore: 0.95, aggregationMethod: 'median-run' }],
        'categories:best-practices': ['error', { minScore: 0.95, aggregationMethod: 'median-run' }],
        'categories:seo': ['error', { minScore: 0.95, aggregationMethod: 'median-run' }],
        // Core Web Vitals targets from TDD §14.6 (INP needs real users; TBT is its lab proxy).
        'largest-contentful-paint': [
          'error',
          { maxNumericValue: 2500, aggregationMethod: 'median-run' },
        ],
        'cumulative-layout-shift': [
          'error',
          { maxNumericValue: 0.1, aggregationMethod: 'median-run' },
        ],
        'total-blocking-time': ['error', { maxNumericValue: 200, aggregationMethod: 'median-run' }],
      },
    },
    upload: { target: 'filesystem', outputDir: '.lighthouseci/reports' },
  },
};
