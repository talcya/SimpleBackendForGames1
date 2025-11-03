export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup/global.js'],
  // Create a per-run test DB and drop it at teardown
  globalSetup: '<rootDir>/tests/setup/global-setup.js',
  globalTeardown: '<rootDir>/tests/setup/global-teardown.js',
  // Match both JS and TS tests so converted specs run under ts-jest
  testMatch: ['**/tests/**/*.spec.js', '**/tests/**/*.spec.ts'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json',
    },
  },
};
