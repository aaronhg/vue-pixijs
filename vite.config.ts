import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { compilerOptions as baseCompilerOptions } from 'vue3-pixi/compiler'

// https://vite.dev/config/
export default defineConfig({
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
