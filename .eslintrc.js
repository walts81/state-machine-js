module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  rules: {
    '@typescript-eslint/explicit-member-accessibility': [
      'error',
      {
        accessibility: 'no-public',
        overrides: {
          constructors: 'off',
        },
      },
    ],
    '@typescript-eslint/no-explicit-any': 'off',
    'array-type': 'off',
    'arrow-parens': 'off',
    'interface-name': 'off',
    'max-classes-per-file': 'off',
    'no-console': 'off',
    'no-empty': 'off',
    'no-extra-boolean-cast': 'off',
    'no-namespace': 'off',
    'no-unused-expression': 'off',
    'object-literal-sort-keys': 'off',
    'only-arrow-functions': 'off',
    'ordered-imports': 'off',
    quotes: ['error', 'single', { allowTemplateLiterals: true }],
    'comma-dangle': [
      'error',
      {
        objects: 'always-multiline',
        arrays: 'always-multiline',
        imports: 'always-multiline',
        exports: 'always-multiline',
        functions: 'never',
      },
    ],
    eqeqeq: ['error', 'smart'],
    'no-underscore-dangle': ['error', { allowAfterThis: true }],
  },
  ignorePatterns: ['src/**/*.spec.ts', 'src/**/*.spec.js'],
};
