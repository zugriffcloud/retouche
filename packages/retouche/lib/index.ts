import { interactions } from '$lib/interactions';

export interface Interactions {
  renderEditableText: (element: HTMLElement) => Promise<void>;
  renderEditableFile: (element: HTMLElement) => Promise<void>;
  renderEditableLink: (element: HTMLElement) => Promise<void>;
  renderInit: (
    edit: () => Promise<void>,
    publish: () => Promise<void>
  ) => Promise<void>;
  unauthorised: (path: string | undefined) => Promise<never>;
  unmatchedChecksum: (path: string) => Promise<never>;
  unknownFile: (path: string) => Promise<never>;
  getReplacements: () => Promise<{ [key: string]: string }>;
  getTargetedReplacements: () => Promise<{
    [key: string]: {
      checksum: number;
      from: number;
      to: number;
      replacement: string;
      element: HTMLElement;
    }[];
  }>;
  requestCredentials: <M extends 'bearer' | 'basic'>(
    mode: M
  ) => Promise<
    M extends 'bearer'
      ? string
      : M extends 'basic'
        ? { username: string; password: string }
        : never
  >;
  published: () => Promise<void>;
  expectedChangeDescription: () => Promise<never>;
  requestChangeDescription: () => Promise<string | null> | string | null;
  unknownError: () => Promise<never> | never;
}

export type Adapter = (interact: Interactions) => {
  hooks?: {
    beforeInitialisation?: () => Promise<void>;
    beforeEdit?: () => Promise<void>;
    afterEdit?: () => Promise<void>;
    beforePublish?: () => Promise<void>;
    afterPublish?: () => Promise<void>;
  };
  actions: {
    getFile: (path: string) => Promise<string>;
    getMetadata: (path: string) => Promise<void>;
    putFile: (path: string, content: string) => Promise<void>;
  };
};

export function init(options: {
  adapter: Adapter;
  interactions?: Interactions;
}) {
  if (!options.interactions) {
    options.interactions = interactions;
  }

  let eventListeners: { [key: string]: Array<() => void | Promise<void>> } = {
    edit: [],
    publish: [],
  };

  async function dispatch(event: 'edit' | 'publish') {
    for (let callback of eventListeners[event]) {
      await callback();
    }
  }

  function addEventListener(
    event: 'edit' | 'publish',
    callback: () => void | Promise<void>
  ) {
    eventListeners[event]?.push(callback);
  }

  function removeEventListener(
    event: 'edit' | 'publish',
    callback: () => void | Promise<void>
  ) {
    if (eventListeners[event]) {
      eventListeners[event] = eventListeners[event].filter(
        (c) => c != callback
      );
    }
  }

  if (new URLSearchParams(window.location.search).get('edit') === null) {
    return {
      addEventListener,
      removeEventListener,
    };
  }

  const adapter = options.adapter(options.interactions);

  (async () => {
    await adapter.hooks?.beforeInitialisation?.();
    await options.interactions.renderInit(edit, publish);
  })();

  async function edit() {
    await dispatch('edit');
    await adapter.hooks?.beforeEdit?.();
    await renderEditableIndicator();
    await adapter.hooks?.afterEdit?.();
  }

  async function publish() {
    await dispatch('publish');
    await adapter.hooks?.beforePublish?.();

    for (let [path, file] of Object.entries(
      await options.interactions.getReplacements()
    )) {
      path = decodeURIComponent(path);
      await adapter.actions.getMetadata(path);
      await adapter.actions.putFile(path, file);
    }

    let orderedTargeted: {
      [key: string]: {
        file: string;
        offset: number;
        ops: { from: number; to: number; replacement: string }[];
      };
    } = {};

    for (let [path, meta] of Object.entries(
      await options.interactions.getTargetedReplacements()
    )) {
      let file = fromBase64(
        await adapter.actions.getFile(decodeURIComponent(path))
      );

      if (adler32(file) == meta[meta.length - 1].checksum) {
        orderedTargeted[path] = {
          file,
          offset: 0,
          ops: meta.sort((a, b) => {
            // Sort ops in order to manage offset
            if (a.from > b.from) {
              return 1;
            }
            return -1;
          }),
        };
      } else {
        options.interactions.unmatchedChecksum(decodeURIComponent(path));
      }
    }

    for (let path of Object.keys(orderedTargeted)) {
      let entry = orderedTargeted[path];
      let offset = entry.offset;
      for (let op of entry.ops) {
        let a = entry.file.slice(0, op.from + offset);
        let b = entry.file.slice(op.to + offset);

        // Close empty, self-closing elements
        let selfClosing = /\/\s*>$/;
        if (selfClosing.test(a)) {
          let tags = Array.from(a.matchAll(/<\s*?([^>\/\s]+)/g));
          a.replace(selfClosing, '>');
          b = '</' + tags[tags.length - 1][1] + '>' + b;
        }

        let content = a + op.replacement + b;
        offset += content.length - entry.file.length;
        entry.file = content;
        continue;
      }

      entry.ops = [];
      await adapter.actions.putFile(
        decodeURIComponent(path),
        toBase64(entry.file)
      );
    }

    await adapter.hooks?.afterPublish?.();
    await options.interactions.published();
    return;
  }

  async function renderEditableIndicator() {
    // Render Text indicators
    {
      let editables = document.querySelectorAll('[data-retouche]');
      for (let editable of editables) {
        if (
          !(editable instanceof HTMLElement) ||
          editable.getAttribute('data-retouche') == null ||
          editable.getAttribute('data-retouche') == ''
        )
          continue;
        await options.interactions.renderEditableText(editable);
      }
    }

    // Render File indicators
    {
      let editables = document.querySelectorAll('[data-retouche-file]');
      for (let editable of editables) {
        if (
          !(editable instanceof HTMLElement) ||
          editable.getAttribute('data-retouche-file') == null ||
          editable.getAttribute('data-retouche-file') == ''
        )
          continue;
        await options.interactions.renderEditableFile(editable);
      }
    }

    // Render link indicators
    {
      let editables = document.querySelectorAll('[data-retouche-link]');
      for (let editable of editables) {
        if (
          !(editable instanceof HTMLElement) ||
          editable.getAttribute('data-retouche-link') == null ||
          editable.getAttribute('data-retouche-link') == ''
        )
          continue;
        await options.interactions.renderEditableLink(editable);
      }
    }
  }

  return {
    addEventListener,
    removeEventListener,
  };
}

function adler32(value: string) {
  let a = 1;
  let b = 0;

  for (let i = 0; i < value.length; i += 1) {
    a += value.charCodeAt(i);
    b = b + a;
  }

  return (b << 16) + a;
}

function fromBase64(input: string): string {
  return new TextDecoder().decode(
    Uint8Array.from(atob(input), (m) => m.codePointAt(0))
  );
}

function toBase64(input: string): string {
  return btoa(
    Array.from(new TextEncoder().encode(input), (byte) =>
      String.fromCodePoint(byte)
    ).join('')
  );
}
