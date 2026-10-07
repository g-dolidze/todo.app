import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/domain/**', 'src/schemas/**'],
      exclude: ['src/**/*.test.ts'],
      thresholds: { lines: 95, functions: 95, branches: 95, statements: 95 },
    },
  },
});
