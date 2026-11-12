import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import unicorn from 'eslint-plugin-unicorn';
import regexp from 'eslint-plugin-regexp';

export default [
  {
    ignores: ['dist', 'node_modules', 'coverage'],
  },
  {
    files: ['{src,test}/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: 'tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      unicorn,
      regexp,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'off',
      // Unused catch parameters are common in `catch (e) { ... }` handlers;
      // flaging them adds noise without catching real issues. Underscore-
      // prefixed parameters are intentionally unused.
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrors: 'none',
      }],
      // Node built-ins must be imported with the explicit `node:` protocol
      // (e.g. `node:crypto`).
      'unicorn/prefer-node-protocol': 'error',
      // Capture-group extraction uses `RegExp.exec()`, not `String.match()`.
      'regexp/prefer-regexp-exec': 'error',
    },
  },
  prettierRecommended,
];
