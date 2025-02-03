<script lang="ts">
  import { onMount } from 'svelte';
  import { replacements, trigger } from './store';
  import { get } from 'svelte/store';

  let { element }: { element: HTMLElement } = $props();

  let backup = '';

  if (
    element instanceof HTMLMediaElement ||
    element instanceof HTMLImageElement
  ) {
    backup = element.src;
  }

  element.style.pointerEvents = 'none';
  let sizing = $state(element.getBoundingClientRect());
  let path = decodeURIComponent(element.getAttribute('data-retouche-file')!);
  let format = path.split('/').pop()!.split('.');
  format.shift();
  let accept: string | undefined = $state(undefined);
  if (format.length > 0) {
    accept = '.' + format.join('.');
  }

  let input: HTMLInputElement;

  function size() {
    sizing = element.getBoundingClientRect();
  }

  async function blobToBase64(file: Blob): Promise<string> {
    let resolver: (value: string) => void;
    let promise = new Promise<string>((resolve) => (resolver = resolve));

    const reader = new FileReader();
    reader.onload = (_) => {
      resolver((reader.result as unknown as string).replace(/^.*?base64,/, ''));
    };

    reader.readAsDataURL(file);

    return promise;
  }

  async function change() {
    let siblings = document.querySelectorAll(
      '[data-retouche-file="' + encodeURIComponent(path) + '"]'
    );

    if (input.files && input.files!.length == 1) {
      let file = input.files[0];

      replacements[path] = await blobToBase64(file);
      for (let element of siblings) {
        if (
          element instanceof HTMLMediaElement ||
          element instanceof HTMLImageElement
        ) {
          element.src = URL.createObjectURL(file);

          element.onload = () => trigger.set(get(trigger) + 1);
          element.onerror = () => trigger.set(get(trigger) + 1);
        }
      }
    } else {
      delete replacements[path];
      for (let element of siblings) {
        if (
          element instanceof HTMLMediaElement ||
          element instanceof HTMLImageElement
        ) {
          element.src = backup;
        }
      }
    }
  }

  onMount(() => {
    let unsubscribe = trigger.subscribe(size);
    size();

    return () => {
      unsubscribe();
    };
  });
</script>

<div
  class="container"
  style="height: {sizing.height}px; width: {sizing.width}px; top: {sizing.top +
    (window?.scrollY || 0)}px; left: {sizing.left + (window?.scrollX || 0)}px"
>
  <span class="label">{accept || '*'}</span>
  <input
    style="height: {sizing.height}px; width: {sizing.width}px"
    type="file"
    bind:this={input}
    onchange={change}
    {accept}
  />
</div>

<style lang="scss">
  * {
    box-sizing: border-box;
  }

  div.container {
    position: absolute;
    border: 1px solid #911717;
    border-radius: 0 5px 5px 5px;

    span.label {
      pointer-events: all;
      position: absolute;
      display: inline-block;
      bottom: 100%;
      left: -1px;
      padding: 1px 5px;
      border-radius: 5px 5px 0 0;
      color: white;
      background: #911717;
      @media screen and (pointer: fine) {
        &:hover {
          opacity: 0.2;
        }
      }
    }

    input {
      display: block;
      cursor: pointer;
    }
  }
</style>
