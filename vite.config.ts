import { defineConfig } from 'vite-plus';

// Vite+ reads lint and fmt settings only from the workspace root. Only app/ is
// on Vite+ so far; api/ keeps its own ESLint + Prettier setup.
export default defineConfig({
  fmt: {
    singleQuote: true,
    ignorePatterns: ['/*', '!/app'],
  },
  lint: {
    ignorePatterns: ['/*', '!/app', '**/dist/**'],
    plugins: ['eslint', 'typescript', 'unicorn', 'oxc', 'react'],
    jsPlugins: [{ name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' }],
    options: { typeAware: true, typeCheck: true },
    env: { browser: true },
    rules: {
      'vite-plus/prefer-vite-plus-imports': 'error',
      'react/rules-of-hooks': 'error',
      'react/exhaustive-deps': 'warn',
      // React Compiler rules. Each flag needs a behavior-preserving refactor,
      // so they start as warnings and get fixed incrementally.
      'react/set-state-in-effect': 'warn',
      'react/refs': 'warn',
      'react/immutability': 'warn',
      'react/preserve-manual-memoization': 'warn',
      'react/use-memo': 'warn',
      'react/incompatible-library': 'warn',
      'react/only-export-components': ['warn', { allowConstantExport: true }],
      // The codebase deliberately uses `any` in catch handlers and API
      // responses (noImplicitAny is disabled on purpose).
      'typescript/no-explicit-any': 'off',
      'no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
      // `!!value` truthiness coercion of nullable values is an established pattern.
      'no-extra-boolean-cast': 'off',
      // Regexes in the song/text parsing libs keep "unnecessary" escapes for
      // readability of character classes.
      'no-useless-escape': 'off',
      // Empty interfaces are used as named aliases of merged theme configs.
      'typescript/no-empty-object-type': ['error', { allowInterfaces: 'with-single-extends' }],
      'unicorn/prefer-node-protocol': 'error',
      'typescript/prefer-regexp-exec': 'error',
    },
  },
});
