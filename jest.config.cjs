module.exports = {
  projects: [
    {
      displayName: 'backend',
      rootDir: '<rootDir>/kom-backend/kom-backend',
      moduleFileExtensions: ['js', 'json', 'ts'],
      testRegex: '.*\\.spec\\.ts$',
      transform: {
        '^.+\\.(t|j)s$': '<rootDir>/node_modules/ts-jest',
      },
      collectCoverageFrom: ['**/*.(t|j)s'],
      coverageDirectory: '<rootDir>/coverage',
      testEnvironment: 'node',
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^expo-server-sdk$': '<rootDir>/test/mocks/expo-server-sdk.ts',
      },
    },
  ],
};