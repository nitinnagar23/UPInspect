// Flat config with no extra dependencies (only `eslint` itself).
const browser = {
  window: 'readonly', document: 'readonly', navigator: 'readonly', location: 'readonly',
  history: 'readonly', localStorage: 'readonly', console: 'readonly', setTimeout: 'readonly',
  clearTimeout: 'readonly', fetch: 'readonly', URL: 'readonly', Image: 'readonly',
  Blob: 'readonly', File: 'readonly', Node: 'readonly', Response: 'readonly',
};

const rules = {
  'no-undef': 'error',
  'no-unused-vars': ['warn', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
  'no-var': 'error',
  'prefer-const': 'warn',
  eqeqeq: ['error', 'always'],
  'no-implicit-globals': 'error',
};

export default [
  { ignores: ['node_modules/**', 'vendor/**'] },
  {
    files: ['js/**/*.js'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: browser },
    rules,
  },
  {
    files: ['sw.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'script',
      globals: { self: 'readonly', caches: 'readonly', fetch: 'readonly', URL: 'readonly', Response: 'readonly', setTimeout: 'readonly' },
    },
    rules,
  },
  {
    files: ['tests/**/*.js', 'scripts/**/*.mjs', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { process: 'readonly', console: 'readonly', fetch: 'readonly', URL: 'readonly', Buffer: 'readonly', setTimeout: 'readonly' },
    },
    rules,
  },
];
