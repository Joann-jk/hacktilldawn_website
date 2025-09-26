import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      external: (id) => {
        // Exclude API files from the build
        return id.includes('/api/')
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      // Proxy API requests to the local server
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
