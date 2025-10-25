import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        // メインプロセス
        entry: 'src/main/main.ts',
        onstart(options) {
          options.startup()
        },
        vite: {
          build: {
            outDir: 'dist/main',
            rollupOptions: {
              external: ['electron']
            }
          }
        }
      },
      {
        // Preloadスクリプト
        entry: 'src/preload/preload.ts',
        onstart(options) {
          options.reload()
        },
        vite: {
          build: {
            outDir: 'dist/preload',
            rollupOptions: {
              external: ['electron']
            }
          }
        }
      }
    ])
  ],
  server: {
    port: 5174
  },
  build: {
    outDir: 'dist/renderer'
  }
})

