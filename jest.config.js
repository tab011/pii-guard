module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'encrypted/**/*.js',
    'basic/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**',
  ],
  verbose: true,
  testTimeout: 30000,
};
