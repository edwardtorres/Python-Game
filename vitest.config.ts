import { defineConfig } from 'vitest/config';

export default defineConfig({
  define: {
    __TEST_HOOKS__: 'true',
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Pyodide runs in-process under Node for the grader tests. The first load
    // takes a few seconds, so give each test room.
    testTimeout: 120_000,
    hookTimeout: 120_000,
  },
});
