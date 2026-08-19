const { createSwcOptions } = require('./swc.config');

// Тесты идут в node (testEnvironment: 'node'), поэтому цель выше, чем у браузерного бандла.
const swcOptions = createSwcOptions({ syntax: 'typescript', target: 'es2022' });

module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/*.spec.[jt]s?(x)'],
  transform: {
    '^.+\\.[jt]sx?$': ['@swc/jest', swcOptions],
  },
  moduleNameMapper: {
    '\\.(css|scss|sass)$': '<rootDir>/test/styleMock.js',
  },
  testPathIgnorePatterns: ['/node_modules/', '/build/', '/prebuild/'],
};
