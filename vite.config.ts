import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173, // Explicitly set default port
    proxy: {
      '/api': {
        target: 'https://api.coingecko.com/api/v3',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.error('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('User-Agent', 'CryptoTracker/1.0');
            // Optional: Add CoinGecko API key if you have one
            // proxyReq.setHeader('x-cg-api-key', import.meta.env.VITE_COINGECKO_API_KEY);
          });
          proxy.on('proxyRes', (proxyRes) => {
            console.log('Proxy response:', proxyRes.statusCode, proxyRes.statusMessage);
          });
        },
      },
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
      },
    },
    sourcemap: true, // Enable sourcemaps for easier debugging
    minify: 'esbuild', // Use esbuild for faster minification
    target: 'esnext', // Target modern browsers
  },
  publicDir: 'public', // Keep public directory for static assets
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`, // Optional: Global SCSS variables
      },
    },
  },
  optimizeDeps: {
    include: ['vue', 'vue-router', 'vuetify', 'pinia', 'axios', 'chart.js'], // Pre-bundle key dependencies
  },
});
