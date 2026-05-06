import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@nestjs\/graphql(\/.*)?$/,
        replacement: path.resolve(import.meta.dirname, '../graphql/lib') + '$1',
      },
      {
        find: 'graphql',
        replacement: path.resolve(
          import.meta.dirname,
          '../../node_modules/graphql/index.js',
        ),
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
