/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'nemo-icon.svg'],
      manifest: {
        name: 'Nemo',
        short_name: 'nemo.',
        description: 'Track it, finish it. A refined, offline-first personal workspace.',
        theme_color: '#0A1222',
        background_color: '#0A1222',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'nemo-icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'nemo-icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
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
    css: false
  }
});
