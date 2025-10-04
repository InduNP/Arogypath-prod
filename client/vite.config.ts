import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://arogypath-prod-production.up.railway.app', // ❌ removed trailing slash
        changeOrigin: true,  // ✅ spoof origin header
        secure: true,        // ✅ keep HTTPS strict (set false only for self-signed certs)
      },
    },
  },
})
