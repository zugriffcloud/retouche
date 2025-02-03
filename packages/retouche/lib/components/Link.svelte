<script lang="ts">
  import { onMount } from 'svelte';
  import { targeted, trigger } from './store';

  let { element }: { element: HTMLElement } = $props();

  let sizing = $state(element.getBoundingClientRect());

  let [path, _checksum, _from, _to] = element
    .getAttribute('data-retouche-link')!
    .split(':');
  path = decodeURIComponent(path);
  let checksum = Number(_checksum);
  let from = Number(_from);
  let to = Number(_to);

  function update() {
    if (targeted[path]) {
      let found = false;
      targeted[path].forEach((value) => {
        if (value.element == element) {
          found = true;
          value.replacement = href!;
        }
      });

      if (!found) {
        targeted[path].push({
          checksum,
          from,
          to,
          replacement: href!,
          element,
        });
      }
    } else {
      targeted[path] = [{ checksum, from, to, replacement: href!, element }];
    }
  }

  function size() {
    sizing = element.getBoundingClientRect();
  }

  let href = $state(element.getAttribute('href'));

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
  <span class="label">{element.tagName.toLowerCase()}</span>
  <input
    type="text"
    style="width: {sizing.width}px"
    bind:value={href}
    oninput={update}
  />
</div>

<style lang="scss">
  * {
    box-sizing: border-box;
  }

  div.container {
    position: absolute;
    border: 1px solid #0a0ac9;
    border-radius: 0 5px 5px 5px;
    pointer-events: none;

    span.label {
      pointer-events: all;
      position: absolute;
      display: inline-block;
      bottom: 100%;
      left: -1px;
      padding: 1px 5px;
      border-radius: 5px 5px 0 0;
      color: white;
      background: #0a0ac9;
      @media screen and (pointer: fine) {
        &:hover {
          opacity: 0.2;
        }
      }
    }

    input {
      position: absolute;
      pointer-events: all;
      top: 100%;
      width: 134px;
      display: block;
    }
  }
</style>
