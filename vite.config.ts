/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const configuredOrigin = loadEnv(mode, process.cwd(), 'VITE_').VITE_PUBLIC_ORIGIN?.trim();
  let origin: string | undefined;
  if (configuredOrigin) {
    const url = new URL(configuredOrigin);
    if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash || /^(localhost|127\.|\[::1\])/.test(url.hostname)) {
      throw new Error('VITE_PUBLIC_ORIGIN must be a public HTTPS origin without a path, credentials, query or fragment.');
    }
    origin = url.origin;
  }
  return {
  plugins: [
    react(),
    {
      name: 'nemo-social-origin',
      transformIndexHtml(html) {
        if (!origin) return html;
        return html.replaceAll('content="/brand/nemo-og.png"', `content="${origin}/brand/nemo-og.png"`);
      },
    },
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'favicon.png', 'apple-touch-icon.png', 'nemo-icon.svg', 'fonts/*.woff2'],
      manifest: {
        name: 'Nemo',
        short_name: 'nemo.',
        description: 'Track it, finish it. A refined, offline-first personal workspace.',
        theme_color: '#0A1222',
        background_color: '#0A1222',
        display: 'standalone',
        orientation: 'any',
        id: '/',
        start_url: '/overview',
        scope: '/',
        icons: [
          {
            src: '/nemo-icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/nemo-icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/nemo-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        globIgnores: ['**/brand/nemo-og*.png']
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    css: false,
    exclude: ['**/node_modules/**', '**/dist/**', 'tests/e2e/**'],
  }
  };
});
