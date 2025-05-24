import path from "path"
import { defineConfig } from 'vite'
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
    cloudflare(),
  ],
  envDir: '../',
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
})
