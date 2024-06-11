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

window.addEventListener('resize', () => {
  trigger.set(get(trigger) + 1);
});

export function clean() {
  targeted = {};
  replacements = {};
}
