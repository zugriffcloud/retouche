import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  build: {
    sourcemap: true,
    target: 'esnext',
    minify: true,
    lib: {
      entry: resolve(__dirname, 'lib/index.ts'),
      name: 'retouche',
      fileName: (format, entryName) => `${entryName}.${format}.js`,
    },
    rollupOptions: {
      external: ['vite', 'node:process', 'node:fs', 'node:path'],
    },
  },
  plugins: [
    tsconfigPaths(),
    dts({
      rollupTypes: true,
    }),
    svelte({ emitCss: false }),
  ],
});
