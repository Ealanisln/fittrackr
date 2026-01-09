import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    name: 'api',
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['src/**/*.integration.test.ts'],
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      include: ['src/**/*.ts'],
      exclude: ['src/__tests__/**', 'src/**/*.test.ts'],
    },
  },
  resolve: {
    alias: {
      '@fittrack/database': path.resolve(__dirname, '../../packages/database/src'),
      '@fittrack/types': path.resolve(__dirname, '../../packages/types/src'),
    },
  },
});
