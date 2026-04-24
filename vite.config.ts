// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference types='vitest/config' />
import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@core': path.resolve(__dirname, 'src/core'),
      '@adapters': path.resolve(__dirname, 'src/adapters'),
      '@store': path.resolve(__dirname, 'src/store'),
    },
  },
  test: {
    environment: 'node',
    // @ts-expect-error — property not yet in Vitest v4 types, but valid in upcoming versions
    environmentMatchGlobs: [
      ['tests/**/*.dom.test.ts', 'jsdom'],
      ['tests/**/*.test.ts', 'node'],
    ],
  },
});
