import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/traffic-light-simulation/',
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    port: 5173,
    open: true,
  },
});
