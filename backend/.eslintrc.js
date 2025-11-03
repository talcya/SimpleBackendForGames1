module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    // avoid enabling type-aware rules that require a TS project to prevent issues with mixed .js files
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'import'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:import/recommended', 'prettier'],
  env: { node: true, jest: true },
  rules: {
    'no-console': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-var-requires': 'off',
    'import/no-unresolved': 'off',
  },
  settings: {
    'import/resolver': {
      typescript: {},
      node: { extensions: ['.js', '.ts', '.json'] },
    },
  },
};
