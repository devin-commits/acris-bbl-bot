import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.test.ts', '**/*.spec.ts'],
    exclude: ['**/e2e/**', '**/dist/**', '**/node_modules/**'],
    passWithNoTests: true,
    testTimeout: 15000,
    hookTimeout: 10000,
    pool: 'threads',
    poolOptions: { threads: { minThreads: 1, maxThreads: 1 } }, // <-- fix
  },
});
