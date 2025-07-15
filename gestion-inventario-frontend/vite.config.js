import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  // ──────────────────────────────────────────────
  // Ajustes de servidor SOLO para npm run dev
  server: {
    port: 5173,
    proxy: {
      // Redirige TODAS las llamadas /api/* hacia el backend
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});