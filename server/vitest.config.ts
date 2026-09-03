import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    /* Integration tests share one database, so they run in a single process.
       Parallel files would truncate each other's rows mid-assertion. */
    fileParallelism: false,
    globals: true,
    include: ['tests/**/*.test.ts'],
    setupFiles: ['./tests/setup.ts'],
    hookTimeout: 60_000,
    testTimeout: 30_000,
  },
})
