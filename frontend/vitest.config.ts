import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  },
  resolve: {
    extensions: [".ts", ".tsx", ".astro", ".js", ".jsx"],
  }
});