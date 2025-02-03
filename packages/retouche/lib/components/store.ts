import { writable, get } from 'svelte/store';

export let targeted: {
  [key: string]: {
    checksum: number;
    from: number;
    to: number;
    replacement: string;
    element: HTMLElement;
  }[];
} = {};

export let replacements: {
  [key: string]: string;
} = {};

export const trigger = writable(0);

window.addEventListener('resize', increaseTrigger);

export function increaseTrigger() {
  let count = get(trigger) + 1;
  if (count < 100000) {
    trigger.set(count + 1);
  } else {
    trigger.set(0);
  }
}

export function clean() {
  targeted = {};
  replacements = {};
}
