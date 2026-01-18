import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '../../.',
  testRegex: 'global-setup-issue\\.e2e-spec\\.ts$',
  moduleNameMapper: {
    '^@nestjs/graphql$': '<rootDir>/../graphql/lib',
    '^@nestjs/graphql/(.*)$': '<rootDir>/../graphql/lib/$1',
  },
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      { tsconfig: '<rootDir>/tsconfig.spec.json', isolatedModules: true },
    ],
  },
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  globalSetup: '<rootDir>/tests/global-setup-issue/global-setup.ts',
};

export default config;
