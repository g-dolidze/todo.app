import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/dist',
      '**/coverage',
      '**/node_modules',
      'apps/api/src/generated',
      '**/playwright-report',
      '**/test-results',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
    },
  },
  {
    files: ['apps/api/**/*.ts', '**/*.config.{js,ts}', '**/scripts/**'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['apps/web/src/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        {
          allowExportNames: [
            'NAV_ITEMS',
            'AVATAR_ICON_NAMES',
            'initials',
            'buttonClass',
            'inputClass',
            'useTheme',
            'useAuth',
            'useToast',
            'useErrorText',
          ],
        },
      ],
      // Design tokens only (TDD §12): no raw hex colors in class names.
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/(bg|text|border|stroke|fill|from|to|ring)-\\[#/]',
          message: 'Use a design token (e.g. bg-surface) instead of a raw color.',
        },
        {
          selector: 'TemplateElement[value.raw=/(bg|text|border|stroke|fill|from|to|ring)-\\[#/]',
          message: 'Use a design token (e.g. bg-surface) instead of a raw color.',
        },
      ],
    },
  },
);
