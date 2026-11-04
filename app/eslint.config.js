import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
    ],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // react-hooks v7 added the React Compiler-powered rules to its
      // recommended preset. Each flag needs a behavior-preserving refactor
      // (~10 components), so they start as warnings and get fixed
      // incrementally.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/use-memo': 'warn',
      'react-hooks/incompatible-library': 'warn',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // The codebase deliberately uses `any` in catch handlers and API
      // responses (see AGENTS.md: noImplicitAny is disabled on purpose).
      '@typescript-eslint/no-explicit-any': 'off',
      // Unused catch parameters are common in `catch (e: any) { toast(...) }`
      // handlers; flaging them adds noise without catching real issues.
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrors: 'none',
      }],
      // `!!value` truthiness coercion of nullable values is an established
      // pattern in this codebase.
      'no-extra-boolean-cast': 'off',
      // Regexes in the song/text parsing libs keep "unnecessary" escapes for
      // readability of character classes.
      'no-useless-escape': 'off',
      // Empty interfaces are used as named aliases of merged theme configs.
      '@typescript-eslint/no-empty-object-type': ['error', {
        allowInterfaces: 'with-single-extends',
      }],
    },
  },
)
