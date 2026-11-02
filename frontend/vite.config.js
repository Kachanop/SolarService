import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/SolarService/',
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
