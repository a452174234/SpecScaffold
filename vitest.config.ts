import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['backend/tests/**/*.test.ts'],
    setupFiles: ['backend/tests/setup.ts'],
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
  },
});
