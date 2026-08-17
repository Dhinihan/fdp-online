// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference types='vitest/config' />
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Service Worker gerado pelo Workbox. `registerType: 'prompt'` com
  // `skipWaiting`/`clientsClaim` desligados e sem importar `virtual:pwa-register`
  // em `src/`: a versão nova instala, fica em espera e só assume numa abertura
  // posterior, sem prompt e sem recarga forçada no meio de uma Partida.
  // Nada de `scope`, `base` ou `swDest` aqui — herdar de `vite.base` é o que faz
  // a mesma config servir `/` (Vercel) e `/fdp-online/` (GitHub Pages).
  plugins: [
    VitePWA({
      strategies: 'generateSW',
      registerType: 'prompt',
      injectRegister: 'auto',
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,mp3}'],
        skipWaiting: false,
        clientsClaim: false,
        navigateFallback: 'index.html',
        ignoreURLParametersMatching: [/^debug$/],
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@core': path.resolve(__dirname, 'src/core'),
      '@adapters': path.resolve(__dirname, 'src/adapters'),
      '@store': path.resolve(__dirname, 'src/store'),
    },
  },
  test: {
    exclude: ['**/node_modules/**', '**/dist/**', 'tests/e2e/**', '.pi/**'],
    environment: 'node',
    // @ts-expect-error — property not yet in Vitest v4 types, but valid in upcoming versions
    environmentMatchGlobs: [
      ['tests/**/*.dom.test.ts', 'jsdom'],
      ['tests/**/*.test.ts', 'node'],
    ],
  },
});
