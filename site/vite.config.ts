import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    port: 5173,
    host: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:8080',
        changeOrigin: false,
        // Vite's proxy rewrites the Host header to match the target by
        // default, which breaks the backend's Origin/Host CSRF check when
        // frontend + backend run as separate dev processes behind a public
        // preview domain. Re-attach the original Host (and Origin) the
        // browser actually sent so the backend sees a same-origin request.
        configure(proxy) {
          proxy.on('proxyReq', (proxyReq, req) => {
            if (req.headers.host) proxyReq.setHeader('host', req.headers.host);
          });
        },
      },
    },
  },
})
