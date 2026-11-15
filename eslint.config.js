import eslint from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';
import globals from 'globals';

const typeScriptFiles = [
  'src/**/*.{ts,tsx}',
  'tests/**/*.ts',
  'vite.config.ts',
  'playwright.config.ts',
];

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'public/**',
      'design/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'novel/**',
    ],
  },
  {
    files: typeScriptFiles,
    extends: [eslint.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      // Compiler-oriented rules in the plugin's recommended preset are a
      // separate migration. These two checks match the hooks already in use.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      // Callback signatures keep unused text arguments and mark them with `_`.
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
    },
  },
);
