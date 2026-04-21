module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  setupFilesAfterFramework: ['./src/__tests__/setup.js'],
  testTimeout: 30000,
};
