import type { Config } from '@jest/types';
import { pathsToModuleNameMapper } from 'ts-jest';
import tsconfig from '../tsconfig.spec.json' with { type: 'json' };

const moduleNameMapper = pathsToModuleNameMapper(
  tsconfig.compilerOptions.paths,
  {
    prefix: '<rootDir>/',
  },
);

const config: Config.InitialOptions = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '../.',
  testRegex: '.spec.ts$',
  moduleNameMapper,
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      { tsconfig: '<rootDir>/tsconfig.spec.json', isolatedModules: true },
    ],
  },
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
};

export default config;
