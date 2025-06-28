module.exports = {
  setupFilesAfterEnv: ['./test-utils/jest.setup.ts'],
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/__tests__'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/security.bun.test.ts',
    '/__tests__/api.bun.test.ts',
    '\.bun\.test\.ts$'
  ],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json',
      useESM: false
    }]
  },
};

