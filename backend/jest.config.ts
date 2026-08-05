import type { Config } from 'jest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  rootDir: './src',
  setupFilesAfterEnv: ["<rootDir>/__tests__/shared/prisma/Singleton.ts"],
  transformIgnorePatterns: [
    "node_modules/(?!.*uuid)"
  ],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
    "^.+\\.js$": "babel-jest",
  },
  moduleNameMapper: {},
};

export default config;