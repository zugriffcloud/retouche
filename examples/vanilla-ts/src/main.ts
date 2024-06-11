import './style.css';
import typescriptLogo from './typescript.svg';
import viteLogo from '/vite.svg';
import { setupCounter } from './counter.ts';

import { github } from '@retouche/adapter-github';
import { init } from 'retouche';

let retouche = init({
  adapter: github({
    owner: 'zugriffcloud',
    repo: 'retouche',
    commit: {
      message: 'retouche: content update',
      requestChangeDescription: 'lax',
      committer: { name: 'Unknown', email: 'unknown@zugriff.eu' },
    },
  }),
});

retouche.addEventListener('edit', () => console.debug('Editing …'));
retouche.addEventListener('publish', () => console.debug('Publishing …'));

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <a data-retouche-link href="https://vitejs.dev" target="_blank">
      <img data-retouche-file src="${viteLogo}" class="logo" alt="Vite logo" />
    </a>
    <a data-retouche-link href="https://www.typescriptlang.org/" target="_blank">
      <img data-retouche-file src="${typescriptLogo}" class="logo vanilla" alt="TypeScript logo" />
    </a>
    <h1 data-retouche>Vite + TypeScript + Retouche + zugriff</h1>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
    <p class="read-the-docs" data-retouche>
      Click on the Vite and TypeScript logos to learn more
    </p>
  </div>
`;

setupCounter(document.querySelector<HTMLButtonElement>('#counter')!);
