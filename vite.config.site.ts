import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig({
  plugins: [wasm(), topLevelAwait()],
  root: resolve(import.meta.dirname),
  base: '/wasabi-table/',
  build: {
    outDir: 'site',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        demo: resolve(import.meta.dirname, 'examples/npm-package/index.html'),
        benchmark: resolve(import.meta.dirname, 'examples/npm-package/benchmark.html'),
      },
    },
  },
  assetsInclude: ['**/*.wasm'],
});
