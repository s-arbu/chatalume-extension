import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(import.meta.dirname, 'popup.html'),
        toolbar: resolve(import.meta.dirname, 'toolbar.html'),
        background: resolve(import.meta.dirname, 'src/background/background.ts')
      },
      output: {
        entryFileNames: '[name].js'
      }
    }
  }
});
