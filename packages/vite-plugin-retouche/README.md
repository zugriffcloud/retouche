# vite-plugin-retouche

An experimental CMS for your Vite application. Annotate, Build, Edit.  
See https://retouche.zugriff.eu for more information.

## Usage

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import retouche from 'vite-plugin-retouche';

export default defineConfig({
  plugins: [retouche() /*, anyOtherPlugin() */],
});
```
