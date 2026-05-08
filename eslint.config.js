import { defineConfig } from 'eslint/config';
import importPlugin from 'eslint-plugin-import';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import * as ts from 'typescript-eslint';

export default defineConfig(
  {
    ignores: ['dist/**', 'node_modules/**', 'public/**', 'coverage/**', '.pi/**', '.sandcastle/worktrees/**'],
  },
  ts.configs.strictTypeChecked,
  {
    files: ['eslint.config.js'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-deprecated': 'off',
    },
  },
  {
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            '*.config.js',
            'tests/*.test.ts',
            'tests/core/*.test.ts',
            'tests/core/*.ts',
            'tests/adapters/*.test.ts',
            'tests/e2e/*.spec.ts',
          ],
          maximumDefaultProjectFileMatchCount_THIS_WILL_SLOW_DOWN_LINTING: 32,
          noWarnOnMultipleProjects: true,
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['*.config.{ts,js}', '.sandcastle/**/*.ts', 'tests/**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.typescript,
  {
    settings: {
      'import/resolver': {
        typescript: {
          project: ['./tsconfig.json', './tsconfig.tests.json', './.sandcastle/tsconfig.json'],
        },
      },
    },
    rules: {
      complexity: ['error', 10],
      'max-lines': ['error', { max: 200, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['error', { max: 30, skipBlankLines: true, skipComments: true }],
      'max-params': ['error', 3],
      'no-console': 'warn',
      eqeqeq: 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'never',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
    },
  },
  {
    files: ['.sandcastle/**/*.ts'],
    rules: {
      'no-console': 'off',
    },
  },
  prettierRecommended,
);
