# @retouche/adapter-github

Please see https://retouche.zugriff.eu for more information.

## Usage

Call the Retouche initialisation function within a shared client layout file (e.g. `+layout.svelte`) if possible.  
The editor will only mount if the `edit` key is in the query string.

```ts
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
