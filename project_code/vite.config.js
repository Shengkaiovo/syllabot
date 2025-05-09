import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  optimizeDeps: {
    include: ['@google/generative-ai']
  }
}) 