module.exports = {
  moduleFileExtensions: ['ts', 'js', 'vue', 'json'],
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transformIgnorePatterns: ['/node_modules/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^~/(.*)$': '<rootDir>/$1',
    '\\.(css|scss|sass)$': 'jest-transform-stub'
  },
  transform: {
    '^.+\\.ts$': 'ts-jest',
    '^.+\\.vue$': 'vue-jest'
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
}
