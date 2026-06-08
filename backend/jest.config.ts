import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  rootDir: './src',
  setupFilesAfterEnv: ["<rootDir>/__tests__/shared/prisma/Singleton.ts"],
  transformIgnorePatterns: [
    "node_modules/(?!uuid)" // Transforma los módulos ES de `uuid`
  ],
  transform: {
    "^.+\\.tsx?$": "ts-jest", // Transforma TypeScript
    "^.+\\.js$": "babel-jest", // Transforma JavaScript (incluyendo ES Modules)
  },
  moduleNameMapper: {
    "^uuid$": require.resolve('uuid'),
  }
};

export default config;