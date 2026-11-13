import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: process.env.CF_WORKERS_BUILD === '1' ? '/' : '/SolarService/',
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
