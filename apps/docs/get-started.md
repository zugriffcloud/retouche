# Get Started

## Overview

Retouche (French for "touch-up", a slight correction or adjustment) is an experimental CMS for your Vite application.

## Integration

::: code-group

```bash [PNPM]
$ pnpm i -D vite-plugin-retouche
$ pnpm i retouche @retouche/adapter-github
```

```bash [NPM]
$ npm install --save-dev vite-plugin-retouche
$ npm install retouche @retouche/adapter-github
```

### Plugin

:::

After installing all dependencies, add the Vite-Retouche-Plugin to your configuration file.

```ts
// vite.config.ts

import { defineConfig } from 'vite';

import retouche from 'vite-plugin-retouche';

export default defineConfig({
  plugins: [retouche() /*, anyOtherPlugin() */],
});
```

### Editor

Call the Retouche initialisation function within a shared client layout file (e.g. `+layout.svelte`) if possible.  
The editor will only mount if the `edit` key is in the query string.

::: info
Depending on the adapter, you will have to create an access token to use Git over HTTPS. Please only use GitHub fine-grained access tokens or privileged (e.g. "Maintainer" role) GitLab Project Access Tokens with API read and write access.
:::

::: code-group

```ts [GitHub]
// main.ts

import { init } from 'retouche';
import { github } from '@retouche/adapter-github';

init({
  adapter: github({
    owner: 'example',
    repo: 'retouche',
    commit: {
      message: 'retouche: content update',
      committer: {
        name: 'Unknown',
        email: 'retouche@example.com',
      },
    },
  }),
});
```

```ts [GitLab]
// main.ts

import { init } from 'retouche';
import { gitlab } from '@retouche/adapter-gitlab';

init({
  adapter: gitlab({
    project: 1,
    commit: {
      message: 'retouche: content update',
    },
  }),
});
```

:::

### Annotations

Now, annotate elements.

::: code-group

```html [HTML]
<p data-retouche>Hallo Welt!</p>

<a data-retouche-link href="https://www.zugriff.eu">
  <img data-retouche-file src="/logo.svg" />
</a>
```

```svelte [Svelte]
<script>
  import Logo from "$assets/logo.svg";
</script>

<p data-retouche>Hallo Welt!</p>

<a data-retouche-link href="https://www.zugriff.eu">
  <img data-retouche-file src={Logo} />
</a>
```

```ts [TypeScript]
import Logo from './logo.svg';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <p data-retouche>Hallo Welt!</p>

  <a data-retouche-link href="https://www.zugriff.eu">
    <img data-retouche-file src="${Logo}" />
  </a>
`;
```

```text [...]
...
```

:::

### Publish

Changes made through the Retouche editor can be published in no time using GitHub Actions or GitLab CI/CD pipelines.  
[Explore](https://github.com/zugriffcloud/retouche/blob/main/.github/workflows/zugriff.yml) how Retouche integrates with [zugriff](https://www.zugriff.eu) on GitHub.
