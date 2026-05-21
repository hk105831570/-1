import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// Vercel 部署时 base 为 '/'，阿里云 Nginx 代理时为 '/training/'
const base = process.env.VERCEL ? '/' : (process.env.VITE_BASE_URL || '/training/')

export default defineConfig({
  base,
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
