<script lang="ts">
  import { increaseTrigger, targeted, trigger } from './store';
  import { onMount } from 'svelte';

  let { element }: { element: HTMLElement } = $props();

  let sizing = $state(element.getBoundingClientRect());
  let contenteditable = element.getAttribute('contenteditable');

  element.setAttribute('contenteditable', 'true');

  let [path, _checksum, _from, _to] = element
    .getAttribute('data-retouche')!
    .split(':');
  path = decodeURIComponent(path);
  let checksum = Number(_checksum);
  let from = Number(_from);
  let to = Number(_to);

  function size() {
    sizing = element.getBoundingClientRect();
  }

  function update() {
    increaseTrigger();

    let clone = element.cloneNode(true);

    function clean(element: HTMLElement) {
      for (let child of element.children) {
        if (child instanceof HTMLElement) {
          clean(child);
        }
      }

      if (contenteditable) {
        element.setAttribute('contenteditable', contenteditable);
      } else {
        element.removeAttribute('contenteditable');
      }

      if (element.getAttribute('data-retouche') != null) {
        element.setAttribute('data-retouche', '');
      }
    }

    let replacement = 'SOMETHING VERY BAD HAPPENED';

    if (clone instanceof HTMLElement) {
      clean(clone);

      replacement = clone.innerHTML.replace(
        /(.*?<[\s\S]*?)data-retouche=""([\s\S]*?>)/gm,
        '$1data-retouche$2'
      );
    }

    if (targeted[path]) {
      let found = false;

      targeted[path].forEach((value) => {
        if (value.element == element) {
          found = true;
          value.replacement = replacement;
        }
      });

      if (!found) {
        targeted[path].push({ checksum, from, to, replacement, element });
      }
    } else {
      targeted[path] = [{ checksum, from, to, replacement, element }];
    }
  }

  onMount(() => {
    let unsubscribe = trigger.subscribe(size);
    size();

    element.addEventListener('input', update);

    return () => {
      unsubscribe();
      element.removeEventListener('input', update);
    };
  });
</script>

<div
  class="container"
  style="height: {sizing.height}px; width: {sizing.width}px; top: {sizing.top +
    (window?.scrollY || 0)}px; left: {sizing.left + (window?.scrollX || 0)}px"
>
  <span class="label">{element.tagName.toLowerCase()}</span>
</div>

<style lang="scss">
  * {
    box-sizing: border-box;
  }

  div.container {
    position: absolute;
    border: 1px solid #911717;
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
      background: #911717;
      @media screen and (pointer: fine) {
        &:hover {
          opacity: 0.2;
        }
      }
    }
  }
</style>
