import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import { routePreload } from './build/routePreload';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Keep in sync with the lazy routes in src/routes.tsx.
    routePreload({
      '/login': '/src/pages/LoginPage.tsx',
      '/register': '/src/pages/RegisterPage.tsx',
      '/profile': '/src/pages/ProfilePage.tsx',
      '/habits': '/src/pages/SectionPage.tsx',
      '/missions': '/src/pages/SectionPage.tsx',
      '/calendar': '/src/pages/SectionPage.tsx',
      '/analytics': '/src/pages/SectionPage.tsx',
    }),
  ],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:4000' },
  },
  preview: {
    port: 4173,
    proxy: { '/api': 'http://localhost:4000' },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
  },
});
