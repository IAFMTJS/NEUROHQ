import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    target: 'esnext',
    minify: false,
    sourcemap: true,
    rollupOptions: {
      input: 'index.html',
    },
  },
  server: {
    port: 5174,
  },
  resolve: {
    alias: {
      '@engine': '/src/engine',
      '@scene': '/src/scene',
    },
  },
});
