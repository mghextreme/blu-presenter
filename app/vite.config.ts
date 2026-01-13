import path from "path"
import { defineConfig, preview } from 'vite'
import react from '@vitejs/plugin-react'
import i18nextLoader from 'vite-plugin-i18next-loader'

import { cloudflare } from "@cloudflare/vite-plugin";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({}),
    i18nextLoader({
      paths: ['./locales'],
      namespaceResolution: 'basename',
    }),
    ...(process.env.NODE_ENV === 'production' ? [cloudflare()] : []),
  ],
  envDir: '../',
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libraries - most frequently used, cache separately
          'vendor-react': [
            'react',
            'react-dom',
            'react-router-dom',
          ],
          
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
          'vendor-data': [
            '@tanstack/react-query',
            '@tanstack/react-table',
            '@tanstack/match-sorter-utils',
            'zustand',
          ],
          
          // Real-time communication - used by controller
          'vendor-socket': [
            'socket.io-client',
          ],
          
          // Internationalization - used across all pages
          'vendor-i18n': [
            'i18next',
            'react-i18next',
            'i18next-browser-languagedetector',
            'i18next-localstorage-cache',
          ],
          
          // Forms and validation - heavy usage in edit pages
          'vendor-forms': [
            'react-hook-form',
            '@hookform/resolvers',
            'zod',
          ],
          
          // Drag and drop - controller specific functionality
          'vendor-dnd': [
            '@dnd-kit/core',
            '@dnd-kit/modifiers',
            '@dnd-kit/sortable',
            '@dnd-kit/utilities',
          ],
          
          // Supabase - authentication and data layer
          'vendor-supabase': [
            '@supabase/supabase-js',
          ],
          
          // UI utilities and icons
          'vendor-ui-utils': [
            '@heroicons/react',
            'lucide-react',
            'sonner',
            'next-themes',
            'react-qr-code',
            'react-resizable-panels',
            'react-hotkeys-hook',
            'cmdk',
          ],
        },
      },
    },
  },
})
