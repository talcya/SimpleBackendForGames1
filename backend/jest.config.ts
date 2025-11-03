export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup/global.js'],
  // Run JS tests only to avoid ts-jest transform issues during initial CI runs
  testMatch: ['**/tests/**/*.spec.js'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
};
