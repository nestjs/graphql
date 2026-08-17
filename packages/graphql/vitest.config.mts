import { createRequire } from 'node:module';
import { defineConfig } from 'vitest/config';

// Resolve `graphql` the way Node resolves it for the CommonJS dependencies the
// tests exercise, so both ends share a single instance. graphql v16 resolves to
// its CommonJS entry point, while v17 exposes its ESM one to `require` through
// the `module-sync` condition.
const graphqlEntryPoint = createRequire(import.meta.url).resolve('graphql');

export default defineConfig({
  resolve: {
    alias: [
      {
        find: 'graphql',
        replacement: graphqlEntryPoint,
      },
    ],
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.spec.ts'],
    root: '.',
    testTimeout: 30000,
  },
});
