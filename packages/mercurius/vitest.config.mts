import { createRequire } from 'node:module';
import path from 'path';
import { defineConfig } from 'vitest/config';

// Resolve `graphql` the way Node resolves it for the CommonJS dependencies the
// tests exercise, so both ends share a single instance. graphql v16 resolves to
// its CommonJS entry point, while v17 exposes its ESM one to `require` through
// the `module-sync` condition.
const graphqlEntryPoint = createRequire(
  path.join(__dirname, 'vitest.config.mts'),
).resolve('graphql');

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@nestjs\/graphql(\/.*)?$/,
        replacement: path.resolve(__dirname, '../graphql/lib') + '$1',
      },
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
    pool: 'forks',
  },
});
