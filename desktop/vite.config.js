import { defineConfig } from 'vite';

export default defineConfig({
  // Tauri expects a fixed port in dev
  server: {
    port: 1420,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
