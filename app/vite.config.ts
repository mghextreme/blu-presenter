import path from 'node:path';
import { defineConfig, lazyPlugins } from 'vite-plus';
import react from '@vitejs/plugin-react';
import i18nextLoader from 'vite-plugin-i18next-loader';
import { VitePWA } from 'vite-plugin-pwa';

import { cloudflare } from '@cloudflare/vite-plugin';

const vendorChunks: Record<string, string[]> = {
  // Core React libraries - most frequently used, cache separately
  'vendor-react': ['react', 'react-dom', 'react-router'],

  // UI component library - Radix UI components used throughout the app
  'vendor-radix': [
    '@radix-ui/react-accordion',
    '@radix-ui/react-alert-dialog',
    '@radix-ui/react-checkbox',
    '@radix-ui/react-collapsible',
    '@radix-ui/react-dialog',
    '@radix-ui/react-dropdown-menu',
    '@radix-ui/react-icons',
    '@radix-ui/react-label',
    '@radix-ui/react-popover',
    '@radix-ui/react-select',
    '@radix-ui/react-slot',
    '@radix-ui/react-switch',
    '@radix-ui/react-tabs',
    '@radix-ui/react-toast',
    '@radix-ui/react-toggle',
  ],

  // Data fetching and state management
  'vendor-data': ['@tanstack/react-query', 'zustand'],

  // Real-time communication - used by controller
  'vendor-socket': ['socket.io-client'],

  // Internationalization - used across all pages
  'vendor-i18n': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],

  // Forms and validation - heavy usage in edit pages
  'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],

  // Drag and drop - controller specific functionality
  'vendor-dnd': ['@dnd-kit/core', '@dnd-kit/modifiers', '@dnd-kit/sortable', '@dnd-kit/utilities'],

  // UI utilities and icons
  'vendor-ui-utils': [
    '@heroicons/react',
    'lucide-react',
    'sonner',
    'next-themes',
    'react-qr-code',
    'react-hotkeys-hook',
    'cmdk',
  ],
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: lazyPlugins(() => [
    react({}),
    i18nextLoader({
      paths: ['./locales'],
      namespaceResolution: 'basename',
    }),
    VitePWA({
      // Prompt-based updates: never hot-swap the service worker while a
      // presentation is running. PwaManager shows a banner offering a reload.
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'images/sample-wallpaper.svg'],
      manifest: {
        name: 'BluPresenter',
        short_name: 'BluPresenter',
        description: 'Present lyrics, share music sheets... Anywhere. Anytime.',
        start_url: '/',
        display: 'standalone',
        background_color: '#030d26',
        theme_color: '#030d26',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/maskable-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Precache the app shell. Fonts (~3.5 MB of variable WOFF2) are NOT
        // precached — they are runtime-cached CacheFirst on first use below,
        // which keeps the initial install small while still rendering
        // presentations offline after one online session.
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: /\.woff2$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'font-assets',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
    ...(process.env.NODE_ENV === 'production' ? [cloudflare()] : []),
  ]),
  envDir: '../',
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // React Router 8 is ESM-only; when Node loads it outside Vitest's module
    // graph, `vi.mock('react-router')` stops reaching the app's imports.
    server: { deps: { inline: ['react-router'] } },
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/', '**/*.d.ts', '**/*.config.*', '**/mockData', 'dist/'],
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: Object.entries(vendorChunks).map(([name, packages]) => ({
            name,
            test: (id: string) => packages.some((pkg) => id.includes(`node_modules/${pkg}/`)),
          })),
        },
      },
    },
  },
});
