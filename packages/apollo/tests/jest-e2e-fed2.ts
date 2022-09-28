import type { Config } from '@jest/types';
import { pathsToModuleNameMapper } from 'ts-jest';
import { compilerOptions } from '../tsconfig.spec.json';

const moduleNameMapper = pathsToModuleNameMapper(compilerOptions.paths, {
  prefix: '<rootDir>/',
});

const config: Config.InitialOptions = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '../.',
  testRegex: '.fed2-spec.ts$',
  moduleNameMapper: {
    ...moduleNameMapper,
    '^@apollo/subgraph$': '<rootDir>/../../node_modules/@apollo/subgraph-v2',
    '^@apollo/subgraph/(.*)$':
      '<rootDir>/../../node_modules/@apollo/subgraph-v2/$1',
    '^@apollo/gateway$': '<rootDir>/../../node_modules/@apollo/gateway-v2',
    '^@apollo/gateway/(.*)$':
      '<rootDir>/../../node_modules/@apollo/gateway-v2/$1',
    '^graphql$': '<rootDir>/../../node_modules/graphql-16',
    '^graphql/(.*)$': '<rootDir>/../../node_modules/graphql-16/$1',
  },
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
};

export default config;
