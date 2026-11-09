import { defineConfig } from 'vite';
import { resolve } from 'node:path';
const page = (n) => resolve(import.meta.dirname, n);
export default defineConfig({
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 800, // three.js alone is ~600 kB (about 170 kB gzipped)
    rollupOptions: {
      input: { home: page('index.html'), replay: page('replay.html'), explore: page('explore.html'), lab: page('lab.html') },
      output: { manualChunks: (id) => (id.includes('node_modules/three') ? 'three' : undefined) },
    },
  },
  server: { port: 5173, proxy: { '/api': { target: 'http://localhost:8787', changeOrigin: true } } },
});
