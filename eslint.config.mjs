import { defineConfig, globalIgnores } from 'eslint/config';

import globals from 'globals';

import js from '@eslint/js';
import ts from 'typescript-eslint';

import prettier from 'eslint-plugin-prettier';

import jest from 'eslint-plugin-jest';

export default defineConfig([
  globalIgnores(['node_modules', 'coverage', 'dist']),
  js.configs.recommended,
  ts.configs.recommended,
  {
    plugins: {
      prettier,
    },
    rules: {
      ...prettier.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-unsafe-enum-comparison': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/unbound-method': 'off',
    },
  },
  {
    files: ['**/*.{spec,test}.ts'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    ...jest.configs.recommended,
  },
]);
