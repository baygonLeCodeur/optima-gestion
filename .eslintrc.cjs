module.exports = {
  root: true,
  extends: ['next', 'next/core-web-vitals', 'eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    // Disallow explicit any
  '@typescript-eslint/no-explicit-any': ['warn'],
    // Allow unknown casting when necessary
    '@typescript-eslint/ban-ts-comment': ['warn'],
  },
};
