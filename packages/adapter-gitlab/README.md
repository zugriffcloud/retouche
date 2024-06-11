# @retouche/adapter-gitlab

Please see https://retouche.zugriff.eu for more information.

## Usage

Call the Retouche initialisation function within a shared client layout file (e.g. `+layout.svelte`) if possible.  
The editor will only mount if the `edit` key is in the query string.

```ts
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
