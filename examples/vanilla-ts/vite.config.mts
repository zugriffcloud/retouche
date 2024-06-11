import * as path from 'node:path';
import * as url from 'node:url';
import { defineConfig } from 'vite';
import retouche from 'vite-plugin-retouche';

export default defineConfig({
  plugins: [
    retouche({
      // required as this example lives in a monorepo
      root: path.resolve(url.fileURLToPath(import.meta.url), '../../..'),
    }),
  ],
});
