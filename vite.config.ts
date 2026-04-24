/// <reference types="vitest/config" />
import path from 'path';
import { defineConfig } from 'vite';

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
    globals: true,
    environment: 'node',
  },
});
