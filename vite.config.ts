import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { compilerOptions as baseCompilerOptions } from 'vue3-pixi/compiler'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/vue3-pixijs-demo/' : '/',
  build: {
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/[hash].js',
        entryFileNames: 'assets/[hash].js',
        assetFileNames: 'assets/[hash].[ext]',
      },
    },
  },
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) =>
            ['glow-circle', 'slot-reel'].includes(tag) || baseCompilerOptions.isCustomElement(tag),
        },
      },
    }),
  ],
})
